// file: controllers/rekapAbsenPegawai.js
const db = require('../models');
const { Op } = require('sequelize');
const Pegawai = db.Pegawai;
const Jabatan = db.Jabatan;
const AbsenPegawai = db.AbsenPegawai;
const moment = require('moment-timezone');
const Sequelize = db.Sequelize; // Pastikan Sequelize di-import untuk fn.DISTINCT

exports.getRekap = async (req, res) => {
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter 'bulan' dan 'tahun' diperlukan." });
    }

    try {
        const bulanFormatted = String(bulan).padStart(2, '0');
        const startDate = moment.tz(`${tahun}-${bulanFormatted}-01`, "Asia/Jakarta").startOf('month').format('YYYY-MM-DD');
        const endDate = moment.tz(`${tahun}-${bulanFormatted}-01`, "Asia/Jakarta").endOf('month').format('YYYY-MM-DD');

        // --- PERBAIKAN LOGIKA (REVISI 3) ---
        // 1. Ambil ID pegawai yang memiliki absensi di bulan ini saja
        const attendedPegawaiIds = await AbsenPegawai.findAll({
            where: { tanggal: { [Op.between]: [startDate, endDate] } },
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('id_pegawai')), 'id_pegawai']],
            raw: true
        }).then(results => results.map(item => item.id_pegawai));

        if (attendedPegawaiIds.length === 0) {
            return res.status(200).send([]); // Jika tidak ada data, kirim array kosong
        }

        // 2. Ambil detail pegawai HANYA untuk ID yang ditemukan
        const pegawaiList = await Pegawai.findAll({
            where: { id_pegawai: { [Op.in]: attendedPegawaiIds } },
            include: [{ model: Jabatan, required: true }],
            order: [[Jabatan, 'nama_jabatan', 'ASC'], ['nama', 'ASC']]
        });
        // --- AKHIR PERBAIKAN LOGIKA ---

        const attendanceRecords = await AbsenPegawai.findAll({
            where: { 
                tanggal: { [Op.between]: [startDate, endDate] },
                id_pegawai: { [Op.in]: attendedPegawaiIds }
            }
        });

        const attendanceMap = new Map();
        attendanceRecords.forEach(rec => {
            const record = rec.toJSON();
            if (!attendanceMap.has(record.id_pegawai)) {
                attendanceMap.set(record.id_pegawai, new Map());
            }
            const pegawaiDateMap = attendanceMap.get(record.id_pegawai);
            pegawaiDateMap.set(record.tanggal, record);
        });

        const rekapByJabatan = {};
        pegawaiList.forEach(pegawai => {
            const p = pegawai.toJSON();
            const jabatanId = p.Jabatan.id_jabatan;
            const namaJabatan = p.Jabatan.nama_jabatan;

            if (!rekapByJabatan[jabatanId]) {
                rekapByJabatan[jabatanId] = { id_jabatan: jabatanId, nama_jabatan: namaJabatan, pegawai: [] };
            }

            const pegawaiAttMap = attendanceMap.get(p.id_pegawai);
            let hadir = 0, sakit = 0, izin = 0, alpa = 0, terlambat = 0;
            const history = {};

            if (pegawaiAttMap) {
                pegawaiAttMap.forEach((record, tanggal) => {
                    history[tanggal] = record;
                    if (record.status === 'Hadir') {
                        hadir++;
                        if (record.status_jam_masuk === 'Terlambat') {
                            terlambat++;
                        }
                    }
                    else if (record.status === 'Sakit') sakit++;
                    else if (record.status === 'Izin') izin++;
                    else if (record.status === 'Alpa') alpa++;
                });
            }

            rekapByJabatan[jabatanId].pegawai.push({
                id_pegawai: p.id_pegawai,
                nama: p.nama,
                jabatan: namaJabatan,
                performance: { hadir, sakit, izin, alpa, terlambat },
                history
            });
        });
        
        const result = Object.values(rekapByJabatan);
        res.status(200).send(result);
    } catch (error) {
        console.error("Error fetching rekap absen pegawai:", error);
        res.status(500).send({ message: "Gagal mengambil data rekapitulasi." });
    }
};