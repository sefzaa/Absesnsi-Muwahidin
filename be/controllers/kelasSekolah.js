const { sequelize, KelasSekolah, Santri, Kelas } = require('../models');
const { Op } = require('sequelize');

// --- CRUD untuk Kelas Sekolah ---

exports.create = async (req, res) => {
    // Baris ini akan mencetak data yang dikirim dari form ke terminal backend Anda
    
    try {
        const { nama_kelas_sekolah, id_kelas, kapasitas, jenis_kelamin } = req.body;

        // Validasi untuk memastikan tidak ada field penting yang kosong
        if (!nama_kelas_sekolah || !id_kelas || !kapasitas || !jenis_kelamin) {
            console.log("VALIDASI GAGAL: Ada field yang kosong."); // Log tambahan
            return res.status(400).json({ message: "Semua field wajib diisi: Nama Kelas, Tingkatan, Kapasitas, dan Jenis." });
        }

        const kelasSekolah = await KelasSekolah.create({ nama_kelas_sekolah, id_kelas, kapasitas, jenis_kelamin });
        res.status(201).json(kelasSekolah);

    } catch (error) {
        // Log ini akan menampilkan error detail dari Sequelize/Database di terminal
        console.error("ERROR SAAT MENCOBA CREATE:", error); 
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Nama kelas sekolah sudah ada.' });
        }
        res.status(500).json({ message: error.message });
    }
};

exports.findAll = async (req, res) => {
    try {
        const kelasSekolahList = await KelasSekolah.findAll({
            include: [
                { model: Kelas, as: 'tingkatan', attributes: ['nama_kelas'] },
                { model: Santri, as: 'santri', attributes: ['id_santri'] }
            ],
            // V V V BARIS INI TELAH DIPERBAIKI V V V
            order: [['id_kelas', 'ASC']]
        });
        
        const formattedData = kelasSekolahList.map(ks => ({
            ...ks.toJSON(),
            jumlah_santri: ks.santri.length
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        console.error("Error di findAll kelasSekolah:", error); // Tambahkan log untuk debug
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await KelasSekolah.update(req.body, { where: { id_kelas_sekolah: id } });
        if (updated) {
            const updatedKelas = await KelasSekolah.findByPk(id);
            res.status(200).json(updatedKelas);
        } else {
            res.status(404).json({ message: 'Kelas tidak ditemukan.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Manajemen Santri per Kelas ---

exports.getStudentsInClass = async (req, res) => {
    try {
        const { id } = req.params;
        const students = await Santri.findAll({ where: { id_kelas_sekolah: id }, attributes: ['id_santri', 'nama'] });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUnassignedStudents = async (req, res) => {
    try {
        const { jenis_kelamin, id_kelas } = req.query;
        const students = await Santri.findAll({
            where: {
                id_kelas_sekolah: { [Op.is]: null },
                jenis_kelamin: jenis_kelamin,
                id_kelas: id_kelas // Filter berdasarkan tingkatan
            },
            attributes: ['id_santri', 'nama']
        });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addStudentToClass = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_santri, id_kelas_sekolah } = req.body;

        const kelas = await KelasSekolah.findByPk(id_kelas_sekolah, { include: ['santri'], transaction: t });
        if (kelas.santri.length >= kelas.kapasitas) {
            await t.rollback();
            return res.status(409).json({ message: 'Kapasitas kelas sudah penuh.' });
        }

        await Santri.update({ id_kelas_sekolah }, { where: { id_santri }, transaction: t });
        await t.commit();
        res.status(200).json({ message: 'Santri berhasil ditambahkan ke kelas.' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

exports.removeStudentFromClass = async (req, res) => {
    try {
        const { id_santri } = req.body;
        await Santri.update({ id_kelas_sekolah: null }, { where: { id_santri } });
        res.status(200).json({ message: 'Santri berhasil dikeluarkan dari kelas.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Fitur Acak Santri ---

exports.randomizeStudents = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // 1. Kosongkan semua kelas terlebih dahulu
        await Santri.update({ id_kelas_sekolah: null }, { where: { id_kelas_sekolah: { [Op.ne]: null } }, transaction: t });

        // 2. Ambil semua kelas dan santri
        const semuaKelas = await KelasSekolah.findAll({ transaction: t });
        const semuaSantri = await Santri.findAll({ where: { id_kelas_sekolah: null }, transaction: t });

        let santriTeracak = 0;
        
        // 3. Looping per kelas untuk diisi
        for (const kelas of semuaKelas) {
            // Cari santri yang sesuai tingkatan & jenis kelamin & belum punya kelas
            let kandidat = semuaSantri.filter(s => 
                s.id_kelas === kelas.id_kelas && 
                s.jenis_kelamin === kelas.jenis_kelamin &&
                !s.id_kelas_sekolah
            );
            
            // Acak kandidat
            kandidat.sort(() => 0.5 - Math.random());
            
            // Ambil santri sesuai kapasitas
            const santriUntukDimasukkan = kandidat.slice(0, kelas.kapasitas);

            if (santriUntukDimasukkan.length > 0) {
                const idSantri = santriUntukDimasukkan.map(s => s.id_santri);
                
                // Update santri terpilih
                await Santri.update(
                    { id_kelas_sekolah: kelas.id_kelas_sekolah },
                    { where: { id_santri: { [Op.in]: idSantri } }, transaction: t }
                );

                // Tandai santri yang sudah diacak di array utama
                semuaSantri.forEach(s => {
                    if (idSantri.includes(s.id_santri)) {
                        s.id_kelas_sekolah = kelas.id_kelas_sekolah;
                    }
                });
                
                santriTeracak += idSantri.length;
            }
        }

        await t.commit();
        res.status(200).json({ message: `${santriTeracak} santri berhasil diacak ke dalam kelas.` });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Gagal mengacak santri.', error: error.message });
    }
};

// Fungsi untuk mengambil data master tingkatan kelas
exports.getAllTingkatan = async (req, res) => {
    try {
        const tingkatanList = await Kelas.findAll({
            attributes: ['id_kelas', 'nama_kelas'],
            order: [['id_kelas', 'ASC']]
        });
        res.status(200).json(tingkatanList);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const kelas = await KelasSekolah.findByPk(id);
        if (!kelas) {
            return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
        }

        // Sebelum menghapus kelas, set id_kelas_sekolah santri menjadi null
        await Santri.update({ id_kelas_sekolah: null }, { where: { id_kelas_sekolah: id } });

        await kelas.destroy();
        res.status(200).json({ message: 'Kelas berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
