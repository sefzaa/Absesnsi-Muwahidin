// Impor koneksi database dan model
const db = require('../models');

/**
 * Fungsi ini akan menjalankan seeder untuk data awal seperti Kelas dan Role.
 */
const runInitialDataSeeder = async () => {
    console.log('Memulai proses seeding untuk data awal...');

    // Membuat transaksi untuk memastikan semua data berhasil dimasukkan atau tidak sama sekali
    const transaction = await db.sequelize.transaction();

    try {
        // --- SEEDING UNTUK TABEL KELAS ---
        console.log('--> Memproses data untuk tabel Kelas...');
        const kelasNames = [
          'Kelas 1',
          'Kelas 2',
          'Kelas 3',
          'Kelas 4',
          'Kelas 5',
          'Kelas 6',
          'Alumni'
        ];

        for (const nama of kelasNames) {
            const [kelas, created] = await db.Kelas.findOrCreate({
                where: { nama_kelas: nama },
                defaults: { nama_kelas: nama },
                transaction: transaction
            });

            if (created) {
                console.log(`    - Kelas '${nama}' berhasil dibuat.`);
            } else {
                console.log(`    - Kelas '${nama}' sudah ada.`);
            }
        }

        // --- SEEDING UNTUK TABEL ROLE ---
        console.log('\n--> Memproses data untuk tabel Role...');
        const rolesToSeed = [
            { nama_role: 'Orang Tua', slug: 'orang-tua' },
            // Anda bisa menambahkan role lain di sini jika perlu
        ];

        for (const roleData of rolesToSeed) {
            const [role, created] = await db.Role.findOrCreate({
                where: { slug: roleData.slug },
                defaults: roleData,
                transaction: transaction
            });

            if (created) {
                console.log(`    - Role '${roleData.nama_role}' berhasil dibuat.`);
            } else {
                console.log(`    - Role '${roleData.nama_role}' sudah ada.`);
            }
        }

        // Jika semua berhasil, simpan perubahan ke database
        await transaction.commit();
        console.log('\nSeeding untuk data awal berhasil diselesaikan.');

    } catch (error) {
        // Jika terjadi kesalahan, batalkan semua perubahan
        await transaction.rollback();
        console.error('Terjadi kesalahan saat menjalankan seeder:', error);
    } finally {
        // Tutup koneksi database setelah selesai
        await db.sequelize.close();
        console.log('Koneksi database ditutup.');
    }
};

// Jalankan fungsi seeder
runInitialDataSeeder();
