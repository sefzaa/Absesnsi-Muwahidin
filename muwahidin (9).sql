-- --------------------------------------------------------

--
-- Struktur dari tabel `jabatan`
--

INSERT INTO `jabatan` (`id_jabatan`, `nama_jabatan`, `deskripsi`, `createdAt`, `updatedAt`) VALUES
(1, 'TU', 'Staf Tata Usaha', '2025-09-01 18:33:26', '2025-09-01 18:33:26'),
(2, 'Guru', 'Tenaga Pendidik', '2025-09-01 18:33:26', '2025-09-01 18:33:26'),
(3, 'Satpam', 'Petugas Keamanan', '2025-09-01 18:33:26', '2025-09-01 18:33:26'),
(4, 'Direktur', 'Pimpinan Pesantren', '2025-09-01 18:33:26', '2025-09-01 18:33:26'),
(5, 'Musyrif', 'Pembimbing Asrama', '2025-09-01 18:33:26', '2025-09-01 18:33:26');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kelas`
--

INSERT INTO `kelas` (`id_kelas`, `nama_kelas`) VALUES
(7, 'Alumni'),
(1, 'Kelas 1'),
(2, 'Kelas 2'),
(3, 'Kelas 3'),
(4, 'Kelas 4'),
(5, 'Kelas 5'),
(6, 'Kelas 6');

-- --------------------------------------------------------

--
-- Struktur dari tabel `roles`
--

INSERT INTO `roles` (`id_role`, `nama_role`, `slug`, `createdAt`, `updatedAt`) VALUES
(1, 'Admin Asrama', 'admin-asrama', '2025-09-01 08:22:02', '2025-09-01 08:22:02'),
(5, 'Pegawai', 'pegawai', '2025-09-01 12:09:53', '2025-09-01 12:09:53'),
(6, 'Orang Tua', 'orang-tua', '2025-09-06 14:32:44', '2025-09-06 14:32:44');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

INSERT INTO `users` (`id_user`, `nama`, `username`, `email`, `password`, `jenis_kelamin`, `createdAt`, `updatedAt`, `id_role`) VALUES
(1, 'Admin Asrama Putra', 'admin-putra', 'admin.putra@example.com', '$2b$08$/Q41VSQO7OsPB0xh9eMn7.tU7xRjnpWEQteGNK1/Sm7c8BzI2l5pi', 'Putra', '2025-09-01 08:22:02', '2025-09-06 09:33:51', 1),
(2, 'Admin Asrama Putri', 'admin-putri', 'admin.putri@example.com', '$2b$10$1boKcicWF5sU1WDeMp8XcOj2GCHZXeeo5dim8hLNXe7fhbUyjEPrW', 'Putri', '2025-09-01 08:22:02', '2025-09-01 08:22:02', 1);

