// file: controllers/musyrif.controller.js
const { Kelas, Santri, Pegawai, Jabatan, sequelize } = require('../models');

// 1. Mengambil semua kelas beserta data musyrif dan jumlah santri
exports.getKelasData = async (req, res) => {
    try {
        const adminJenisKelamin = req.user.jenis_kelamin; // 'Putra' atau 'Putri'

        const classes = await Kelas.findAll({
            where: {
                nama_kelas: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']
            },
            include: [{
                model: Pegawai,
                as: 'musyrifs',
                attributes: ['id_pegawai', 'nama'],
                through: { attributes: [] }
            }],
            order: [['nama_kelas', 'ASC']]
        });

        // Query ke tabel 'santri'
        // TIDAK PERLU MAPPING KARENA TABEL 'santri' MENGGUNAKAN 'Putra'/'Putri'
        const santriCounts = await Santri.findAll({
            where: {
                status_aktif: true,
                jenis_kelamin: adminJenisKelamin 
            },
            attributes: [
                'id_kelas',
                [sequelize.fn('COUNT', sequelize.col('id_santri')), 'jumlah_santri']
            ],
            group: ['id_kelas']
        });

        const santriCountMap = santriCounts.reduce((map, item) => {
            map[item.id_kelas] = parseInt(item.get('jumlah_santri'), 10);
            return map;
        }, {});

        const result = classes.map(kelas => ({
            id_kelas: kelas.id_kelas,
            nama_kelas: kelas.nama_kelas,
            musyrifs: kelas.musyrifs,
            jumlah_santri: santriCountMap[kelas.id_kelas] || 0
        }));

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data kelas.", error: error.message });
    }
};


// 2. Mengambil santri aktif berdasarkan ID Kelas
exports.getSantriByKelas = async (req, res) => {
    try {
        const adminJenisKelamin = req.user.jenis_kelamin; // 'Putra' atau 'Putri'

        // Query ke tabel 'santri'
        // TIDAK PERLU MAPPING KARENA TABEL 'santri' MENGGUNAKAN 'Putra'/'Putri'
        const santri = await Santri.findAll({
            where: {
                id_kelas: req.params.id_kelas,
                status_aktif: true,
                jenis_kelamin: adminJenisKelamin
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
        const adminJenisKelamin = req.user.jenis_kelamin; // 'Putra' atau 'Putri'

        // --- ▼▼▼ PERBAIKAN DI SINI ▼▼▼ ---
        // PERLU MAPPING KARENA TABEL 'pegawai' MENGGUNAKAN 'Laki-laki'/'Perempuan'
        const targetPegawaiJenisKelamin = adminJenisKelamin === 'Putra' ? 'Laki-laki' : 'Perempuan';

        const musyrifs = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama'],
            where: { 
                jenis_kelamin: targetPegawaiJenisKelamin // Gunakan hasil mapping
            },
            include: {
                model: Jabatan,
                where: { nama_jabatan: 'Musyrif' },
                attributes: []
            },
            order: [['nama', 'ASC']]
        });
        // --- ▲▲▲ AKHIR PERBAIKAN ---

        res.status(200).json(musyrifs);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data musyrif.", error: error.message });
    }
};

// 4. Update/assign musyrif ke sebuah kelas (TIDAK ADA PERUBAHAN)
exports.assignMusyrifToKelas = async (req, res) => {
    const { id_kelas } = req.params;
    const { musyrifIds } = req.body;
    
    const t = await sequelize.transaction();
    try {
        const kelas = await Kelas.findByPk(id_kelas, { transaction: t });
        if (!kelas) {
            await t.rollback();
            return res.status(404).json({ message: "Kelas tidak ditemukan." });
        }

        await kelas.setMusyrifs(musyrifIds, { transaction: t });
        
        await t.commit();
        res.status(200).json({ message: "Musyrif berhasil diperbarui." });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: "Gagal memperbarui musyrif.", error: error.message });
    }
};