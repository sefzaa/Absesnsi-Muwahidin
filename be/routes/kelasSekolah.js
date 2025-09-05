const express = require('express');
const router = express.Router();
const controller = require('../controllers/kelasSekolah.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

router.use(verifyToken);

// Rute utama CRUD Kelas
router.post('/', controller.create);
router.get('/', controller.findAll);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete); // <-- TAMBAHKAN BARIS INI



// --- TAMBAHKAN RUTE BARU DI SINI ---
// Rute untuk mengambil data master tingkatan
router.get('/tingkatan/all', controller.getAllTingkatan);


// Rute untuk manajemen santri
router.get('/unassigned/students', controller.getUnassignedStudents); 
router.get('/:id/students', controller.getStudentsInClass);

router.post('/assign-student', controller.addStudentToClass);
router.post('/remove-student', controller.removeStudentFromClass);

// Rute untuk fitur acak
router.post('/randomize', controller.randomizeStudents);

module.exports = router;