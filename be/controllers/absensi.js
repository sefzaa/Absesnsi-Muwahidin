// file: controllers/absensi.js
const { JadwalRutin, Kegiatan, Santri, Kamar, AbsenKegiatan, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
require('moment/locale/id');


// --- GANTI FUNGSI INI ---
const getKegiatanHariIni = async (req, res) => {
    try {
        const user = req.user;
        if (user.slug !== 'wali-kamar') {
            return res.status(403).json({ message: "Akses ditolak." });
        }

        // 1. Dapatkan semua santri yang diasuh oleh wali kamar ini
        const santriAsuhan = await Santri.findAll({
            include: [{
                model: Kamar,
                where: { id_wali_kamar: user.id_wali_kamar },
                attributes: []
            }],
            where: { status_aktif: true },
            attributes: ['id_santri']
        });

        if (santriAsuhan.length === 0) {
            return res.status(200).json([]); // Jika tidak ada santri, kirim array kosong
        }
        const totalSantri = santriAsuhan.length;
        const santriIds = santriAsuhan.map(s => s.id_santri);

        // 2. Dapatkan daftar kegiatan seperti sebelumnya (sudah difilter per jenis kelamin)
        const jenisKelaminWali = user.jenis_kelamin_wk;
        let jenisJadwalRutin, jenisKegiatanTambahan;
        if (jenisKelaminWali === 'Putra') {
            jenisJadwalRutin = 'Putra';
            jenisKegiatanTambahan = 'tambahan-putra';
        } else if (jenisKelaminWali === 'Putri') {
            jenisJadwalRutin = 'Putri';
            jenisKegiatanTambahan = 'tambahan-putri';
        } else {
            return res.status(200).json([]);
        }

        const today = moment().tz('Asia/Jakarta');
        const dayName = today.clone().locale('id').format('dddd');
        const dayOfMonth = today.date();
        const todayDate = today.format('YYYY-MM-DD');

        const jadwalRutin = await JadwalRutin.findAll({ where: { jenis: jenisJadwalRutin, [Op.or]: [ { repetitionType: 'harian' }, sequelize.literal(`repetitionType = 'mingguan' AND JSON_CONTAINS(days, '"${dayName}"')`), sequelize.literal(`repetitionType = 'bulanan' AND JSON_CONTAINS(dates, '${dayOfMonth}')`) ] } });
        const kegiatanTambahan = await Kegiatan.findAll({ where: { jenis: jenisKegiatanTambahan, tanggal: { [Op.between]: [`${todayDate} 00:00:00`, `${todayDate} 23:59:59`] } } });

        const formattedJadwal = jadwalRutin.map(j => ({ id: `rutin-${j.id}-${j.name.replace(/\s/g, '_')}`, name: j.name, time: j.time, icon: j.icon || 'FiCheckSquare', iconBg: j.iconBg || 'bg-gray-100', iconColor: j.iconColor || 'text-gray-600' }));
        const formattedKegiatan = kegiatanTambahan.map(k => ({ id: `tambahan-${k.id_kegiatan}-${k.nama.replace(/\s/g, '_')}`, name: k.nama, time: moment(k.tanggal).tz('Asia/Jakarta').format('HH:mm:ss'), icon: 'FiPlusSquare', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' }));
        
        let allKegiatan = [...formattedJadwal, ...formattedKegiatan];

        // 3. Untuk setiap kegiatan, cek status absensinya
        const results = await Promise.all(allKegiatan.map(async (kegiatan) => {
            const absensiTercatat = await AbsenKegiatan.findAll({
                where: {
                    id_kegiatan_unik: kegiatan.id,
                    id_santri: santriIds,
                    tanggal: todayDate
                },
                attributes: ['status']
            });

            let summary = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
            absensiTercatat.forEach(absen => {
                if (summary.hasOwnProperty(absen.status)) {
                    summary[absen.status]++;
                }
            });
            
            // Jika ada absensi tercatat, berarti sudah selesai
            const isCompleted = absensiTercatat.length > 0;

            return {
                ...kegiatan,
                isCompleted,
                summary,
                totalSantri
            };
        }));
        
        // 4. Urutkan hasil akhir berdasarkan waktu
        results.sort((a, b) => {
            if (a.time && b.time) return a.time.localeCompare(b.time);
            if (a.time) return -1;
            if (b.time) return 1;
            return 0;
        });

        res.status(200).json(results);

    } catch (error) {
        console.error("Error fetching kegiatan hari ini:", error);
        res.status(500).json({ message: 'Gagal mengambil data kegiatan', error: error.message });
    }
};

const getSantriForAbsensi = async (req, res) => {
    const { id_wali_kamar } = req.user;
    const { id_kegiatan_unik } = req.params;
    const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
    
    if (!id_wali_kamar) {
        return res.status(403).json({ message: "Akses ditolak. Anda bukan Wali Kamar." });
    }

    try {
        // 1. Ambil semua santri yang diasuh, sertakan informasi kamar mereka
        const santriDiKamar = await Santri.findAll({
            include: [{
                model: Kamar,
                where: { id_wali_kamar },
                attributes: ['id_kamar', 'nomor_kamar'] // Ambil id dan nama kamar
            }],
            where: { status_aktif: true },
            attributes: ['id_santri', 'nama'],
            order: [
                [Kamar, 'nomor_kamar', 'ASC'], // Urutkan berdasarkan nama kamar
                ['nama', 'ASC'] // Lalu urutkan berdasarkan nama santri
            ]
        });
        
        if (santriDiKamar.length === 0) {
            return res.status(200).json([]);
        }

        const santriIds = santriDiKamar.map(s => s.id_santri);

        // 2. Ambil data absensi yang sudah ada
        const existingAbsensi = await AbsenKegiatan.findAll({
            where: {
                id_santri: santriIds,
                id_kegiatan_unik: id_kegiatan_unik,
                tanggal: today
            }
        });

        // 3. Kelompokkan santri berdasarkan kamar
        const groupedByKamar = {};
        santriDiKamar.forEach(santri => {
            const kamarId = santri.Kamar.id_kamar;
            if (!groupedByKamar[kamarId]) {
                groupedByKamar[kamarId] = {
                    id_kamar: kamarId,
                    nomor_kamar: santri.Kamar.nomor_kamar,
                    santri: []
                };
            }
            
            const absensi = existingAbsensi.find(a => a.id_santri === santri.id_santri);
            groupedByKamar[kamarId].santri.push({
                id_santri: santri.id_santri,
                nama: santri.nama,
                status: absensi ? absensi.status : 'Hadir'
            });
        });

        // 4. Ubah format menjadi array dan kirim sebagai response
        const result = Object.values(groupedByKamar);

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching santri for absensi:", error);
        res.status(500).json({ message: 'Gagal mengambil data santri', error: error.message });
    }
};

const saveAbsensi = async (req, res) => {
    const { id_kegiatan_unik } = req.params;
    const absensiData = req.body;
    const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
    const t = await sequelize.transaction();

    try {
        // Menggunakan bulkCreate untuk efisiensi dengan opsi 'updateOnDuplicate'
        const recordsToUpsert = absensiData.map(absen => ({
            id_santri: absen.id_santri,
            id_kegiatan_unik: id_kegiatan_unik,
            tanggal: today,
            status: absen.status
        }));

        await AbsenKegiatan.bulkCreate(recordsToUpsert, {
            updateOnDuplicate: ["status"], // Kolom yang diupdate jika terjadi duplikasi
            transaction: t
        });

        await t.commit();
        res.status(200).json({ message: 'Absensi berhasil disimpan.' });
    } catch (error) {
        await t.rollback();
        console.error("Error saving absensi:", error);
        res.status(500).json({ message: 'Gagal menyimpan absensi', error: error.message });
    }
};

module.exports = {
    getKegiatanHariIni,
    getSantriForAbsensi,
    saveAbsensi,
};