const { JadwalRutin, Kegiatan, Santri, Kelas, AbsenKegiatan, sequelize, Pegawai, KelasMusyrif, AbsenMusyrif } = require('../models'); // <-- Tambahkan AbsenMusyrif
const { Op } = require('sequelize');
const moment = require('moment-timezone');
require('moment/locale/id');

const getKegiatanHariIni = async (req, res) => {
    // ... (fungsi ini tidak perlu diubah, biarkan seperti aslinya)
    try {
        const { id_pegawai, jenis_kelamin: jenisKelaminMusyrif } = req.user;
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

        const formattedJadwal = jadwalRutin.map(j => ({ id: `rutin-${j.id_jadwal_rutin}-${todayDate}-${j.name.replace(/\s/g, '_')}`, name: j.name, time: j.time, icon: j.icon || 'FiCheckSquare', iconBg: j.iconBg || 'bg-gray-100', iconColor: j.iconColor || 'text-gray-600' }));
        const formattedKegiatan = kegiatanTambahan.map(k => ({ id: `tambahan-${k.id_kegiatan}-${k.nama.replace(/\s/g, '_')}`, name: k.nama, time: moment(k.tanggal).tz('Asia/Jakarta').format('HH:mm:ss'), icon: 'FiPlusSquare', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' }));
        
        let allKegiatan = [...formattedJadwal, ...formattedKegiatan];

        const results = await Promise.all(allKegiatan.map(async (kegiatan) => {
            const absensiTercatat = await AbsenKegiatan.findAll({ where: { id_kegiatan_unik: kegiatan.id, id_santri: santriIds, tanggal: todayDate }, attributes: ['status'] });
            let summary = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
            absensiTercatat.forEach(absen => { if (summary.hasOwnProperty(absen.status)) { summary[absen.status]++; } });
            const isCompleted = absensiTercatat.length > 0;
            return { ...kegiatan, isCompleted, summary, totalSantri };
        }));
        
        results.sort((a, b) => { if (a.time && b.time) return a.time.localeCompare(b.time); if (a.time) return -1; if (b.time) return 1; return 0; });

        res.status(200).json(results);

    } catch (error) {
        console.error("Error fetching kegiatan hari ini:", error);
        res.status(500).json({ message: 'Gagal mengambil data kegiatan', error: error.message });
    }
};

const getSantriForAbsensi = async (req, res) => {
    // ... (fungsi ini tidak perlu diubah, biarkan seperti aslinya)
    const { id_pegawai, jenis_kelamin: jenisKelaminMusyrif } = req.user;
    const { id_kegiatan_unik } = req.params;
    const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
    
    if (!id_pegawai) {
        return res.status(403).json({ message: "Akses ditolak. Anda bukan Pegawai." });
    }

    try {
        let targetJenisKelaminSantri;
        if (jenisKelaminMusyrif === 'Laki-laki') {
            targetJenisKelaminSantri = 'Putra';
        } else if (jenisKelaminMusyrif === 'Perempuan') {
            targetJenisKelaminSantri = 'Putri';
        } else {
            return res.status(200).json([]);
        }

        const kelasAsuhan = await KelasMusyrif.findAll({ where: { id_pegawai }, attributes: ['id_kelas'] });
        const kelasIds = kelasAsuhan.map(k => k.id_kelas);

        if (kelasIds.length === 0) {
            return res.status(200).json([]);
        }

        const santriDiKelas = await Santri.findAll({
            include: [{ model: Kelas, attributes: ['id_kelas', 'nama_kelas'] }],
            where: { 
                id_kelas: { [Op.in]: kelasIds },
                status_aktif: true,
                jenis_kelamin: targetJenisKelaminSantri
            },
            attributes: ['id_santri', 'nama'],
            order: [ [Kelas, 'nama_kelas', 'ASC'], ['nama', 'ASC'] ]
        });
        
        if (santriDiKelas.length === 0) {
            return res.status(200).json([]);
        }

        const santriIds = santriDiKelas.map(s => s.id_santri);
        const existingAbsensi = await AbsenKegiatan.findAll({ where: { id_santri: santriIds, id_kegiatan_unik: id_kegiatan_unik, tanggal: today } });

        const groupedByKelas = {};
        santriDiKelas.forEach(santri => {
            const kelasId = santri.Kela.id_kelas;
            if (!groupedByKelas[kelasId]) {
                groupedByKelas[kelasId] = { id_kelas: kelasId, nama_kelas: santri.Kela.nama_kelas, santri: [] };
            }
            const absensi = existingAbsensi.find(a => a.id_santri === santri.id_santri);
            groupedByKelas[kelasId].santri.push({ id_santri: santri.id_santri, nama: santri.nama, status: absensi ? absensi.status : 'Hadir' });
        });

        const result = Object.values(groupedByKelas);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching santri for absensi:", error);
        res.status(500).json({ message: 'Gagal mengambil data santri', error: error.message });
    }
};

// --- ▼▼▼ FUNGSI INI YANG DIPERBARUI ▼▼▼ ---
const saveAbsensi = async (req, res) => {
    const { id_kegiatan_unik } = req.params;
    const absensiData = req.body;
    const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
    
    // Ambil data musyrif dari token yang sudah diverifikasi middleware
    const { id_pegawai: id_pegawai_musyrif, jabatan: jabatan_user } = req.user;

    // Pastikan hanya musyrif yang bisa menjalankan fungsi ini
    if (jabatan_user !== 'musyrif') {
        return res.status(403).send({ message: "Hanya Musyrif yang dapat menyimpan absensi kegiatan." });
    }

    // Ekstrak nama kegiatan dari id_kegiatan_unik
    // Contoh: 'rutin-1-2025-09-10-Shalat_Subuh' -> 'Shalat Subuh'
    const namaKegiatan = id_kegiatan_unik.split('-').slice(3).join(' ').replace(/_/g, ' ');
    
    const [type, id] = id_kegiatan_unik.split('-').slice(0, 2);
    const id_kegiatan = type === 'tambahan' ? parseInt(id, 10) : null;
    
    const t = await sequelize.transaction();

    try {
        // 1. Simpan absensi santri (logika Anda yang sudah ada)
        const recordsToUpsert = absensiData.map(absen => ({
            id_santri: absen.id_santri,
            id_kegiatan_unik: id_kegiatan_unik,
            tanggal: today,
            status: absen.status,
            id_kegiatan: id_kegiatan,
        }));

        await AbsenKegiatan.bulkCreate(recordsToUpsert, {
            updateOnDuplicate: ["status"],
            transaction: t
        });

        // 2. Rekap otomatis kehadiran Musyrif
        await AbsenMusyrif.findOrCreate({
            where: {
                id_pegawai: id_pegawai_musyrif,
                id_kegiatan_unik: id_kegiatan_unik,
                tanggal: today
            },
            defaults: {
                nama_kegiatan: namaKegiatan,
                status: 'Hadir'
            },
            transaction: t
        });

        await t.commit();
        res.status(200).json({ message: 'Absensi santri dan kehadiran musyrif berhasil disimpan.' });
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
