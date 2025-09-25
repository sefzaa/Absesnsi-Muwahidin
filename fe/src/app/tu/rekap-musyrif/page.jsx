"use client";

import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '@/app/AuthContext.js';
import { Dialog, Transition } from '@headlessui/react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen Ikon SVG
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const IconLoader = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
const IconInfo = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const IconEye = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// Modal Notifikasi
const NotificationModal = ({ isOpen, onClose, title, message }) => (
    <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-25" /></Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2"><IconInfo />{title}</Dialog.Title>
                            <div className="mt-2"><p className="text-sm text-gray-500">{message}</p></div>
                            <div className="mt-4"><button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none" onClick={onClose}>Mengerti</button></div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
    </Transition>
);

// --- MODAL BARU UNTUK DETAIL REKAP MUSYRIF ---
const RekapDetailModal = ({ isOpen, closeModal, musyrif, filter, token }) => {
    const [detail, setDetail] = useState({ rekap: {}, kegiatan: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const daysInMonth = (month, year) => new Date(year, month, 0).getDate();
    const tanggalList = Array.from({ length: daysInMonth(filter.bulan, filter.tahun) }, (_, i) => i + 1);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!isOpen || !musyrif) return;
            setIsLoading(true);
            setError('');
            try {
                const response = await fetch(`${backendUrl}/api/rekap-musyrif/${musyrif.id_pegawai}?bulan=${filter.bulan}&tahun=${filter.tahun}`, { headers: { 'x-access-token': token } });
                if (!response.ok) throw new Error('Gagal mengambil detail rekap.');
                const data = await response.json();
                setDetail(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [isOpen, musyrif, filter, token]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={closeModal}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-30" /></Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                                    <span>Rekap Kehadiran: {musyrif?.nama}</span>
                                    <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-200"><IconX /></button>
                                </Dialog.Title>
                                {isLoading ? (<div className="flex justify-center items-center h-64"><IconLoader /></div>) : error ? (<div className="text-red-500 text-center py-10">{error}</div>) : (
                                    <div className="overflow-x-auto mt-4">
                                        <table className="min-w-full divide-y divide-gray-200 border">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border sticky left-0 bg-gray-50 z-10">Kegiatan</th>
                                                    {tanggalList.map(tgl => <th key={tgl} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">{tgl}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {detail.kegiatan.length > 0 ? detail.kegiatan.map(kg => (
                                                    <tr key={kg}>
                                                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border sticky left-0 bg-white z-10">{kg}</td>
                                                        {tanggalList.map(tgl => {
                                                            const dateStr = `${filter.tahun}-${String(filter.bulan).padStart(2, '0')}-${String(tgl).padStart(2, '0')}`;
                                                            const isHadir = detail.rekap[dateStr]?.includes(kg);
                                                            return (<td key={`${kg}-${tgl}`} className="px-2 py-2 text-center text-sm text-gray-500 border">{isHadir ? <span className="font-bold text-green-600">H</span> : '-'}</td>);
                                                        })}
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={tanggalList.length + 1} className="text-center py-10 text-gray-500">Tidak ada data kehadiran pada periode ini.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};


export default function RekapMusyrifPage() {
    const { token } = useAuth();
    const [allData, setAllData] = useState({ musyrifs: [], kegiatan: { putra: [], putri: [] }, rekapData: {} });
    const [filteredMusyrifs, setFilteredMusyrifs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [mainFilter, setMainFilter] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() });
    const [notification, setNotification] = useState({ isOpen: false, title: '', message: '' });
    const [pdfScriptsReady, setPdfScriptsReady] = useState(false);
    const [activeSection, setActiveSection] = useState('Semua');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMusyrif, setSelectedMusyrif] = useState(null);

    useEffect(() => {
        const loadScript = (src, id) => new Promise((resolve, reject) => { if (document.getElementById(id)) { resolve(); return; } const script = document.createElement('script'); script.id = id; script.src = src; script.async = true; script.onload = resolve; script.onerror = reject; document.head.appendChild(script); });
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf-script').then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js', 'jspdf-autotable-script')).then(() => { setPdfScriptsReady(true); }).catch(err => { console.error("Gagal memuat skrip PDF:", err); setNotification({ isOpen: true, title: "Kesalahan Skrip", message: "Gagal memuat library." }); });
    }, []);

    const fetchData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/rekap-musyrif/all?bulan=${mainFilter.bulan}&tahun=${mainFilter.tahun}`, { headers: { 'x-access-token': token } });
            if (!response.ok) throw new Error('Gagal mengambil data rekap.');
            const data = await response.json();
            setAllData(data);
        } catch (err) {
            setNotification({ isOpen: true, title: "Gagal Memuat Data", message: err.message });
            setAllData({ musyrifs: [], kegiatan: { putra: [], putri: [] }, rekapData: {} });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, [token, mainFilter]);
    
    useEffect(() => {
        if (activeSection === 'Semua') {
            setFilteredMusyrifs(allData.musyrifs);
        } else {
            setFilteredMusyrifs(allData.musyrifs.filter(m => m.jenis_kelamin === activeSection));
        }
    }, [activeSection, allData]);

    const handleViewClick = (musyrif) => {
        setSelectedMusyrif(musyrif);
        setIsModalOpen(true);
    };

    // --- FUNGSI DOWNLOAD DIPERBAIKI ---
    const handleDownload = async (jenis_kelamin) => {
        if (!pdfScriptsReady) { setNotification({ isOpen: true, title: "Harap Tunggu", message: "Library PDF sedang disiapkan." }); return; }
        
        const dataToDownload = allData.musyrifs.filter(m => m.jenis_kelamin === jenis_kelamin);
        if (dataToDownload.length === 0) { setNotification({ isOpen: true, title: "Informasi", message: `Tidak ada data Musyrif ${jenis_kelamin} untuk diunduh.` }); return; }
        
        setIsDownloading(true);
        try {
            const { rekapData } = allData;
            const { bulan, tahun } = mainFilter;
            const daysInMonth = new Date(tahun, bulan, 0).getDate();
            const monthName = new Date(0, bulan - 1).toLocaleString('id-ID', { month: 'long' });

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            doc.setFontSize(16); doc.text(`Rekap Kehadiran Musyrif ${jenis_kelamin}`, 14, 15);
            doc.setFontSize(12); doc.text(`Periode: ${monthName} ${tahun}`, 14, 22);

            const tableHead = [["Nama Musyrif", "Kegiatan", ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))]];
            const tableBody = [];

            dataToDownload.forEach(musyrif => {
                const musyrifKegiatan = new Set();
                Object.keys(rekapData).forEach(key => {
                    if (key.startsWith(musyrif.id_pegawai)) {
                        // --- PERBAIKAN LOGIKA PARSING NAMA KEGIATAN ---
                        // Format kunci: [id_pegawai]-[nama_kegiatan]-[YYYY-MM-DD]
                        // Karena id_pegawai mengandung '-', kita ekstrak dari belakang.
                        const parts = key.split('-');
                        const dateStr = parts.slice(-3).join('-'); // Ekstrak tanggal "YYYY-MM-DD"
                        const idAndKegiatan = key.substring(0, key.length - dateStr.length - 1);
                        const kegiatanName = idAndKegiatan.substring(musyrif.id_pegawai.length + 1);
                        musyrifKegiatan.add(kegiatanName);
                    }
                });

                const kegiatanList = Array.from(musyrifKegiatan).sort();

                if (kegiatanList.length > 0) {
                    kegiatanList.forEach((kg, kgIndex) => {
                        const row = [];
                        if (kgIndex === 0) {
                            row.push({ content: musyrif.nama, rowSpan: kegiatanList.length, styles: { valign: 'middle' } });
                        }
                        row.push(kg);

                        for (let day = 1; day <= daysInMonth; day++) {
                            const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const key = `${musyrif.id_pegawai}-${kg}-${dateStr}`;
                            row.push(rekapData[key] || "-");
                        }
                        tableBody.push(row);
                    });
                }
            });

            doc.autoTable({ startY: 30, head: tableHead, body: tableBody, theme: 'grid', headStyles: { fillColor: [41, 128, 185], textColor: 255 }, columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' }, 1: { cellWidth: 35 } }, styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' } });
            doc.save(`Rekap-Musyrif-${jenis_kelamin}-${monthName}-${tahun}.pdf`);
        } catch (err) { setNotification({ isOpen: true, title: "Download Gagal", message: err.message }); } finally { setIsDownloading(false); }
    };

    const sectionButtonClass = (section) => `whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm cursor-pointer ${activeSection === section ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`;

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Rekap Kehadiran Musyrif</h2>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex gap-4">
                    <select value={mainFilter.bulan} onChange={(e) => setMainFilter({...mainFilter, bulan: e.target.value})} className="border rounded p-2 text-gray-700 focus:ring-indigo-500 focus:border-indigo-500">{Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}</select>
                    <select value={mainFilter.tahun} onChange={(e) => setMainFilter({...mainFilter, tahun: e.target.value})} className="border rounded p-2 text-gray-700 focus:ring-indigo-500 focus:border-indigo-500">{Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => handleDownload('Putra')} disabled={!pdfScriptsReady || isDownloading} className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 shadow-sm disabled:bg-gray-400">
                        {isDownloading ? <IconLoader /> : <IconDownload />} <span>Rekap Putra</span>
                    </button>
                    <button onClick={() => handleDownload('Putri')} disabled={!pdfScriptsReady || isDownloading} className="flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 shadow-sm disabled:bg-gray-400">
                        {isDownloading ? <IconLoader /> : <IconDownload />} <span>Rekap Putri</span>
                    </button>
                </div>
            </div>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    <button onClick={() => setActiveSection('Semua')} className={sectionButtonClass('Semua')}>Semua Musyrif</button>
                    <button onClick={() => setActiveSection('Putra')} className={sectionButtonClass('Putra')}>Musyrif</button>
                    <button onClick={() => setActiveSection('Putri')} className={sectionButtonClass('Putri')}>Musyrifah</button>
                </nav>
            </div>

            <div className="mt-6">
                {isLoading ? <div className="flex justify-center items-center py-10"><IconLoader /></div> :
                    filteredMusyrifs.length === 0 ? <p className="text-center text-gray-500 py-10">Tidak ada data untuk ditampilkan.</p> :
                    (
                        <>
                            {/* Tampilan Tabel untuk Web (md ke atas) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Musyrif</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
                                            <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Hadir">Hadir</th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredMusyrifs.map(musyrif => (
                                            <tr key={musyrif.id_pegawai} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{musyrif.nama}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{musyrif.nip || '-'}</td>
                                                <td className="px-2 py-4 text-center whitespace-nowrap text-sm font-semibold text-green-600">{musyrif.performance.Hadir}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <button onClick={() => handleViewClick(musyrif)} className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 mx-auto">
                                                        <IconEye /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tampilan Kartu untuk Mobile (di bawah md) */}
                            <div className="block md:hidden space-y-4">
                                {filteredMusyrifs.map(musyrif => (
                                    <div key={musyrif.id_pegawai} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-base font-semibold text-gray-800">{musyrif.nama}</p>
                                                <p className="text-sm text-gray-500 mt-1">NIP: {musyrif.nip || '-'}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-center justify-center bg-green-50 p-2 rounded-md border border-green-200">
                                                <span className="text-xs font-medium text-green-700">Hadir</span>
                                                <span className="text-2xl font-bold text-green-600">{musyrif.performance.Hadir}</span>
                                            </div>
                                        </div>
                                        <div className="border-t pt-3">
                                             <button onClick={() => handleViewClick(musyrif)} className="w-full text-indigo-600 hover:text-indigo-900 flex items-center gap-2 justify-center py-1.5 rounded-md hover:bg-indigo-50">
                                                <IconEye /> Lihat Detail
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )
                }
            </div>
            
            <NotificationModal isOpen={notification.isOpen} onClose={() => setNotification({ ...notification, isOpen: false })} title={notification.title} message={notification.message}/>
            {selectedMusyrif && <RekapDetailModal isOpen={isModalOpen} closeModal={() => setIsModalOpen(false)} musyrif={selectedMusyrif} filter={mainFilter} token={token} />}
        </div>
    );
}