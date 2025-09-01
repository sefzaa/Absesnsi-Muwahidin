const { Asrama, Kamar, WaliKamar, Santri, Kelas, sequelize } = require('../models');
const { Op } = require('sequelize');

// Fungsi helper untuk mengacak array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// GET /api/kamar/asrama
exports.getAllAsramaWithKamar = async (req, res) => {
    try {
        // MODIFIED: Tambahkan filter berdasarkan jenis kelamin admin
        const adminJenis = req.user.jenis_kelamin === 'Putra' ? 'Putra' : 'Putri';

        const asramaData = await Asrama.findAll({
            where: { jenis: adminJenis }, // <-- Filter di sini
            include: [{
                model: Kamar,
                as: 'Kamars',
                include: [{ model: WaliKamar, as: 'WaliKamar', attributes: ['nama'] }],
            }],
            order: [
                ['nama_gedung', 'ASC'],
                [{ model: Kamar, as: 'Kamars' }, 'id_kamar', 'ASC']
            ]
        });

        // Logika selanjutnya tidak perlu diubah
        const result = await Promise.all(asramaData.map(async (asrama) => {
            const kamarsWithCount = await Promise.all(asrama.Kamars.map(async (kamar) => {
                const count = await Santri.count({ where: { id_kamar: kamar.id_kamar } });
                return { ...kamar.toJSON(), jumlah_penghuni: count };
            }));
            kamarsWithCount.sort((a, b) => a.id_kamar - b.id_kamar);
            return { ...asrama.toJSON(), Kamars: kamarsWithCount };
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching asrama data:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// POST /api/kamar/asrama
exports.createAsrama = async (req, res) => {
    const { nama_gedung, jumlah_kamar } = req.body;
    const t = await sequelize.transaction();
    try {
        if (!nama_gedung || !jumlah_kamar || jumlah_kamar < 1) {
            return res.status(400).json({ message: "Nama gedung dan jumlah kamar harus diisi." });
        }
        
        // MODIFIED: Tentukan jenis asrama berdasarkan admin yang membuat
        const adminJenis = req.user.jenis_kelamin === 'Putra' ? 'Putra' : 'Putri';
        const asrama = await Asrama.create({ nama_gedung, jenis: adminJenis }, { transaction: t }); // <-- Tambahkan 'jenis'

        const kamarsToCreate = [];
        for (let i = 1; i <= jumlah_kamar; i++) {
            kamarsToCreate.push({
                nomor_kamar: `Kamar ${i} - ${nama_gedung}`,
                kapasitas: 10,
                id_asrama: asrama.id_asrama,
            });
        }
        await Kamar.bulkCreate(kamarsToCreate, { transaction: t });
        await t.commit();
        res.status(201).json({ message: "Asrama dan kamar berhasil dibuat.", asrama });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: "Gagal membuat asrama.", error: error.message });
    }
};

// POST /api/kamar/asrama/:id_asrama/kamar
exports.addKamarToAsrama = async (req, res) => {
    const { id_asrama } = req.params;
    try {
        const asrama = await Asrama.findByPk(id_asrama);
        if (!asrama) return res.status(404).json({ message: "Asrama tidak ditemukan." });
        const existingKamars = await Kamar.count({ where: { id_asrama } });
        const newKamarNumber = existingKamars + 1;
        const newKamar = await Kamar.create({
            nomor_kamar: `Kamar ${newKamarNumber} - ${asrama.nama_gedung}`,
            kapasitas: 10,
            id_asrama: id_asrama,
        });
        res.status(201).json({ message: "Kamar berhasil ditambahkan.", kamar: newKamar });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah kamar.", error: error.message });
    }
};

// PUT /api/kamar/kamar/:id_kamar
exports.updateKamar = async (req, res) => {
    try {
        const { id_kamar } = req.params;
        const { nomor_kamar, kapasitas, id_wali_kamar, keterangan_kelas } = req.body;
        const kamar = await Kamar.findByPk(id_kamar);
        if (!kamar) return res.status(404).json({ message: "Kamar tidak ditemukan." });
        kamar.nomor_kamar = nomor_kamar;
        kamar.kapasitas = kapasitas;
        kamar.id_wali_kamar = id_wali_kamar || null;
        kamar.keterangan_kelas = keterangan_kelas;
        await kamar.save();
        res.status(200).json({ message: "Kamar berhasil diperbarui.", kamar });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui kamar.", error: error.message });
    }
};

// DELETE /api/kamar/asrama/:id_asrama
exports.deleteAsrama = async (req, res) => {
    const { id_asrama } = req.params;
    const t = await sequelize.transaction();
    try {
        const asrama = await Asrama.findByPk(id_asrama, { include: ['Kamars'] });
        if (!asrama) return res.status(404).json({ message: "Asrama tidak ditemukan." });
        const kamarIds = asrama.Kamars.map(k => k.id_kamar);
        if (kamarIds.length > 0) {
            await Santri.update({ id_kamar: null }, { where: { id_kamar: kamarIds }, transaction: t });
        }
        await Kamar.destroy({ where: { id_asrama }, transaction: t });
        await asrama.destroy({ transaction: t });
        await t.commit();
        res.status(200).json({ message: "Asrama berhasil dihapus." });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: "Gagal menghapus asrama.", error: error.message });
    }
};

// DELETE /api/kamar/kamar/:id_kamar
exports.deleteKamar = async (req, res) => {
    const { id_kamar } = req.params;
    const t = await sequelize.transaction();
    try {
        const kamar = await Kamar.findByPk(id_kamar);
        if (!kamar) return res.status(404).json({ message: "Kamar tidak ditemukan." });
        await Santri.update({ id_kamar: null }, { where: { id_kamar }, transaction: t });
        await kamar.destroy({ transaction: t });
        await t.commit();
        res.status(200).json({ message: "Kamar berhasil dihapus." });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: "Gagal menghapus kamar.", error: error.message });
    }
};

