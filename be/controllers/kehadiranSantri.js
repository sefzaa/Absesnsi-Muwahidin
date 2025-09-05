// controllers/kehadiranSantriController.js

const { Santri, Kelas, AbsenKegiatan, sequelize } = require('../models');
const { Op } = require('sequelize');

// Fungsi untuk mengambil semua kelas SESUAI GENDER ADMIN
exports.getAllKelas = async (req, res) => {
  try {
    const adminJenisKelamin = req.user.jenis_kelamin;
    if (!adminJenisKelamin) {
      return res.status(403).json({ message: "Akses ditolak: Jenis kelamin admin tidak ditemukan." });
    }

    const santriInKelas = await Santri.findAll({
      where: { jenis_kelamin: adminJenisKelamin },
      attributes: ['id_kelas'],
      group: ['id_kelas'],
    });

    const kelasIds = santriInKelas.map(s => s.id_kelas);

    if (kelasIds.length === 0) {
      return res.status(200).json([]);
    }

    const kelas = await Kelas.findAll({
      where: {
        id_kelas: {
          [Op.in]: kelasIds,
        },
      },
      order: [['nama_kelas', 'ASC']],
    });
    
    res.status(200).json(kelas);
  } catch (error) {
    console.error('Error fetching kelas:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Fungsi untuk mengambil daftar santri SESUAI GENDER ADMIN
exports.getAllSantri = async (req, res) => {
  try {
    const { id_kelas } = req.query;
    const adminJenisKelamin = req.user.jenis_kelamin;

    let whereClause = {
        jenis_kelamin: adminJenisKelamin
    };

    if (id_kelas) {
      whereClause.id_kelas = id_kelas;
    }

    const santri = await Santri.findAll({
      attributes: ['id_santri', 'nama'],
      include: {
        model: Kelas,
        as: 'Kela',
        attributes: ['nama_kelas'],
        required: true,
      },
      where: whereClause,
      order: [
        ['nama', 'ASC'],
      ],
    });

    res.status(200).json(santri);
  } catch (error) {
    console.error('Error fetching santri:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// Fungsi getAbsensiSantri tidak diubah
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
        let nama_kegiatan = 'Kegiatan Tidak Dikenali';
        try {
            const parts = absen.id_kegiatan_unik.split('-');
            if(parts[0] === 'rutin' && parts.length > 3) {
                 nama_kegiatan = parts.slice(3).join(' ').replace(/_/g, ' ');
            } else if (parts[0] === 'tambahan') {
                nama_kegiatan = parts.slice(2).join(' ').replace(/_/g, ' ');
            }
        } catch(e) {
            console.error("Gagal mem-parsing id_kegiatan_unik:", absen.id_kegiatan_unik);
        }
        
        return {
            id_absen_kegiatan: absen.id_absen_kegiatan,
            tanggal: absen.tanggal,
            status: absen.status,
            nama_kegiatan: nama_kegiatan
        };
    });

    res.status(200).json(formattedAbsensi);
  } catch (error) {
    console.error('Error fetching absensi santri:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// Fungsi untuk mengambil rekap PDF harian dalam sebulan
exports.getRekapUntukCetak = async (req, res) => {
    try {
        const { bulan, tahun } = req.query;
        const adminJenisKelamin = req.user.jenis_kelamin;

        if (!bulan || !tahun) {
            return res.status(400).json({ message: 'Parameter bulan dan tahun diperlukan.' });
        }

        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);
        const daysInMonth = endDate.getDate();

        // 1. Ambil SEMUA santri yang relevan, dikelompokkan berdasarkan kelas
        const kelasDenganSantri = await Kelas.findAll({
            include: [{
                model: Santri,
                as: 'Santris', // Menggunakan alias 'Santris' dari Kelas ke Santri
                where: { jenis_kelamin: adminJenisKelamin },
                required: true, // Hanya ambil kelas yang memiliki santri sesuai gender
                attributes: ['id_santri', 'nama']
            }],
            order: [
                ['nama_kelas', 'ASC'],
                [{ model: Santri, as: 'Santris' }, 'nama', 'ASC']
            ]
        });

        const bulanName = new Date(tahun, bulan - 1).toLocaleString('id-ID', { month: 'long' });
        if (kelasDenganSantri.length === 0) {
            return res.status(200).json({ meta: { bulan: bulanName, tahun: parseInt(tahun), daysInMonth }, data: {} });
        }

        // 2. Kumpulkan semua ID santri dari hasil query di atas
        const santriIds = [];
        kelasDenganSantri.forEach(kelas => {
            kelas.Santris.forEach(santri => {
                santriIds.push(santri.id_santri);
            });
        });

        // 3. Ambil SEMUA absensi yang relevan untuk santri-santri tersebut di bulan ini
        const allAbsensi = await AbsenKegiatan.findAll({
            where: {
                id_santri: { [Op.in]: santriIds },
                tanggal: { [Op.between]: [startDate, endDate] }
            }
        });

        // 4. Buat daftar semua kegiatan unik yang terjadi di bulan itu
        const uniqueKegiatanSet = new Set();
        allAbsensi.forEach(absen => {
            let nama_kegiatan = 'Lainnya';
            try {
                const parts = absen.id_kegiatan_unik.split('-');
                // PERBAIKAN: Logika parsing nama kegiatan disesuaikan
                if (parts[0] === 'rutin' && parts.length > 5) {
                    nama_kegiatan = parts.slice(5).join(' ').replace(/_/g, ' ');
                } else if (parts[0] === 'tambahan' && parts.length > 2) {
                    nama_kegiatan = parts.slice(2).join(' ').replace(/_/g, ' ');
                }
                uniqueKegiatanSet.add(nama_kegiatan);
            } catch(e) {}
        });
        const uniqueKegiatanList = Array.from(uniqueKegiatanSet).sort();

        // Jika tidak ada kegiatan sama sekali di bulan itu, buat rekap kosong agar semua santri tetap tampil
        if (uniqueKegiatanList.length === 0) {
            uniqueKegiatanList.push("Tidak ada kegiatan tercatat");
        }

        // 5. Buat PETA (Map) absensi untuk pencarian cepat
        const absensiMap = {};
        const shortStatus = { 'Hadir': 'H', 'Izin': 'I', 'Sakit': 'S', 'Alpa': 'A' };
        const statusPriority = { 'A': 4, 'S': 3, 'I': 2, 'H': 1 };
        
        allAbsensi.forEach(absen => {
            const santriId = absen.id_santri;
            const day = new Date(absen.tanggal).getDate();
            let nama_kegiatan = 'Lainnya';
            try {
                const parts = absen.id_kegiatan_unik.split('-');
                // PERBAIKAN: Logika parsing nama kegiatan disesuaikan
                if(parts[0] === 'rutin' && parts.length > 5) nama_kegiatan = parts.slice(5).join(' ').replace(/_/g, ' ');
                else if (parts[0] === 'tambahan' && parts.length > 2) nama_kegiatan = parts.slice(2).join(' ').replace(/_/g, ' ');
            } catch (e) {}

            if (!absensiMap[santriId]) absensiMap[santriId] = {};
            if (!absensiMap[santriId][nama_kegiatan]) absensiMap[santriId][nama_kegiatan] = {};
            
            const currentStatus = shortStatus[absen.status];
            const existingStatus = absensiMap[santriId][nama_kegiatan][day];

            if (!existingStatus || statusPriority[currentStatus] > statusPriority[existingStatus]) {
                 absensiMap[santriId][nama_kegiatan][day] = currentStatus;
            }
        });
        
        // 6. Bangun struktur data final
        const rekapData = {};
        kelasDenganSantri.forEach(kelas => {
            const kelasNama = kelas.nama_kelas;
            rekapData[kelasNama] = [];

            kelas.Santris.forEach(santri => {
                const santriRekap = {
                    nama: santri.nama,
                    kegiatan: []
                };
                const santriAbsenData = absensiMap[santri.id_santri] || {};

                uniqueKegiatanList.forEach(namaKegiatan => {
                    const kegiatanRekap = {
                        nama_kegiatan: namaKegiatan,
                        harian: {}
                    };
                    const kegiatanAbsen = santriAbsenData[namaKegiatan] || {};
                    for (let day = 1; day <= daysInMonth; day++) {
                        kegiatanRekap.harian[day] = kegiatanAbsen[day] || '-';
                    }
                    santriRekap.kegiatan.push(kegiatanRekap);
                });
                
                rekapData[kelasNama].push(santriRekap);
            });
        });

        const finalResponse = {
            meta: {
                bulan: bulanName,
                tahun: parseInt(tahun),
                daysInMonth: daysInMonth
            },
            data: rekapData
        };
        res.status(200).json(finalResponse);
    } catch (error) {
        console.error('Error fetching rekap untuk cetak:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

