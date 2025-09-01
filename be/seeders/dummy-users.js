// file: seeders/dummy-users.js
const db = require('../models');
const bcrypt = require('bcryptjs');

const runSeeder = async () => {
    try {
        console.log("Memastikan tabel ada dan tidak menghapus data yang sudah ada...");
        // Sinkronkan ulang database tanpa opsi 'force'
        await db.sequelize.sync();
        console.log("Tabel sudah siap.");

        const transaction = await db.sequelize.transaction();

        try {
            // Hash password "admin"
            const hashedPassword = await bcrypt.hash('admin', 10);

            console.log("Memeriksa dan membuat role dummy...");
            let adminAsramaRole = await db.Role.findOne({ 
                where: { slug: 'admin-asrama' } 
            });

            if (!adminAsramaRole) {
                adminAsramaRole = await db.Role.create({
                    nama_role: 'Admin Asrama',
                    slug: 'admin-asrama'
                }, { transaction });
                console.log("Role 'Admin Asrama' berhasil dibuat.");
            } else {
                console.log("Role 'Admin Asrama' sudah ada.");
            }
            
            console.log("Memeriksa dan membuat user dummy...");
            // Buat user admin asrama putra jika belum ada
            let adminPutraUser = await db.User.findOne({ 
                where: { username: 'admin-putra' } 
            });

            if (!adminPutraUser) {
                await db.User.create({
                    nama: 'Admin Asrama Putra',
                    username: 'admin-putra',
                    email: 'admin.putra@example.com',
                    password: hashedPassword,
                    jenis_kelamin: 'Putra', 
                    id_role: adminAsramaRole.id_role
                }, { transaction });
                console.log("User 'admin-putra' berhasil dibuat.");
            } else {
                console.log("User 'admin-putra' sudah ada.");
            }

            // Buat user admin asrama putri jika belum ada
            let adminPutriUser = await db.User.findOne({ 
                where: { username: 'admin-putri' } 
            });

            if (!adminPutriUser) {
                await db.User.create({
                    nama: 'Admin Asrama Putri',
                    username: 'admin-putri',
                    email: 'admin.putri@example.com',
                    password: hashedPassword,
                    jenis_kelamin: 'Putri',
                    id_role: adminAsramaRole.id_role
                }, { transaction });
                console.log("User 'admin-putri' berhasil dibuat.");
            } else {
                console.log("User 'admin-putri' sudah ada.");
            }

            console.log("Seeder berhasil dijalankan tanpa menghapus data yang ada!");
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error("Seeder gagal:", error.message);
            throw error;
        }

    } catch (error) {
        console.error("Kesalahan fatal saat menjalankan seeder:", error);
    } finally {
        // Tutup koneksi database setelah seeder selesai
        db.sequelize.close();
    }
};

// Jalankan skrip seeder
runSeeder();
