// controllers/jadwalRutin.js

const db = require('../models');
const JadwalRutin = db.JadwalRutin;

// Membuat jadwal rutin baru berdasarkan jenis kelamin admin
const create = (req, res) => {
    if (!req.body.name || !req.body.repetitionType) {
        return res.status(400).send({ message: "Nama kegiatan dan tipe repetisi tidak boleh kosong!" });
    }
    
    // Ambil jenis kelamin dari token admin
    const adminJenisKelamin = req.user.jenis_kelamin;
    if (!adminJenisKelamin) {
        return res.status(401).send({ message: "Jenis kelamin admin tidak ditemukan di token." });
    }

    const jadwalRutin = {
        name: req.body.name,
        // Tetapkan jenis jadwal (Putra/Putri) berdasarkan admin yang login
        jenis: adminJenisKelamin === 'Putra' ? 'Putra' : 'Putri',
        repetitionType: req.body.repetitionType,
        time: req.body.time || null,
        days: req.body.days || [],
        dates: req.body.dates || [],
        icon: req.body.icon,
        iconBg: req.body.iconBg,
        iconColor: req.body.iconColor,
    };

    JadwalRutin.create(jadwalRutin)
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Terjadi kesalahan saat membuat Jadwal Rutin." });
        });
};

// Mengambil semua jadwal rutin yang SESUAI dengan jenis kelamin admin
const findAll = (req, res) => {
    // Ambil jenis kelamin dari token admin
    const adminJenisKelamin = req.user.jenis_kelamin;
    if (!adminJenisKelamin) {
        return res.status(401).send({ message: "Jenis kelamin admin tidak ditemukan di token." });
    }

    // Tentukan filter berdasarkan jenis kelamin
    const jenisFilter = adminJenisKelamin === 'Putra' ? 'Putra' : 'Putri';

    JadwalRutin.findAll({ 
        where: { jenis: jenisFilter }, // Filter data berdasarkan jenis (Putra/Putri)
        order: [['createdAt', 'ASC']] 
    })
    .then(data => {
        res.send(data);
    })
    .catch(err => {
        res.status(500).send({ message: err.message || "Terjadi kesalahan saat mengambil Jadwal Rutin." });
    });
};

// Mengupdate jadwal rutin (hanya jika jenisnya sesuai dengan admin)
const update = (req, res) => {
    const id = req.params.id;
    const adminJenisKelamin = req.user.jenis_kelamin;
    const jenisFilter = adminJenisKelamin === 'Putra' ? 'Putra' : 'Putri';

    JadwalRutin.update(req.body, {
        where: { id: id, jenis: jenisFilter } // Pastikan admin hanya bisa update jadwal miliknya
    })
    .then(num => {
        if (num == 1) {
            JadwalRutin.findByPk(id).then(data => res.send(data));
        } else {
            res.status(404).send({ message: `Tidak dapat memperbarui Jadwal Rutin. Mungkin tidak ditemukan atau Anda tidak punya akses.` });
        }
    })
    .catch(err => {
        res.status(500).send({ message: "Error memperbarui Jadwal Rutin." });
    });
};

// Menghapus jadwal rutin (hanya jika jenisnya sesuai dengan admin)
const destroy = (req, res) => {
    const id = req.params.id;
    const adminJenisKelamin = req.user.jenis_kelamin;
    const jenisFilter = adminJenisKelamin === 'Putra' ? 'Putra' : 'Putri';
    
    JadwalRutin.destroy({
        where: { id: id, jenis: jenisFilter } // Pastikan admin hanya bisa hapus jadwal miliknya
    })
    .then(num => {
        if (num == 1) {
            res.send({ message: "Jadwal Rutin berhasil dihapus!" });
        } else {
            res.status(404).send({ message: `Tidak dapat menghapus Jadwal Rutin. Mungkin tidak ditemukan atau Anda tidak punya akses.` });
        }
    })
    .catch(err => {
        res.status(500).send({ message: "Tidak dapat menghapus Jadwal Rutin." });
    });
};

module.exports = {
    create,
    findAll,
    update,
    destroy
};