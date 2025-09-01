// controllers/kegiatanTambahan.js

const db = require('../models');
const Kegiatan = db.Kegiatan;

// Membuat kegiatan tambahan baru berdasarkan jenis kelamin admin
const create = (req, res) => {
    if (!req.body.name || !req.body.date) {
        return res.status(400).send({ message: "Nama kegiatan dan tanggal tidak boleh kosong!" });
    }

    const adminJenisKelamin = req.user.jenis_kelamin;
    if (!adminJenisKelamin) {
        return res.status(401).send({ message: "Jenis kelamin admin tidak ditemukan di token." });
    }
    
    // Tentukan jenis kegiatan berdasarkan admin yang login
    const jenisKegiatan = adminJenisKelamin === 'Putra' ? 'tambahan-putra' : 'tambahan-putri';

    const kegiatan = {
        nama: req.body.name,
        tanggal: req.body.date,
        jenis: jenisKegiatan, // Otomatis set jenis ke 'tambahan-putra' atau 'tambahan-putri'
        icon: req.body.icon,
        iconBg: req.body.iconBg,
        iconColor: req.body.iconColor,
    };

    Kegiatan.create(kegiatan)
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(500).send({ message: err.message || "Terjadi kesalahan saat membuat Kegiatan Tambahan." });
        });
};

// Mengambil semua kegiatan tambahan sesuai dengan jenis kelamin admin
const findAll = (req, res) => {
    const adminJenisKelamin = req.user.jenis_kelamin;
    if (!adminJenisKelamin) {
        return res.status(401).send({ message: "Jenis kelamin admin tidak ditemukan di token." });
    }

    const jenisFilter = adminJenisKelamin === 'Putra' ? 'tambahan-putra' : 'tambahan-putri';

    Kegiatan.findAll({ 
        where: { jenis: jenisFilter }, // Filter data berdasarkan jenis
        order: [['tanggal', 'ASC']]
    })
    .then(data => {
        res.send(data);
    })
    .catch(err => {
        res.status(500).send({ message: err.message || "Terjadi kesalahan saat mengambil Kegiatan Tambahan." });
    });
};

// Mengupdate kegiatan tambahan (hanya jika jenisnya sesuai)
const update = (req, res) => {
    const id = req.params.id;
    const adminJenisKelamin = req.user.jenis_kelamin;
    const jenisFilter = adminJenisKelamin === 'Putra' ? 'tambahan-putra' : 'tambahan-putri';

    const updateData = {
        nama: req.body.name,
        tanggal: req.body.date,
        icon: req.body.icon,
        iconBg: req.body.iconBg,
        iconColor: req.body.iconColor,
    };

    Kegiatan.update(updateData, {
        where: { id_kegiatan: id, jenis: jenisFilter } // Pastikan hanya bisa update data yang sesuai jenisnya
    })
    .then(num => {
        if (num == 1) {
            Kegiatan.findByPk(id).then(data => res.send(data));
        } else {
            res.status(404).send({ message: `Tidak dapat memperbarui. Kegiatan tidak ditemukan atau Anda tidak punya akses.` });
        }
    })
    .catch(err => {
        res.status(500).send({ message: "Error memperbarui Kegiatan dengan id=" + id });
    });
};

// Menghapus kegiatan tambahan (hanya jika jenisnya sesuai)
const destroy = (req, res) => {
    const id = req.params.id;
    const adminJenisKelamin = req.user.jenis_kelamin;
    const jenisFilter = adminJenisKelamin === 'Putra' ? 'tambahan-putra' : 'tambahan-putri';

    Kegiatan.destroy({
        where: { id_kegiatan: id, jenis: jenisFilter } // Pastikan hanya bisa hapus data yang sesuai jenisnya
    })
    .then(num => {
        if (num == 1) {
            res.send({ message: "Kegiatan berhasil dihapus!" });
        } else {
            res.status(404).send({ message: `Tidak dapat menghapus. Kegiatan tidak ditemukan atau Anda tidak punya akses.` });
        }
    })
    .catch(err => {
        res.status(500).send({ message: "Tidak dapat menghapus Kegiatan dengan id=" + id });
    });
};

module.exports = {
    create,
    findAll,
    update,
    destroy
};