// file: controllers/absensiSantri.js
const { JadwalRutin, Kegiatan, Santri, Kelas, AbsenKegiatan, sequelize, Pegawai, KelasMusyrif } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
require('moment/locale/id');

// file: controllers/absensiSantri.js

const getKegiatanHariIni = async (req, res) => {
    try {
        // --- PERBAIKAN DI BARIS INI ---
        // Kita harus mengambil 'jenis_kelamin' dari req.user dan menamainya 'jenisKelaminMusyrif'
        const { id_pegawai, jenis_kelamin: jenisKelaminMusyrif } = req.user;
        // --- AKHIR PERBAIKAN ---

        if (!id_pegawai) {
            return res.status(403).json({ message: "Akses ditolak. Anda bukan pegawai." });
        }

        const kelasAsuhan = await KelasMusyrif.findAll({
            where: { id_pegawai },
            attributes: ['id_kelas']
        });

        if (kelasAsuhan.length === 0) {
            return res.status(200).json([]);
        }
        const kelasIds = kelasAsuhan.map(k => k.id_kelas);
        
        // Sekarang variabel 'jenisKelaminMusyrif' sudah ada dan bisa digunakan di sini
        let targetJenisKelaminSantri;
        if (jenisKelaminMusyrif === 'Laki-laki' || jenisKelaminMusyrif === 'Putra') {
            targetJenisKelaminSantri = 'Putra';
        } else if (jenisKelaminMusyrif === 'Perempuan' || jenisKelaminMusyrif === 'Putri') {
            targetJenisKelaminSantri = 'Putri';
        } else {
            return res.status(200).json([]);
        }

        const santriAsuhan = await Santri.findAll({
            where: { 
                id_kelas: { [Op.in]: kelasIds },
                status_aktif: true,
                jenis_kelamin: targetJenisKelaminSantri
            },
            attributes: ['id_santri']
        });
        
        if (santriAsuhan.length === 0) {
            return res.status(200).json([]);
        }
        const totalSantri = santriAsuhan.length;
        const santriIds = santriAsuhan.map(s => s.id_santri);

        // Menentukan jenis jadwal (logika ini sudah benar)
        let jenisJadwalRutin, jenisKegiatanTambahan;
        if (targetJenisKelaminSantri === 'Putra') {
            jenisJadwalRutin = 'Putra';
            jenisKegiatanTambahan = 'tambahan-putra';
        } else {
            jenisJadwalRutin = 'Putri';
            jenisKegiatanTambahan = 'tambahan-putri';
        }

        const today = moment().tz('Asia/Jakarta');
        const dayName = today.clone().locale('id').format('dddd');
        const dayOfMonth = today.date();
        const todayDate = today.format('YYYY-MM-DD');

        const jadwalRutin = await JadwalRutin.findAll({ where: { jenis: jenisJadwalRutin, [Op.or]: [ { repetitionType: 'harian' }, sequelize.literal(`repetitionType = 'mingguan' AND JSON_CONTAINS(days, '"${dayName}"')`), sequelize.literal(`repetitionType = 'bulanan' AND JSON_CONTAINS(dates, '${dayOfMonth}')`) ] } });
        const kegiatanTambahan = await Kegiatan.findAll({ where: { jenis: jenisKegiatanTambahan, tanggal: { [Op.between]: [`${todayDate} 00:00:00`, `${todayDate} 23:59:59`] } } });

        const formattedJadwal = jadwalRutin.map(j => ({ id: `rutin-${j.id}-${todayDate}-${j.name.replace(/\s/g, '_')}`, name: j.name, time: j.time, icon: j.icon || 'FiCheckSquare', iconBg: j.iconBg || 'bg-gray-100', iconColor: j.iconColor || 'text-gray-600' }));
        const formattedKegiatan = kegiatanTambahan.map(k => ({ id: `tambahan-${k.id_kegiatan}-${k.nama.replace(/\s/g, '_')}`, name: k.nama, time: moment(k.tanggal).tz('Asia/Jakarta').format('HH:mm:ss'), icon: 'FiPlusSquare', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' }));
        
        let allKegiatan = [...formattedJadwal, ...formattedKegiatan];

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
            
            const isCompleted = absensiTercatat.length > 0;

            return {
                ...kegiatan,
                isCompleted,
                summary,
                totalSantri
            };
        }));
        
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
    // Ambil id_pegawai dan juga jenis_kelamin dari user yang login
    const { id_pegawai, jenis_kelamin: jenisKelaminMusyrif } = req.user;
    const { id_kegiatan_unik } = req.params;
    const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
    
    if (!id_pegawai) {
        return res.status(403).json({ message: "Akses ditolak. Anda bukan Pegawai." });
    }

    try {
        // --- TAMBAHAN: Logika untuk memetakan jenis kelamin ---
        // Menangani ambiguitas antara 'Laki-laki' (pegawai) dan 'Putra' (santri)
        let targetJenisKelaminSantri;
        if (jenisKelaminMusyrif === 'Laki-laki') {
            targetJenisKelaminSantri = 'Putra';
        } else if (jenisKelaminMusyrif === 'Perempuan') {
            targetJenisKelaminSantri = 'Putri';
        } else {
            // Jika musyrif tidak punya jenis kelamin, kirim array kosong agar aman
            return res.status(200).json([]);
        }
        // --- AKHIR TAMBAHAN ---

        // Mengambil daftar kelas yang diasuh musyrif (logika ini sudah benar)
        const kelasAsuhan = await KelasMusyrif.findAll({
            where: { id_pegawai },
            attributes: ['id_kelas']
        });
        const kelasIds = kelasAsuhan.map(k => k.id_kelas);

        if (kelasIds.length === 0) {
            return res.status(200).json([]);
        }

        // Mengambil daftar santri dari kelas-kelas tersebut
        const santriDiKelas = await Santri.findAll({
            include: [{
                model: Kelas,
                attributes: ['id_kelas', 'nama_kelas'] 
            }],
            where: { 
                id_kelas: { [Op.in]: kelasIds },
                status_aktif: true,
                // --- TAMBAHAN: Filter berdasarkan jenis kelamin ---
                jenis_kelamin: targetJenisKelaminSantri
            },
            attributes: ['id_santri', 'nama'],
            order: [
                [Kelas, 'nama_kelas', 'ASC'],
                ['nama', 'ASC']
            ]
        });
        
        // ... sisa fungsi tidak perlu diubah ...

        if (santriDiKelas.length === 0) {
            return res.status(200).json([]);
        }

        const santriIds = santriDiKelas.map(s => s.id_santri);

        const existingAbsensi = await AbsenKegiatan.findAll({
            where: {
                id_santri: santriIds,
                id_kegiatan_unik: id_kegiatan_unik,
                tanggal: today
            }
        });

        const groupedByKelas = {};
        santriDiKelas.forEach(santri => {
            const kelasId = santri.Kela.id_kelas;
            if (!groupedByKelas[kelasId]) {
                groupedByKelas[kelasId] = {
                    id_kelas: kelasId,
                    nama_kelas: santri.Kela.nama_kelas,
                    santri: []
                };
            }
            
            const absensi = existingAbsensi.find(a => a.id_santri === santri.id_santri);
            groupedByKelas[kelasId].santri.push({
                id_santri: santri.id_santri,
                nama: santri.nama,
                status: absensi ? absensi.status : 'Hadir'
            });
        });

        const result = Object.values(groupedByKelas);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching santri for absensi:", error);
        res.status(500).json({ message: 'Gagal mengambil data santri', error: error.message });
    }
};


const saveAbsensi = async (req, res) => {
    // Fungsi ini tidak perlu diubah karena sudah generik
    const { id_kegiatan_unik } = req.params;
    const absensiData = req.body;
    const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');

    // Cek apakah ada id_kegiatan dari jadwal rutin atau tambahan
    const [type, id] = id_kegiatan_unik.split('-').slice(0, 2);
    const id_kegiatan = type === 'tambahan' ? parseInt(id, 10) : null;
    
    const t = await sequelize.transaction();

    try {
        const recordsToUpsert = absensiData.map(absen => ({
            id_santri: absen.id_santri,
            id_kegiatan_unik: id_kegiatan_unik,
            tanggal: today,
            status: absen.status,
            id_kegiatan: id_kegiatan, // Tambahkan id_kegiatan jika ada
        }));

        await AbsenKegiatan.bulkCreate(recordsToUpsert, {
            updateOnDuplicate: ["status"],
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