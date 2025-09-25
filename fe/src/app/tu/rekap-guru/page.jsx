"use client";

import { useState, useEffect, Fragment, useMemo } from 'react';
import { useAuth } from '../../AuthContext.js';
import { Dialog, Transition } from '@headlessui/react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen Ikon SVG
const IconInfo = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);
const IconEye = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const IconDownload = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const IconLoader = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>);
const IconX = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);

// Komponen untuk Modal Notifikasi
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

// Komponen untuk Modal Rekap Detail
const RekapModal = ({ isOpen, closeModal, guru, token }) => {
    const [rekapData, setRekapData] = useState({});
    const [jamPelajaran, setJamPelajaran] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() });
    const daysInMonth = (month, year) => new Date(year, month, 0).getDate();
    const tanggalList = Array.from({ length: daysInMonth(filter.bulan, filter.tahun) }, (_, i) => i + 1);

    useEffect(() => { if (isOpen && guru) { fetchRekap(); } }, [isOpen, guru, filter]);

    const fetchRekap = async () => {
        setIsLoading(true); setError('');
        try {
            const response = await fetch(`${backendUrl}/api/rekap-guru/${guru.id_pegawai}?bulan=${filter.bulan}&tahun=${filter.tahun}`, { headers: { 'x-access-token': token } });
            if (!response.ok) throw new Error('Gagal mengambil data rekap.');
            const data = await response.json();
            setRekapData(data.rekap || {});
            setJamPelajaran(data.jamPelajaran || []);
        } catch (err) { setError(err.message); } finally { setIsLoading(false); }
    };
    
    const formatDate = (day) => `${filter.tahun}-${String(filter.bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={closeModal}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-30" /></Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"><span>Rekap Kehadiran: {guru?.nama}</span><button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-200"><IconX /></button></Dialog.Title>
                                {isLoading ? (<div className="flex justify-center items-center h-64"><IconLoader /></div>) : error ? (<div className="text-red-500 text-center">{error}</div>) : (
                                    <div className="overflow-x-auto mt-4">
                                        <table className="min-w-full divide-y divide-gray-200 border">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border sticky left-0 bg-gray-50 z-10">Jam Pel.</th>
                                                    {tanggalList.map(tgl => <th key={tgl} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">{tgl}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {jamPelajaran.map(jp => (
                                                    <tr key={jp.id_jam_pelajaran}>
                                                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border sticky left-0 bg-white z-10">{jp.nama_jam}</td>
                                                        {tanggalList.map(tgl => {
                                                            const isHadir = rekapData[formatDate(tgl)]?.includes(jp.nama_jam);
                                                            return (<td key={`${jp.id_jam_pelajaran}-${tgl}`} className="px-2 py-2 text-center text-sm text-gray-500 border">{isHadir ? <span className="font-bold text-green-600">H</span> : '-'}</td>);
                                                        })}
                                                    </tr>
                                                ))}
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

// Komponen Utama Halaman
export default function RekapGuruPage() {
    const { token } = useAuth();
    const [gurus, setGurus] = useState([]); // Master list of all teachers
    const [rekapDataAll, setRekapDataAll] = useState([]); // Attendance data for filtering
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloadingTingkat, setIsDownloadingTingkat] = useState(null);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGuru, setSelectedGuru] = useState(null);
    const [mainFilter, setMainFilter] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() });
    const [notification, setNotification] = useState({ isOpen: false, title: '', message: '' });
    const [pdfScriptsReady, setPdfScriptsReady] = useState(false);
    const [activeSection, setActiveSection] = useState('Semua'); // State for active tab

    // Load PDF generation scripts
    useEffect(() => {
        const loadScript = (src, id) => new Promise((resolve, reject) => {
            if (document.getElementById(id)) { resolve(); return; }
            const script = document.createElement('script');
            script.id = id; script.src = src; script.async = true;
            script.onload = resolve; script.onerror = reject;
            document.head.appendChild(script);
        });

        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf-script')
            .then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js', 'jspdf-autotable-script'))
            .then(() => setPdfScriptsReady(true))
            .catch(err => {
                console.error("Gagal memuat skrip PDF:", err);
                setNotification({ isOpen: true, title: "Kesalahan Skrip", message: "Gagal memuat library untuk membuat PDF. Mohon segarkan halaman." });
            });
    }, []);

    // Fetch master guru list and detailed rekap data when filter changes
    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError('');
            try {
                const guruResponse = await fetch(`${backendUrl}/api/rekap-guru`, { headers: { 'x-access-token': token } });
                if (!guruResponse.ok) throw new Error('Gagal mengambil daftar guru.');
                const guruData = await guruResponse.json();
                setGurus(guruData);

                const rekapResponse = await fetch(`${backendUrl}/api/rekap-guru/all?bulan=${mainFilter.bulan}&tahun=${mainFilter.tahun}`, { headers: { 'x-access-token': token } });
                if (!rekapResponse.ok) throw new Error('Gagal mengambil data rekap untuk pemfilteran.');
                const rekapJson = await rekapResponse.json();
                setRekapDataAll(rekapJson.rekapData || []);

            } catch (err) {
                setError(err.message);
                setRekapDataAll([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token, mainFilter]);

    // --- DIUBAH: Memoized calculation untuk memfilter DAN menambahkan jumlah hadir ---
    const displayGurus = useMemo(() => {
        // 1. Identifikasi sesi mengajar unik untuk menghindari penghitungan ganda per santri
        const uniqueSessions = new Set(
            rekapDataAll.map(rekap => `${rekap.id_pegawai}|${rekap.id_jam_pelajaran}|${rekap.tanggal}`)
        );

        // 2. Hitung sesi unik ini untuk setiap guru
        const hadirCounts = {};
        uniqueSessions.forEach(sessionKey => {
            const teacherId = sessionKey.split('|')[0];
            hadirCounts[teacherId] = (hadirCounts[teacherId] || 0) + 1;
        });

        // 3. Tambahkan properti 'hadir' ke setiap objek guru di master list
        const gurusWithCount = gurus.map(guru => ({
            ...guru,
            hadir: hadirCounts[guru.id_pegawai] || 0
        }));

        // 4. Terapkan filter berdasarkan tab yang aktif
        if (activeSection === 'Semua') {
            return gurusWithCount;
        }
        
        const tingkat = activeSection === 'MTS' ? 'mts' : 'ma';
        const relevantGuruIds = new Set(
            rekapDataAll
                .filter(rekap => rekap.tingkat === tingkat)
                .map(rekap => rekap.id_pegawai)
        );
        
        return gurusWithCount.filter(guru => relevantGuruIds.has(guru.id_pegawai));
    }, [activeSection, gurus, rekapDataAll]);
    
    const handleViewClick = (guru) => { setSelectedGuru(guru); setIsModalOpen(true); };

    // Function to handle PDF download remains the same
    const handleDownloadTingkat = async (tingkat) => {
        if (!pdfScriptsReady) {
            setNotification({ isOpen: true, title: "Harap Tunggu", message: "Library untuk download PDF sedang disiapkan. Mohon coba sesaat lagi." });
            return;
        }
        if (gurus.length === 0) {
            setNotification({ isOpen: true, title: "Informasi", message: "Tidak ada data guru untuk diunduh." });
            return;
        }

        setIsDownloadingTingkat(tingkat);
        try {
            const response = await fetch(`${backendUrl}/api/rekap-guru/all?bulan=${mainFilter.bulan}&tahun=${mainFilter.tahun}`, { headers: { 'x-access-token': token } });
            if (!response.ok) throw new Error(`Gagal mengambil data rekap.`);
            
            const { gurus: allGurus, jamPelajaran: allJamPelajaran, rekapData } = await response.json();
            
            const filteredRekap = rekapData.filter(absen => absen.tingkat === tingkat);

            if (filteredRekap.length === 0) {
                setNotification({ isOpen: true, title: "Informasi", message: `Tidak ada data kehadiran guru untuk jenjang ${tingkat.toUpperCase()} pada periode ini.` });
                return;
            }

            const relevantGuruIds = [...new Set(filteredRekap.map(r => r.id_pegawai))];
            const relevantGurus = allGurus.filter(g => relevantGuruIds.includes(g.id_pegawai));

            const rekapMap = new Map();
            filteredRekap.forEach(r => {
                const key = `${r.id_pegawai}-${r.id_jam_pelajaran}-${r.tanggal}`;
                rekapMap.set(key, 'H');
            });
            
            const month = mainFilter.bulan, year = mainFilter.tahun;
            const daysInMonth = new Date(year, month, 0).getDate();
            const monthName = new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
            const tingkatLabel = tingkat.toUpperCase();
            const tingkatFullLabel = tingkat === 'mts' ? 'Madrasah Tsanawiyah' : 'Madrasah Aliyah';

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            doc.setFontSize(16);
            doc.text(`Rekap Kehadiran Guru Jenjang ${tingkatFullLabel} (${tingkatLabel})`, 14, 15);
            doc.setFontSize(12);
            doc.text(`Periode: ${monthName} ${year}`, 14, 22);

            const tableHead = [["Nama Guru", "Jam Pelajaran", ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))]];
            const tableBody = [];

            relevantGurus.forEach(guru => {
                const guruJpsIds = [...new Set(filteredRekap.filter(r => r.id_pegawai === guru.id_pegawai).map(r => r.id_jam_pelajaran))];
                const guruJps = allJamPelajaran.filter(jp => guruJpsIds.includes(jp.id_jam_pelajaran))
                    .sort((a, b) => a.nama_jam.localeCompare(b.nama_jam));

                if (guruJps.length > 0) {
                    guruJps.forEach((jp, jpIndex) => {
                        const row = [];
                        if (jpIndex === 0) {
                            row.push({ content: guru.nama, rowSpan: guruJps.length, styles: { valign: 'middle' } });
                        }
                        row.push(jp.nama_jam);
                        for (let day = 1; day <= daysInMonth; day++) {
                            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const key = `${guru.id_pegawai}-${jp.id_jam_pelajaran}-${dateStr}`;
                            row.push(rekapMap.get(key) || "-");
                        }
                        tableBody.push(row);
                    });
                }
            });

            doc.autoTable({
                startY: 30, head: tableHead, body: tableBody, theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
                columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' }, 1: { cellWidth: 25 } },
                styles: { fontSize: 7, cellPadding: 1.5, halign: 'center', minCellHeight: 5 },
            });

            doc.save(`Rekap-Guru-${tingkatLabel}-${monthName}-${year}.pdf`);

        } catch (err) {
            setNotification({ isOpen: true, title: "Download Gagal", message: err.message });
        } finally {
            setIsDownloadingTingkat(null);
        }
    };

    const sectionButtonClass = (section) => `whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm cursor-pointer ${activeSection === section ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Rekap Kehadiran Guru</h2>
            
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 pb-4">
                <div className="flex gap-4">
                    <select value={mainFilter.bulan} onChange={(e) => setMainFilter({...mainFilter, bulan: e.target.value})} className="border rounded p-2 text-gray-700 focus:ring-indigo-500 focus:border-indigo-500">
                        {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                    </select>
                    <select value={mainFilter.tahun} onChange={(e) => setMainFilter({...mainFilter, tahun: e.target.value})} className="border rounded p-2 text-gray-700 focus:ring-indigo-500 focus:border-indigo-500">
                         {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button onClick={() => handleDownloadTingkat('mts')} disabled={!pdfScriptsReady || isDownloadingTingkat !== null} className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isDownloadingTingkat === 'mts' ? <IconLoader /> : <IconDownload />}
                        <span>{!pdfScriptsReady ? 'Memuat...' : isDownloadingTingkat === 'mts' ? 'Mempersiapkan...' : 'Download Rekap MTS'}</span>
                    </button>
                    <button onClick={() => handleDownloadTingkat('ma')} disabled={!pdfScriptsReady || isDownloadingTingkat !== null} className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isDownloadingTingkat === 'ma' ? <IconLoader /> : <IconDownload />}
                        <span>{!pdfScriptsReady ? 'Memuat...' : isDownloadingTingkat === 'ma' ? 'Mempersiapkan...' : 'Download Rekap MA'}</span>
                    </button>
                </div>
            </div>
            
            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    <button onClick={() => setActiveSection('Semua')} className={sectionButtonClass('Semua')}>Semua Guru</button>
                    <button onClick={() => setActiveSection('MTS')} className={sectionButtonClass('MTS')}>Guru MTS</button>
                    <button onClick={() => setActiveSection('MA')} className={sectionButtonClass('MA')}>Guru MA</button>
                </nav>
            </div>

            {isLoading && <div className="text-center py-4"><IconLoader /></div>}
            {error && <div className="text-center py-4 text-red-500">{error}</div>}

            {!isLoading && !error && (
            <>
                {/* --- DIUBAH: Tampilan Desktop --- */}
                <div className="hidden md:block">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Guru</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIP</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hadir (JP)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayGurus.map(guru => (
                                <tr key={guru.id_pegawai} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{guru.nama}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guru.nip || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-green-600">{guru.hadir}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button onClick={() => handleViewClick(guru)} className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 mx-auto"><IconEye /> View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- DIUBAH: Tampilan Mobile --- */}
                <div className="md:hidden space-y-4">
                    {displayGurus.map(guru => (
                        <div key={guru.id_pegawai} className="bg-gray-50 p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{guru.nama}</p>
                                    <p className="text-sm text-gray-500">NIP: {guru.nip || '-'}</p>
                                </div>
                                <div className="text-right flex flex-col items-center justify-center bg-green-50 p-2 rounded-md border border-green-200">
                                    <span className="text-xs font-medium text-green-700">Hadir (JP)</span>
                                    <span className="text-2xl font-bold text-green-600">{guru.hadir}</span>
                                 </div>
                            </div>
                            <div className="border-t mt-3 pt-3">
                                <button onClick={() => handleViewClick(guru)} className="w-full text-indigo-600 hover:text-indigo-900 flex items-center gap-2 justify-center py-1.5 rounded-md hover:bg-indigo-50">
                                    <IconEye /> Lihat Detail
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </>
            )}
            
            {selectedGuru && <RekapModal isOpen={isModalOpen} closeModal={() => setIsModalOpen(false)} guru={selectedGuru} token={token} />}
            <NotificationModal isOpen={notification.isOpen} onClose={() => setNotification({ ...notification, isOpen: false })} title={notification.title} message={notification.message}/>
        </div>
    );
}