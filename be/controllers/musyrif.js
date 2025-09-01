// file: controllers/musyrif.controller.js
const { Kelas, Santri, Pegawai, Jabatan, sequelize } = require('../models');

// 1. Mengambil semua kelas beserta data musyrif dan jumlah santri
exports.getKelasData = async (req, res) => {
    try {
        // Mapping gender untuk santri
        const adminJenisKelaminSantri = req.user.jenis_kelamin; // langsung Putra / Putri

        const kelasData = await Kelas.findAll({
            where: {
                nama_kelas: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']
            },
            include: [
                {
                    model: Pegawai,
                    as: 'musyrifs',
                    attributes: ['id_pegawai', 'nama'],
                    through: { attributes: [] }
                },
                {
                    model: Santri,
                    as: 'Santris',
                    where: { 
                        status_aktif: true,
                        jenis_kelamin: adminJenisKelaminSantri
                    },
                    attributes: [],
                    required: false
                }
            ],
            attributes: [
                'id_kelas',
                'nama_kelas',
                [sequelize.fn('COUNT', sequelize.col('Santris.id_santri')), 'jumlah_santri']
            ],
            group: ['Kelas.id_kelas', 'musyrifs.id_pegawai'],
            order: [['nama_kelas', 'ASC']]
        });
        
        const result = kelasData.reduce((acc, curr) => {
            const { id_kelas, nama_kelas, jumlah_santri } = curr.get();
            const musyrif = curr.musyrifs[0] ? curr.musyrifs[0].get() : null;
            const existingKelas = acc.find(k => k.id_kelas === id_kelas);
            if (existingKelas) {
                if (musyrif) existingKelas.musyrifs.push(musyrif);
            } else {
                acc.push({
                    id_kelas,
                    nama_kelas,
                    jumlah_santri,
                    musyrifs: musyrif ? [musyrif] : []
                });
            }
            return acc;
        }, []);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data kelas.", error: error.message });
    }
};

// 2. Mengambil santri aktif berdasarkan ID Kelas
exports.getSantriByKelas = async (req, res) => {
    try {
        // Santri tetap pakai Putra / Putri
        const adminJenisKelaminSantri = req.user.jenis_kelamin;

        const santri = await Santri.findAll({
            where: { 
                id_kelas: req.params.id_kelas,
                status_aktif: true,
                jenis_kelamin: adminJenisKelaminSantri
            },
            attributes: ['nama'],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(santri);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data santri.", error: error.message });
    }
};


// 3. Mengambil daftar pegawai yang jabatannya Musyrif (untuk dropdown)
exports.getAvailableMusyrif = async (req, res) => {
    try {
        // Mapping untuk pegawai
        const adminJenisKelaminPegawai = req.user.jenis_kelamin === 'Putra' ? 'Laki-laki' : 'Perempuan';

        const musyrifs = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama'],
            where: { jenis_kelamin: adminJenisKelaminPegawai },
            include: {
                model: Jabatan,
                where: { nama_jabatan: 'Musyrif' },
                attributes: []
            },
            order: [['nama', 'ASC']]
        });
        res.status(200).json(musyrifs);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data musyrif.", error: error.message });
    }
};


// 4. Update/assign musyrif ke sebuah kelas
exports.assignMusyrifToKelas = async (req, res) => {
    const { id_kelas } = req.params;
    const { musyrifIds } = req.body; // Array of id_pegawai
    
    const t = await sequelize.transaction();
    try {
        const kelas = await Kelas.findByPk(id_kelas, { transaction: t });
        if (!kelas) {
            return res.status(404).json({ message: "Kelas tidak ditemukan." });
        }

        // `setMusyrifs` adalah method magic yang dibuat Sequelize dari relasi
        await kelas.setMusyrifs(musyrifIds, { transaction: t });
        
        await t.commit();
        res.status(200).json({ message: "Musyrif berhasil diperbarui." });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: "Gagal memperbarui musyrif.", error: error.message });
    }
};