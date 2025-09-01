"use client";

// Impor komponen Sidebar generik yang baru kita buat
import Sidebar from "./layout/SidebarLayout";

// Impor semua ikon yang dibutuhkan dari semua role
import {
  FiHome,
  FiDollarSign,
  FiDatabase,
  FiCalendar,
  FiAlertTriangle,
  FiUsers,
  FiGrid,
  FiUserCheck,
  FiBox,
  FiBriefcase,
  FiSun,
  FiMoon,
  FiClipboard,
  FiSend,
  FiCoffee,
  FiBookOpen,
  FiFileText,
  FiAward,
} from "react-icons/fi";

// Data Pengguna untuk Super Admin
const superAdminUserData = {
  name: "Super Admin",
  role: "Super Administrator",
  avatar:
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80",
};

// Gabungkan SEMUA menu dari role lain menjadi satu
const superAdminMenuItems = [
  // Menu dari Admin Administrasi & Staff
  {
    group: "Administrasi",
    items: [
      { name: "Dashboard", icon: FiHome, href: "/superadmin" },
      { name: "SPP", icon: FiDollarSign, href: "/superadmin/spp" },
      { name: "Simsis", icon: FiDatabase, href: "/superadmin/simsis" },
    ],
  },
  // Menu dari Admin Asrama (Asr)
  {
    group: "Manajemen Asrama (",
    items: [
      {
        name: "Kegiatan Rutin",
        icon: FiCalendar,
        href: "/superadmin/kegiatan-rutin",
      },
      {
        name: "Kegiatan Tambahan",
        icon: FiCalendar,
        href: "/superadmin/kegiatan-tambahan",
      },
      {
        name: "Pelanggaran Santri",
        icon: FiAlertTriangle,
        href: "/superadmin/pelanggaran",
      },
      { name: "Data Santri", icon: FiUsers, href: "/superadmin/santri" },
      { name: "Data Kamar", icon: FiGrid, href: "/superadmin/kamar" },
    ],
  },
  // Menu dari Kepala Asrama (Kepas)
  {
    group: "Kepala Asrama",
    items: [
      { name: "Izin Harian", icon: FiSun, href: "/superadmin/izin-harian" },
      { name: "Izin Mudif", icon: FiUsers, href: "/superadmin/izin-mudif" },
      {
        name: "Izin Mingguan",
        icon: FiMoon,
        href: "/superadmin/izin-mingguan",
      },
      // ...tambahkan semua jenis izin lainnya
    ],
  },
  // Menu dari Admin Disgiat & Staff (admindg)
  {
    group: "Admin Disgiat",
    items: [
      { name: "Izin Harian", icon: FiSun, href: "/superadmin/izin-harian" },
      { name: "Izin Mudif", icon: FiUsers, href: "/superadmin/izin-mudif" },
      {
        name: "Izin Mingguan",
        icon: FiMoon,
        href: "/superadmin/izin-mingguan",
      },
      // ...tambahkan semua jenis izin lainnya
    ],
  },
  // Menu dari Admin Poliklinik & Staff (adminpol) 
  {
    group: "Manajemen Poliklinik",
    items: [
      { name: "Izin Harian", icon: FiSun, href: "/superadmin/izin-harian" },
      { name: "Izin Mudif", icon: FiUsers, href: "/superadmin/izin-mudif" },
      {
        name: "Izin Mingguan",
        icon: FiMoon,
        href: "/superadmin/izin-mingguan",
      },
      // ...tambahkan semua jenis izin lainnya
    ],
  },
  // Menu dari Perizinan
  {
    group: "Manajemen Perizinan",
    items: [
      { name: "Izin Harian", icon: FiSun, href: "/superadmin/izin-harian" },
      { name: "Izin Mudif", icon: FiUsers, href: "/superadmin/izin-mudif" },
      {
        name: "Izin Mingguan",
        icon: FiMoon,
        href: "/superadmin/izin-mingguan",
      },
      // ...tambahkan semua jenis izin lainnya
    ],
  },
  // Menu dari Wali Kamar
  {
    group: "Akademik & Laporan",
    items: [
      { name: "Absensi", icon: FiUserCheck, href: "/superadmin/absensi" },
      {
        name: "Tahfidz & Hafalan",
        icon: FiBookOpen,
        href: "/superadmin/tahfidz",
      },
      { name: "Prestasi", icon: FiAward, href: "/superadmin/prestasi" },
      { name: "Rekap Laporan", icon: FiFileText, href: "/superadmin/rekap" },
    ],
  },

  // Menu dari Orang Tua/Wali
  {
    group: "Manajemen Orang Tua",
    items: [
      { name: "Izin Harian", icon: FiSun, href: "/superadmin/izin-harian" },
      { name: "Izin Mudif", icon: FiUsers, href: "/superadmin/izin-mudif" },
      {
        name: "Izin Mingguan",
        icon: FiMoon,
        href: "/superadmin/izin-mingguan",
      },
      // ...tambahkan semua jenis izin lainnya
    ],
  },
  // Menu dari Staff Keuangan
  {
    group: "Manajemen Keuangan",
    items: [
      { name: "Izin Harian", icon: FiSun, href: "/superadmin/izin-harian" },
      { name: "Izin Mudif", icon: FiUsers, href: "/superadmin/izin-mudif" },
      {
        name: "Izin Mingguan",
        icon: FiMoon,
        href: "/superadmin/izin-mingguan",
      },
      // ...tambahkan semua jenis izin lainnya
    ],
  },
  // Menu dari Humas
  {
    group: "Manajemen Humas",
    items: [
      { name: "Izin Harian", icon: FiSun, href: "/superadmin/izin-harian" },
      { name: "Izin Mudif", icon: FiUsers, href: "/superadmin/izin-mudif" },
      {
        name: "Izin Mingguan",
        icon: FiMoon,
        href: "/superadmin/izin-mingguan",
      },
      // ...tambahkan semua jenis izin lainnya
    ],
  },


  // Menu Manajemen Akun (gabungan dari Admin Asr)
  {
    group: "Manajemen Akun Pengguna",
    items: [
      {
        name: "Wali Kamar",
        icon: FiUserCheck,
        href: "/superadmin/manage/wali-kamar",
      },
      {
        name: "Div. Perizinan",
        icon: FiBox,
        href: "/superadmin/manage/div-perizinan",
      },
      {
        name: "Div. Inventaris",
        icon: FiBriefcase,
        href: "/superadmin/manage/div-inventaris",
      },
      {
        name: "Direktur",
        icon: FiBriefcase,
        href: "/superadmin/manage/direktur",
      },
    ],
  },
];

// Komponen SidebarSuperAdmin sekarang menjadi sangat ramping!
export default function SidebarSuperAdmin({ setSidebarOpen }) {
  return (
    <Sidebar
      userData={superAdminUserData}
      menuItems={superAdminMenuItems}
      setSidebarOpen={setSidebarOpen}
    />
  );
}