// GET /api/kamar/wali-kamar-list
exports.getWaliKamarList = async (req, res) => {
    try {
        // MODIFIED: Filter wali kamar berdasarkan jenis kelamin admin
        const waliKamarList = await WaliKamar.findAll({ 
            where: { jenis_kelamin: req.user.jenis_kelamin }, // <-- Filter di sini
            attributes: ['id_wali_kamar', 'nama'], 
            order: [['nama', 'ASC']] 
        });
        res.status(200).json(waliKamarList);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil daftar wali kamar." });
    }
};

// GET /api/kamar/kamar/:id_kamar/santri
exports.getSantriInKamar = async (req, res) => {
    try {
        const { id_kamar } = req.params;
        const santri = await Santri.findAll({ where: { id_kamar }, attributes: ['id_santri', 'nama'], order: [['nama', 'ASC']] });
        res.status(200).json(santri);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data santri." });
    }
};

// GET /api/kamar/kamar/:id_kamar/santri-available
exports.getSantriAvailable = async (req, res) => {
    try {
        const { keterangan_kelas } = req.query;
        
        // MODIFIED: Tambahkan filter jenis kelamin santri
        let whereClause = { 
            id_kamar: null,
            jenis_kelamin: req.user.jenis_kelamin // <-- Filter utama
        };

        if (keterangan_kelas && keterangan_kelas.startsWith('Kelas')) {
            const kelas = await Kelas.findOne({ where: { nama_kelas: keterangan_kelas } });
            if (kelas) {
                whereClause.id_kelas = kelas.id_kelas;
            } else {
                return res.status(200).json([]);
            }
        }
        
        const santri = await Santri.findAll({
            where: whereClause,
            attributes: ['id_santri', 'nama'],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(santri);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data santri tanpa kamar." });
    }
};

// POST /api/kamar/kamar/:id_kamar/santri
exports.addSantriToKamar = async (req, res) => {
    const { id_kamar } = req.params;
    const { id_santri } = req.body;
    try {
        const kamar = await Kamar.findByPk(id_kamar);
        if (!kamar) return res.status(404).json({ message: "Kamar tidak ditemukan." });
        const currentPenghuni = await Santri.count({ where: { id_kamar } });
        if (currentPenghuni >= kamar.kapasitas) {
            return res.status(400).json({ message: "Kapasitas kamar sudah penuh." });
        }
        await Santri.update({ id_kamar }, { where: { id_santri } });
        res.status(200).json({ message: "Santri berhasil ditambahkan." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah santri." });
    }
};

// DELETE /api/kamar/kamar/:id_kamar/santri/:id_santri
exports.removeSantriFromKamar = async (req, res) => {
    const { id_santri } = req.params;
    try {
        await Santri.update({ id_kamar: null }, { where: { id_santri } });
        res.status(200).json({ message: "Santri berhasil dikeluarkan dari kamar." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus santri." });
    }
};

// POST /api/kamar/asrama/:id_asrama/acak-otomatis
// POST /api/kamar/asrama/:id_asrama/acak-otomatis
exports.acakSantriOtomatis = async (req, res) => {
    const { id_asrama } = req.params;
    const t = await sequelize.transaction();
    try {
        const adminJenisKelamin = req.user.jenis_kelamin;

        const allKamarsInAsrama = await Kamar.findAll({ where: { id_asrama } });
        if (allKamarsInAsrama.length === 0) {
            return res.status(400).json({ message: "Asrama ini tidak memiliki kamar." });
        }

        // PERBAIKAN: Baris yang hilang ditambahkan kembali di sini
        const kelasGroups = [...new Set(allKamarsInAsrama
            .map(k => k.keterangan_kelas)
            .filter(ket => ket && ket.startsWith('Kelas'))
        )];

        // PENAMBAHAN: Validasi baru sesuai permintaan Anda
        if (kelasGroups.length === 0) {
            return res.status(400).json({ message: "Harap lengkapi data kamar. Atur peruntukan kelas di setiap kamar sebelum mengacak santri." });
        }

        const responseMessages = [];

        for (const namaKelas of kelasGroups) {
            const kelas = await Kelas.findOne({ where: { nama_kelas: namaKelas } });
            if (!kelas) continue;

            const kamarsTarget = allKamarsInAsrama.filter(k => k.keterangan_kelas === namaKelas);
            const kamarIdsTarget = kamarsTarget.map(k => k.id_kamar);

            // Mengosongkan kamar dari santri yang relevan
            await Santri.update({ id_kamar: null }, {
                where: {
                    id_kamar: { [Op.in]: kamarIdsTarget },
                    id_kelas: kelas.id_kelas,
                    jenis_kelamin: adminJenisKelamin
                },
                transaction: t
            });

            // Mengambil santri yang tersedia untuk diacak
            let santriAvailable = await Santri.findAll({
                where: {
                    id_kamar: null,
                    id_kelas: kelas.id_kelas,
                    jenis_kelamin: adminJenisKelamin
                },
                transaction: t
            });

            if (santriAvailable.length === 0) {
                responseMessages.push(`Tidak ada santri ${namaKelas} ${adminJenisKelamin === 'Putra' ? 'putra' : 'putri'} yang tersedia untuk diacak.`);
                continue;
            }

            santriAvailable = shuffleArray(santriAvailable);
            let santriPlacedCount = 0;
            let santriIndex = 0;

            for (const kamar of kamarsTarget) {
                const currentPenghuni = await Santri.count({ where: { id_kamar: kamar.id_kamar }, transaction: t });
                const slotTersedia = kamar.kapasitas - currentPenghuni;

                for (let i = 0; i < slotTersedia; i++) {
                    if (santriIndex < santriAvailable.length) {
                        const santriToPlace = santriAvailable[santriIndex];
                        await Santri.update({ id_kamar: kamar.id_kamar }, { where: { id_santri: santriToPlace.id_santri }, transaction: t });
                        santriIndex++;
                        santriPlacedCount++;
                    } else break;
                }
                if (santriIndex >= santriAvailable.length) break;
            }

            const sisaSantri = santriAvailable.length - santriPlacedCount;
            if (sisaSantri > 0) {
                responseMessages.push(`Pengacakan ${namaKelas} selesai. ${sisaSantri} santri tidak mendapat kamar karena kapasitas tidak mencukupi.`);
            } else {
                responseMessages.push(`Semua santri ${namaKelas} (${santriPlacedCount} orang) berhasil diacak.`);
            }
        }

        await t.commit();
        res.status(200).json({ messages: responseMessages });

    } catch (error) {
        await t.rollback();
        console.error("Error acak santri otomatis:", error);
        res.status(500).json({ message: "Terjadi kesalahan fatal saat mengacak santri.", error: error.message });
    }
};