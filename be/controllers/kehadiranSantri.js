// controllers/kehadiranSantri.js

const { Santri, Kelas, AbsenKegiatan, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper function untuk mem-parsing nama kegiatan secara konsisten
const parseNamaKegiatan = (id_kegiatan_unik) => {
    try {
        const parts = id_kegiatan_unik.split('-');
        // Format rutin: rutin-{id_rutin}-{YYYY}-{MM}-{DD}-{nama_kegiatan}
        if (parts[0] === 'rutin' && parts.length > 5) {
            return parts.slice(5).join(' ').replace(/_/g, ' ');
        }
        // Format tambahan: tambahan-{id_kegiatan}-{nama_kegiatan}
        if (parts[0] === 'tambahan' && parts.length > 2) {
            return parts.slice(2).join(' ').replace(/_/g, ' ');
        }
        return 'Kegiatan Lainnya';
    } catch (e) {
        console.error("Gagal mem-parsing id_kegiatan_unik:", id_kegiatan_unik);
        return 'Kegiatan Tidak Dikenali';
    }
};

exports.getAllKelas = async (req, res) => {
  try {
    const kelas = await Kelas.findAll({
      where: {
        nama_kelas: { [Op.ne]: 'Alumni' }
      },
      order: [['id_kelas', 'ASC']],
    });
    res.status(200).json(kelas);
  } catch (error) {
    console.error('Error fetching kelas:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// REVISI BESAR: Fungsi ini sekarang akan menghitung rekap HISA dan performa
exports.getAllSantri = async (req, res) => {
  try {
    const { id_kelas } = req.query;
    const adminJenisKelamin = req.user.jenis_kelamin;

    let whereClause = {
        jenis_kelamin: adminJenisKelamin
    };

    if (id_kelas && id_kelas !== 'all') {
      whereClause.id_kelas = id_kelas;
    }

    const santriList = await Santri.findAll({
      attributes: ['id_santri', 'nama'],
      include: {
        model: Kelas,
        as: 'Kela',
        attributes: ['nama_kelas'],
        required: true,
        where: {
            nama_kelas: { [Op.ne]: 'Alumni' }
        }
      },
      where: whereClause,
      order: [['nama', 'ASC']],
    });

    if (santriList.length === 0) {
        return res.status(200).json([]);
    }

    // Ambil semua absensi untuk santri yang difilter pada bulan ini
    const santriIds = santriList.map(s => s.id_santri);
    const bulanIni = new Date();
    const startDate = new Date(bulanIni.getFullYear(), bulanIni.getMonth(), 1);
    const endDate = new Date(bulanIni.getFullYear(), bulanIni.getMonth() + 1, 0);

    const absensiBulanIni = await AbsenKegiatan.findAll({
        where: {
            id_santri: { [Op.in]: santriIds },
            tanggal: { [Op.between]: [startDate, endDate] }
        },
        attributes: ['id_santri', 'status']
    });

    // Buat map untuk rekap absensi
    const rekapMap = {};
    santriIds.forEach(id => {
        rekapMap[id] = { H: 0, I: 0, S: 0, A: 0, Total: 0 };
    });

    absensiBulanIni.forEach(absen => {
        const rekap = rekapMap[absen.id_santri];
        if (rekap) {
            if (absen.status === 'Hadir') rekap.H++;
            else if (absen.status === 'Izin') rekap.I++;
            else if (absen.status === 'Sakit') rekap.S++;
            else if (absen.status === 'Alpa') rekap.A++;
            rekap.Total++;
        }
    });

    // Gabungkan data santri dengan rekapnya
    const santriWithRekap = santriList.map(santri => {
        const rekap = rekapMap[santri.id_santri];
        const performance = rekap.Total > 0 ? ((rekap.H / rekap.Total) * 100).toFixed(0) : 0;
        return {
            ...santri.toJSON(),
            rekap: {
                ...rekap,
                performance: parseInt(performance)
            }
        };
    });

    res.status(200).json(santriWithRekap);
  } catch (error) {
    console.error('Error fetching santri with rekap:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAbsensiSantri = async (req, res) => {
  try {
    const { id_santri } = req.params;
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
      return res.status(400).json({ message: 'Bulan dan tahun diperlukan' });
    }

    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0);

    const absensi = await AbsenKegiatan.findAll({
      where: {
        id_santri: id_santri,
        tanggal: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['tanggal', 'DESC']],
    });

    const formattedAbsensi = absensi.map(absen => {
        return {
            id_absen_kegiatan: absen.id_absen_kegiatan,
            tanggal: absen.tanggal,
            status: absen.status,
            nama_kegiatan: parseNamaKegiatan(absen.id_kegiatan_unik)
        };
    });

    res.status(200).json(formattedAbsensi);
  } catch (error) {
    console.error('Error fetching absensi santri:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// REVISI BESAR: Fungsi rekap cetak difilter berdasarkan tingkat (MTS/MA)
exports.getRekapUntukCetak = async (req, res) => {
    try {
        const { bulan, tahun, tingkat } = req.query;
        const adminJenisKelamin = req.user.jenis_kelamin;
        if (!bulan || !tahun || !tingkat) return res.status(400).json({ message: 'Parameter bulan, tahun, dan tingkat diperlukan.' });
        
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);
        const daysInMonth = endDate.getDate();

        let kelasFilter;
        if (tingkat === 'mts') {
            kelasFilter = { [Op.in]: ['Kelas 1', 'Kelas 2', 'Kelas 3'] };
        } else if (tingkat === 'ma') {
            kelasFilter = { [Op.in]: ['Kelas 4', 'Kelas 5', 'Kelas 6'] };
        } else {
            return res.status(400).json({ message: 'Parameter tingkat tidak valid. Gunakan "mts" atau "ma".' });
        }

        const kelasDenganSantri = await Kelas.findAll({
            include: [{ model: Santri, as: 'Santris', where: { jenis_kelamin: adminJenisKelamin }, required: true, attributes: ['id_santri', 'nama'] }],
            where: { 
                nama_kelas: { 
                    ...kelasFilter,
                    [Op.ne]: 'Alumni' 
                } 
            },
            order: [['id_kelas', 'ASC'], [{ model: Santri, as: 'Santris' }, 'nama', 'ASC']]
        });

        const bulanName = new Date(tahun, bulan - 1).toLocaleString('id-ID', { month: 'long' });
        if (kelasDenganSantri.length === 0) return res.status(200).json({ meta: { bulan: bulanName, tahun: parseInt(tahun), daysInMonth }, data: {} });

        const santriIds = kelasDenganSantri.flatMap(k => k.Santris.map(s => s.id_santri));
        const allAbsensi = await AbsenKegiatan.findAll({ where: { id_santri: { [Op.in]: santriIds }, tanggal: { [Op.between]: [startDate, endDate] } } });
        
        const uniqueKegiatanSet = new Set(allAbsensi.map(a => parseNamaKegiatan(a.id_kegiatan_unik)));
        const uniqueKegiatanList = Array.from(uniqueKegiatanSet).sort();
        if (uniqueKegiatanList.length === 0) uniqueKegiatanList.push("Tidak ada kegiatan tercatat");

        const absensiMap = {};
        const rekapTotalSantri = {}; // Untuk HISA & Performa
        const shortStatus = { 'Hadir': 'H', 'Izin': 'I', 'Sakit': 'S', 'Alpa': 'A' };
        
        santriIds.forEach(id => { rekapTotalSantri[id] = { H: 0, I: 0, S: 0, A: 0, Total: 0 }; });

        allAbsensi.forEach(absen => {
            const santriId = absen.id_santri;
            const day = new Date(absen.tanggal).getDate();
            const nama_kegiatan = parseNamaKegiatan(absen.id_kegiatan_unik);

            // Kalkulasi Harian
            if (!absensiMap[santriId]) absensiMap[santriId] = {};
            if (!absensiMap[santriId][nama_kegiatan]) absensiMap[santriId][nama_kegiatan] = {};
            absensiMap[santriId][nama_kegiatan][day] = shortStatus[absen.status] || '-';

            // Kalkulasi Total Bulanan
            const rekap = rekapTotalSantri[santriId];
            if (rekap) {
                if (absen.status === 'Hadir') rekap.H++; else if (absen.status === 'Izin') rekap.I++; else if (absen.status === 'Sakit') rekap.S++; else if (absen.status === 'Alpa') rekap.A++;
                rekap.Total++;
            }
        });

        const rekapData = {};
        kelasDenganSantri.forEach(kelas => {
            rekapData[kelas.nama_kelas] = kelas.Santris.map(santri => {
                const rekap = rekapTotalSantri[santri.id_santri];
                const performance = rekap.Total > 0 ? ((rekap.H / rekap.Total) * 100).toFixed(0) + '%' : '0%';
                
                return {
                    nama: santri.nama,
                    rekap: { ...rekap, performance },
                    kegiatan: uniqueKegiatanList.map(namaKegiatan => ({
                        nama_kegiatan: namaKegiatan,
                        harian: Object.fromEntries(Array.from({ length: daysInMonth }, (_, i) => [i + 1, absensiMap[santri.id_santri]?.[namaKegiatan]?.[i + 1] || '-']))
                    }))
                };
            });
        });
        
        res.status(200).json({ meta: { bulan: bulanName, tahun: parseInt(tahun), daysInMonth }, data: rekapData });
    } catch (error) {
        console.error('Error fetching rekap untuk cetak:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};