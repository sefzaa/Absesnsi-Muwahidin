// file: controllers/musyrif.controller.js
const { Kelas, Santri, Pegawai, Jabatan, sequelize } = require('../models');

// 1. Mengambil semua kelas beserta data musyrif dan jumlah santri (VERSI PERBAIKAN)
exports.getKelasData = async (req, res) => {
    try {
        // Langkah 1: Ambil semua data kelas beserta relasi musyrif-nya
        const classes = await Kelas.findAll({
            where: {
                nama_kelas: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']
            },
            include: [{
                model: Pegawai,
                as: 'musyrifs', // Alias dari relasi many-to-many
                attributes: ['id_pegawai', 'nama'],
                through: { attributes: [] } // Kita tidak butuh data dari tabel penghubung
            }],
            order: [['nama_kelas', 'ASC']]
        });

        // Langkah 2: Ambil data jumlah santri aktif secara terpisah untuk efisiensi
        const santriCounts = await Santri.findAll({
            where: { status_aktif: true },
            attributes: [
                'id_kelas',
                [sequelize.fn('COUNT', sequelize.col('id_santri')), 'jumlah_santri']
            ],
            group: ['id_kelas']
        });

        // Ubah hasil hitungan santri menjadi sebuah map agar mudah diakses
        const santriCountMap = santriCounts.reduce((map, item) => {
            // item.get('jumlah_santri') mungkin string, ubah ke integer
            map[item.id_kelas] = parseInt(item.get('jumlah_santri'), 10);
            return map;
        }, {});

        // Langkah 3: Gabungkan kedua data tersebut
        const result = classes.map(kelas => ({
            id_kelas: kelas.id_kelas,
            nama_kelas: kelas.nama_kelas,
            musyrifs: kelas.musyrifs, // Ini sekarang akan berisi array lengkap musyrif
            jumlah_santri: santriCountMap[kelas.id_kelas] || 0
        }));

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data kelas.", error: error.message });
    }
};


// 2. Mengambil santri aktif berdasarkan ID Kelas
exports.getSantriByKelas = async (req, res) => {
// ... existing code ...
    try {
        const santri = await Santri.findAll({
            where: { 
                id_kelas: req.params.id_kelas,
                status_aktif: true 
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
// ... existing code ...
    try {
        const adminJenisKelamin = req.user.jenis_kelamin === 'Putra' ? 'Laki-laki' : 'Perempuan';
        const musyrifs = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama'],
            where: { jenis_kelamin: adminJenisKelamin },
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
// ... existing code ...
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
