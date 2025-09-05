"use client";

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiEye, FiLoader, FiX, FiSearch, FiDownload } from 'react-icons/fi'; // Ganti FiPrinter ke FiDownload
import { useAuth } from '@/app/AuthContext';
import RekapContent from './RekapContent';

// Impor library yang baru diinstall
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- UBAH DI SINI

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen Modal (Tidak berubah)
const Modal = ({ isOpen, onClose, children, size = 'max-w-3xl' }) => {
    // ... (kode komponen Modal sama seperti sebelumnya, tidak perlu diubah)
    if (!isOpen) return null;
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className={`relative w-full ${size} transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all`}>
                                <button onClick={onClose} className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800">
                                    <span className="sr-only">Tutup</span>
                                    <FiX size={20} />
                                </button>
                                <div className="p-6">
                                    {children}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// Komponen Halaman Rekap Utama
export default function RekapPage() {
    const [santriList, setSantriList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSantri, setSelectedSantri] = useState(null);
    // State baru untuk loading download per santri
    const [downloadingId, setDownloadingId] = useState(null); 
    const { token } = useAuth();

    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            return;
        }
        fetch(`${backendUrl}/api/rekap/santri-asuhan`, { headers: { 'x-access-token': token } })
            .then(res => res.ok ? res.json() : Promise.reject('Gagal mengambil data'))
            .then(data => setSantriList(data))
            .catch(error => console.error("Gagal memuat daftar santri:", error))
            .finally(() => setIsLoading(false));
    }, [token]);


// --- FUNGSI UTAMA UNTUK DOWNLOAD PDF (VERSI FINAL TERAKHIR) ---
const handleDownloadRekap = async (santri) => {
    setDownloadingId(santri.id_santri);

    try {
        // 1. Ambil data rekap dari API
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        const monthName = now.toLocaleString('id-ID', { month: 'long' });

        const response = await fetch(`${backendUrl}/api/rekap/${santri.id_santri}?startDate=${startDate}&endDate=${endDate}`, {
            headers: { 'x-access-token': token }
        });
        if (!response.ok) throw new Error('Gagal mengambil data rekap');
        const rekapData = await response.json();

        const dataSantri = rekapData.santri;
        const namaSantri = dataSantri.nama;
        const kelasSantri = dataSantri.Kela?.nama_kelas || '-';

        // 2. Inisialisasi dokumen PDF
        const doc = new jsPDF();

        // 3. Buat Judul Laporan
        doc.setFontSize(18);
        doc.text(`Laporan Rekapitulasi Santri`, 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text(namaSantri, 105, 28, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Periode: ${monthName} ${year}`, 105, 34, { align: 'center' });

        // --- PERBAIKAN DI SINI ---
        // 4. Buat Judul untuk Tabel Data Diri sebagai Teks Biasa
        doc.setFontSize(12);
        doc.text('Data Diri Santri', 14, 48); // Posisi Y sedikit di atas tabel

        // Buat Tabel Data Diri tanpa 'head', hanya 'body'
        autoTable(doc, {
            startY: 52, // Posisi Y tabelnya
            // 'head' dihapus agar tidak ambigu
            body: [
                ['Nama Lengkap', namaSantri],
                ['Kelas', kelasSantri],
            ],
            theme: 'grid',
        });
        // --- AKHIR PERBAIKAN ---
        
        // 5. Gunakan autoTable untuk Rekap Absensi
        const absensiData = rekapData.absensi;
        if (absensiData && absensiData.list.length > 0) {
             autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 10, 
                head: [['Tanggal', 'Nama Kegiatan', 'Status']],
                body: absensiData.list.map(item => [
                    new Date(item.tanggal).toLocaleDateString('id-ID'),
                    item.kegiatan_nama,
                    item.status
                ]),
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] }
            });
            doc.text(`Performa Kehadiran: ${absensiData.performa}%`, 14, doc.lastAutoTable.finalY + 10);
        } else {
            doc.text('Tidak ada data absensi untuk periode ini.', 14, doc.lastAutoTable.finalY + 10);
        }

        // 6. Simpan dan trigger download
        doc.save(`Rekap_${santri.nama.replace(/ /g, '_')}_${monthName}_${year}.pdf`);

    } catch (error) {
        console.error("Gagal membuat PDF:", error);
        alert("Gagal mengunduh laporan. Silakan coba lagi.");
    } finally {
        setDownloadingId(null);
    }
};
    
    const filteredSantri = santriList.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
                <Header searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} />
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                    <div className="overflow-x-auto rounded-xl">
                        <table className="w-full text-sm text-left text-gray-500">
                            {/* ... thead tidak berubah ... */}
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Nama Santri</th>
                                    <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? ( <tr><td colSpan="2" className="text-center p-16">... loading ...</td></tr> ) 
                                : filteredSantri.length > 0 ? (
                                    filteredSantri.map((santri) => (
                                        <tr key={santri.id_santri} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{santri.nama}</td>
                                            <td className="px-6 py-4 text-right">
                                                {/* === PERUBAHAN TOMBOL AKSI DI SINI === */}
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setSelectedSantri(santri)} title="Lihat Cepat" className="flex items-center justify-center h-9 w-9 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                                                        <FiEye size={18} />
                                                    </button>
                                                    <button onClick={() => handleDownloadRekap(santri)} disabled={downloadingId === santri.id_santri} title="Download Laporan PDF" className="flex items-center justify-center h-9 w-9 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        {downloadingId === santri.id_santri ? <FiLoader className="animate-spin" size={18} /> : <FiDownload size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : ( <tr><td colSpan="2" className="text-center p-16">... Santri tidak ditemukan ...</td></tr> )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <RekapModal isOpen={!!selectedSantri} onClose={() => setSelectedSantri(null)} santri={selectedSantri} token={token} />
            </div>
        </main>
    );
}

// Komponen Header (Tidak berubah)
const Header = ({ searchTerm, onSearchChange }) => (
     <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Rekapitulasi Santri</h1>
            <p className="mt-1 text-sm text-gray-600">Lihat dan kelola rekapitulasi santri asuhan Anda.</p>
        </div>
        <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" size={18} />
            </div>
            <input type="text" value={searchTerm} onChange={onSearchChange} placeholder="Cari nama santri..." className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 transition" />
        </div>
    </header>
);

// Komponen Modal Rekap (disederhanakan karena tidak perlu tombol cetak)
const RekapModal = ({ isOpen, onClose, santri, token }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {isOpen && <RekapContent santri={santri} token={token} />}
        </Modal>
    );
};