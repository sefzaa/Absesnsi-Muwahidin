// controllers/rekapMusyrif.js
const db = require('../models');
const { Op } = require('sequelize');
const Pegawai = db.Pegawai;
const Jabatan = db.Jabatan;
const AbsenMusyrif = db.AbsenMusyrif;

// Fungsi helper untuk mendapatkan nama kegiatan
const getCleanNamaKegiatan = (id_unik) => {
    if (!id_unik) return 'Kegiatan Tidak Dikenal';
    const bagian = id_unik.split('-');
    if (id_unik.startsWith('rutin-')) {
        const namaKegiatan = bagian[bagian.length - 1];
        return namaKegiatan.replace(/_/g, ' ');
    } 
    if (id_unik.startsWith('tambahan-')) {
        const namaKegiatan = bagian.slice(2).join('-');
        return namaKegiatan.replace(/_/g, ' ');
    }
    return id_unik;
};

// --- DIUBAH: Mengambil SEMUA musyrif (putra & putri) ---
exports.getAllMusyrif = async (req, res) => {
    try {
        const musyrif = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama', 'nip', 'jenis_kelamin'], // Tambahkan jenis_kelamin
            include: [{
                model: Jabatan,
                where: { nama_jabatan: 'Musyrif' },
                attributes: []
            }],
            order: [['nama', 'ASC']]
        });

        // Mapping 'Laki-laki'/'Perempuan' ke 'Putra'/'Putri' untuk konsistensi di frontend
        const result = musyrif.map(m => {
            const data = m.toJSON();
            data.jenis_kelamin = data.jenis_kelamin === 'Laki-laki' ? 'Putra' : 'Putri';
            return data;
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching musyrif list:", error);
        res.status(500).send({ message: "Gagal mengambil daftar musyrif." });
    }
};

// Mengambil data rekap absensi untuk satu musyrif (Modal Detail)
exports.getRekapMusyrifDetail = async (req, res) => {
    const { id_pegawai } = req.params;
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter bulan dan tahun diperlukan." });
    }

    try {
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);

        const absensi = await AbsenMusyrif.findAll({
            where: {
                id_pegawai: id_pegawai,
                tanggal: { [Op.between]: [startDate, endDate] }
            },
            attributes: ['tanggal', 'id_kegiatan_unik'],
            order: [['tanggal', 'ASC']]
        });

        const absensiBersih = absensi.map(a => ({
            tanggal: a.tanggal,
            nama_kegiatan: getCleanNamaKegiatan(a.id_kegiatan_unik)
        }));
        
        const semuaKegiatan = [...new Set(absensiBersih.map(a => a.nama_kegiatan))].sort();

        const rekapProses = absensiBersih.reduce((acc, curr) => {
            const tanggal = curr.tanggal;
            const kegiatan = curr.nama_kegiatan;
            if (!acc[tanggal]) acc[tanggal] = [];
            acc[tanggal].push(kegiatan);
            return acc;
        }, {});

        res.status(200).json({ rekap: rekapProses, kegiatan: semuaKegiatan });

    } catch (error) {
        console.error("Error fetching rekap musyrif detail:", error);
        res.status(500).send({ message: "Gagal mengambil detail rekap musyrif." });
    }
};

// --- DIUBAH: Mengambil SEMUA data untuk download + performa ---
exports.getRekapForDownload = async (req, res) => {
    const { bulan, tahun } = req.query;
    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter bulan dan tahun diperlukan." });
    }

    try {
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);

        const allMusyrif = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama', 'nip', 'jenis_kelamin'],
            include: [{ model: Jabatan, where: { nama_jabatan: 'Musyrif' }, attributes: [] }],
            order: [['nama', 'ASC']]
        });

        const absensi = await AbsenMusyrif.findAll({
            where: {
                tanggal: { [Op.between]: [startDate, endDate] }
            },
            attributes: ['id_pegawai', 'tanggal', 'id_kegiatan_unik', 'status'],
        });

        const performance = {};
        
        const absensiBersih = absensi.map(a => ({
            ...a.toJSON(),
            nama_kegiatan: getCleanNamaKegiatan(a.id_kegiatan_unik)
        }));

        absensiBersih.forEach(curr => {
            const musyrifId = curr.id_pegawai;
            if (!performance[musyrifId]) {
                performance[musyrifId] = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0, Total: 0 };
            }
            if (performance[musyrifId][curr.status] !== undefined) {
                performance[musyrifId][curr.status]++;
            }
            performance[musyrifId].Total++;
        });

        const musyrifsWithPerformance = allMusyrif.map(m => {
            const perf = performance[m.id_pegawai] || { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0, Total: 0 };
            return {
                ...m.toJSON(),
                performance: { ...perf },
                jenis_kelamin: m.jenis_kelamin === 'Laki-laki' ? 'Putra' : 'Putri'
            };
        });

        // Pisahkan kegiatan berdasarkan jenis kelamin musyrif yang mengisinya
        const kegiatanPutra = [...new Set(absensiBersih.filter(a => musyrifsWithPerformance.find(m => m.id_pegawai === a.id_pegawai && m.jenis_kelamin === 'Putra')).map(a => a.nama_kegiatan))].sort();
        const kegiatanPutri = [...new Set(absensiBersih.filter(a => musyrifsWithPerformance.find(m => m.id_pegawai === a.id_pegawai && m.jenis_kelamin === 'Putri')).map(a => a.nama_kegiatan))].sort();
        
        // Buat rekap data untuk PDF
        const rekapData = absensiBersih.reduce((acc, curr) => {
            const key = `${curr.id_pegawai}-${curr.nama_kegiatan}-${curr.tanggal}`;
            if (curr.status === 'Hadir') {
                acc[key] = 'H';
            }
            return acc;
        }, {});

        res.status(200).json({
            musyrifs: musyrifsWithPerformance,
            kegiatan: { putra: kegiatanPutra, putri: kegiatanPutri },
            rekapData,
        });

    } catch (error) {
        console.error("Error fetching data for download:", error);
        res.status(500).send({ message: "Gagal mengambil data untuk diunduh." });
    }
};