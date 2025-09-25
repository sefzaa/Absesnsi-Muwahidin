// file: controllers/rekapAbsenSekolah.js
const db = require('../models');
const { Op } = require('sequelize');
const Santri = db.Santri;
const KelasSekolah = db.KelasSekolah;
const AbsenSekolah = db.AbsenSekolah;
const JamPelajaran = db.JamPelajaran;
const Pegawai = db.Pegawai;
const moment = require('moment-timezone');

exports.getRekap = async (req, res) => {
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter 'bulan' dan 'tahun' diperlukan." });
    }

    try {
        const bulanFormatted = String(bulan).padStart(2, '0');
        const startDate = moment.tz(`${tahun}-${bulanFormatted}-01`, "Asia/Jakarta").startOf('month').format('YYYY-MM-DD');
        const endDate = moment.tz(`${tahun}-${bulanFormatted}-01`, "Asia/Jakarta").endOf('month').format('YYYY-MM-DD');

        const [santriList, jamPelajaranList, attendanceRecords] = await Promise.all([
            Santri.findAll({
                where: { status_aktif: true, id_kelas_sekolah: { [Op.ne]: null } },
                include: [{
                    model: KelasSekolah,
                    as: 'kelasSekolah',
                    // Menambahkan 'id_kelas' untuk membedakan jenjang MTS/MA di frontend
                    attributes: ['id_kelas_sekolah', 'nama_kelas_sekolah', 'id_kelas'],
                    required: true
                }],
                attributes: ['id_santri', 'nama'],
                order: [
                    [{ model: KelasSekolah, as: 'kelasSekolah' }, 'id_kelas', 'ASC'],
                    [{ model: KelasSekolah, as: 'kelasSekolah' }, 'nama_kelas_sekolah', 'ASC'],
                    ['nama', 'ASC']
                ]
            }),
            JamPelajaran.findAll({ order: [['jam_mulai', 'ASC']] }),
            AbsenSekolah.findAll({
                where: { tanggal: { [Op.between]: [startDate, endDate] } },
                include: [
                    { model: JamPelajaran, attributes: ['id_jam_pelajaran', 'nama_jam'], required: true },
                    { model: Pegawai, attributes: ['nama'], required: true }
                ],
                attributes: ['id_santri', 'tanggal', 'status']
            })
        ]);
        
        const attendanceMap = new Map();
        attendanceRecords.forEach(rec => {
            const record = rec.toJSON();
            if (!attendanceMap.has(record.id_santri)) {
                attendanceMap.set(record.id_santri, []);
            }
            attendanceMap.get(record.id_santri).push({
                tanggal: record.tanggal,
                status: record.status,
                id_jam_pelajaran: record.JamPelajaran.id_jam_pelajaran,
                nama_jam: record.JamPelajaran.nama_jam,
                guru: record.Pegawai.nama
            });
        });

        const rekapByClass = {};
        santriList.forEach(santri => {
            const s = santri.toJSON();
            const kelasId = s.kelasSekolah.id_kelas_sekolah;
            const namaKelas = s.kelasSekolah.nama_kelas_sekolah;
            const idKelasDasar = s.kelasSekolah.id_kelas; // Mengambil id_kelas dasar

            if (!rekapByClass[kelasId]) {
                rekapByClass[kelasId] = {
                    id_kelas_sekolah: kelasId,
                    nama_kelas_sekolah: namaKelas,
                    id_kelas: idKelasDasar, // Menyimpan id_kelas dasar
                    santri: [],
                    master_jp: jamPelajaranList
                };
            }

            const historyList = attendanceMap.get(s.id_santri) || [];
            let hadir = 0, sakit = 0, izin = 0, alpa = 0;
            
            // Membuat history_matrix untuk PDF
            const historyMatrix = {};
            historyList.forEach(rec => {
                if (!historyMatrix[rec.tanggal]) {
                    historyMatrix[rec.tanggal] = {};
                }
                historyMatrix[rec.tanggal][rec.id_jam_pelajaran] = rec.status;

                // Kalkulasi performa dari data yang ada
                if (rec.status === 'Hadir') hadir++;
                else if (rec.status === 'Sakit') sakit++;
                else if (rec.status === 'Izin') izin++;
                else if (rec.status === 'Alpa') alpa++;
            });

            const total = hadir + sakit + izin + alpa;
            const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
            
            // Urutkan historyList berdasarkan tanggal untuk tampilan modal
            historyList.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

            rekapByClass[kelasId].santri.push({
                id_santri: s.id_santri,
                nama: s.nama,
                performance: { hadir, sakit, izin, alpa, total, percentage },
                history: historyList, // Format Array untuk Modal View
                history_matrix: historyMatrix // Format Objek untuk PDF Matriks
            });
        });
        
        const result = Object.values(rekapByClass);
        res.status(200).send(result);
    } catch (error) {
        console.error("Error fetching rekap absen sekolah:", error);
        res.status(500).send({ message: "Gagal mengambil data rekapitulasi." });
    }
};