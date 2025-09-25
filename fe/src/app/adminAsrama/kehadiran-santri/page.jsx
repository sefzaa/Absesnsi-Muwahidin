// src/app/adminAsrama/kehadiran-santri/page.jsx
"use client";

import { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../../AuthContext';
import { Dialog, Transition } from '@headlessui/react';

// --- Ikon SVG ---
const IconEye = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconPrinter = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>;
const IconLoader = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
// --- Akhir Ikon SVG ---

// Komponen untuk badge rekap HISA
const RekapBadge = ({ label, value, color }) => (
    <div className="flex flex-col items-center">
        <span className={`text-xs font-medium text-${color}-600`}>{label}</span>
        <span className={`text-sm font-bold text-${color}-800`}>{value}</span>
    </div>
);

function AbsensiDetailModal({ isOpen, closeModal, santri, token }) {
    const [absensi, setAbsensi] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() });
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

    useEffect(() => { if (isOpen && santri) fetchAbsensi(); }, [isOpen, santri, filter]);

    const fetchAbsensi = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/kehadiran-santri/absensi/${santri.id_santri}?bulan=${filter.bulan}&tahun=${filter.tahun}`, { headers: { 'x-access-token': token } });
            if (!response.ok) throw new Error('Gagal mengambil data absensi');
            const data = await response.json();
            setAbsensi(data);
        } catch (error) {
            console.error('Error fetching absensi:', error);
            setAbsensi([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => setFilter({ ...filter, [e.target.name]: e.target.value });
    const getStatusBadge = (status) => ({'Hadir': 'bg-green-100 text-green-800','Izin': 'bg-blue-100 text-blue-800','Sakit': 'bg-yellow-100 text-yellow-800','Alpa': 'bg-red-100 text-red-800'}[status] || 'bg-gray-100 text-gray-800');
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-40" /></Transition.Child><div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center"><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"><Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"><Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 flex justify-between items-center">Rekap Absensi: {santri?.nama}<button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-200"><IconX /></button></Dialog.Title><div className="mt-4 flex flex-col sm:flex-row gap-4"><select name="bulan" value={filter.bulan} onChange={handleFilterChange} className="w-full sm:w-1/2 text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">{Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>))}</select><select name="tahun" value={filter.tahun} onChange={handleFilterChange} className="w-full sm:w-1/2 text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">{years.map(year => <option key={year} value={year}>{year}</option>)}</select></div><div className="mt-4 max-h-96 overflow-y-auto">{loading ? (<div className="flex justify-center items-center p-8"><IconLoader /></div>) : absensi.length > 0 ? (<div className="flow-root"><ul role="list" className="-mb-8">{absensi.map((item, itemIdx) => (<li key={item.id_absen_kegiatan}><div className="relative pb-8">{itemIdx !== absensi.length - 1 ? (<span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />) : null}<div className="relative flex space-x-3"><div><span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusBadge(item.status)}`}><p className="text-xs font-bold">{item.status.charAt(0)}</p></span></div><div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5"><div><p className="text-sm text-gray-700 font-medium">{item.nama_kegiatan}</p><p className="text-xs text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div><div className="whitespace-nowrap text-right text-sm text-gray-500"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(item.status)}`}>{item.status}</span></div></div></div></div></li>))}</ul></div>) : (<div className="text-center py-8 text-gray-500"><p>Tidak ada data absensi untuk periode ini.</p></div>)}</div><div className="mt-6 flex justify-end"><button type="button" onClick={closeModal} className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2">Tutup</button></div></Dialog.Panel></Transition.Child></div></div></Dialog>
        </Transition>
    );
}

export default function KehadiranSantriPage() {
    const { token } = useAuth();
    const [santriList, setSantriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    
    const [rekapFilter, setRekapFilter] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() });
    const [isPrinting, setIsPrinting] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

    const filterButtons = [
        { id: 'all', label: 'Semua' }, { id: 1, label: '1' }, { id: 2, label: '2' }, 
        { id: 3, label: '3' }, { id: 4, label: '4' }, { id: 5, label: '5' }, { id: 6, label: '6' },
    ];

    useEffect(() => {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jspdfScript.onload = () => {
            const autoTableScript = document.createElement('script');
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js';
            autoTableScript.onload = () => setScriptsLoaded(true);
            document.head.appendChild(autoTableScript);
        };
        document.head.appendChild(jspdfScript);
    }, []);

    useEffect(() => {
        if (token) fetchSantri(activeFilter);
    }, [activeFilter, token]);

    const fetchSantri = async (filterId) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/kehadiran-santri/santri?id_kelas=${filterId}`, { headers: { 'x-access-token': token } });
            if (!response.ok) throw new Error('Gagal mengambil daftar santri');
            const data = await response.json();
            setSantriList(data);
        } catch (error) {
            console.error('Error fetching santri:', error);
            setSantriList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRekapFilterChange = (e) => setRekapFilter({ ...rekapFilter, [e.target.name]: e.target.value });
    const openModal = (santri) => { setSelectedSantri(santri); setIsModalOpen(true); };
    const closeModal = () => setIsModalOpen(false);
    
    const handleCetakRekap = async () => {
        if (!scriptsLoaded) { alert("Perpustakaan PDF sedang dimuat, coba lagi sesaat."); return; }
        setIsPrinting(true);
        try {
            const { bulan, tahun } = rekapFilter;
            const response = await fetch(`${API_BASE_URL}/api/kehadiran-santri/rekap-cetak?bulan=${bulan}&tahun=${tahun}`, { headers: { 'x-access-token': token } });
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Gagal mengambil data rekap'); }
            const { meta, data: rekapData } = await response.json();
            if (Object.keys(rekapData).length === 0) { alert('Tidak ada data rekap untuk periode yang dipilih.'); return; }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape' });
            let isFirstPage = true;
            for (const namaKelas in rekapData) {
                if (!isFirstPage) doc.addPage();
                isFirstPage = false;
                
                doc.setFontSize(16);
                doc.text('Rekap Presensi Harian Santri', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
                doc.setFontSize(12);
                doc.text(`Kelas: ${namaKelas}`, 14, 22);
                doc.text(`Periode: ${meta.bulan} ${meta.tahun}`, doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });

                const days = Array.from({ length: meta.daysInMonth }, (_, i) => (i + 1).toString());
                const head = [['No', 'Nama Santri', 'H', 'I', 'S', 'A', '%', 'Kegiatan', ...days]];
                const body = [];
                rekapData[namaKelas].forEach((santri, index) => {
                    santri.kegiatan.forEach((kegiatan, kegiatanIndex) => {
                        const row = [];
                        if (kegiatanIndex === 0) {
                            row.push({ content: index + 1, rowSpan: santri.kegiatan.length });
                            row.push({ content: santri.nama, rowSpan: santri.kegiatan.length });
                            row.push({ content: santri.rekap.H, rowSpan: santri.kegiatan.length });
                            row.push({ content: santri.rekap.I, rowSpan: santri.kegiatan.length });
                            row.push({ content: santri.rekap.S, rowSpan: santri.kegiatan.length });
                            row.push({ content: santri.rekap.A, rowSpan: santri.kegiatan.length });
                            row.push({ content: santri.rekap.performance, rowSpan: santri.kegiatan.length });
                        }
                        row.push(kegiatan.nama_kegiatan);
                        for (let i = 1; i <= meta.daysInMonth; i++) row.push(kegiatan.harian[i] || '-');
                        body.push(row);
                    });
                });
                doc.autoTable({ head, body, startY: 30, theme: 'grid', headStyles: { fillColor: [34, 113, 77], halign: 'center' }, styles: { fontSize: 6, cellPadding: 1, halign: 'center', valign: 'middle' }, columnStyles: { 0: { cellWidth: 7 }, 1: { halign: 'left', cellWidth: 35 }, 2: { cellWidth: 5 }, 3: { cellWidth: 5 }, 4: { cellWidth: 5 }, 5: { cellWidth: 5 }, 6: { cellWidth: 8 }, 7: { halign: 'left', cellWidth: 30 } }, didDrawPage: (data) => doc.setFontSize(8).text('H: Hadir, I: Izin, S: Sakit, A: Alpa, -: Tidak Ada Data', data.settings.margin.left, doc.internal.pageSize.getHeight() - 10) });
            }
            doc.save(`rekap-kegiatan-${meta.bulan}-${meta.tahun}.pdf`);
        } catch (error) {
            console.error('Error printing rekap:', error);
            alert(`Gagal mencetak rekapitulasi: ${error.message}`);
        } finally {
            setIsPrinting(false);
        }
    };
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <>
            <div className="w-full bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="w-full border-b border-gray-200 pb-4 mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Opsi Cetak Rekap Bulanan</label>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                        <select name="bulan" value={rekapFilter.bulan} onChange={handleRekapFilterChange} className="w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900">
                            {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>))}
                        </select>
                        <select name="tahun" value={rekapFilter.tahun} onChange={handleRekapFilterChange} className="w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900">
                            {years.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <button onClick={handleCetakRekap} disabled={isPrinting || !scriptsLoaded} className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-wait">
                            {isPrinting ? <IconLoader /> : <IconPrinter />}
                            <span className="sm:hidden md:inline">Cetak Rekap</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
                    {filterButtons.map((filter) => (
                        <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFilter == filter.id ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-600 hover:bg-white/60'}`}>
                            {filter.label}
                        </button>
                    ))}
                </div>

                <div className="mt-6">
                    <table className="min-w-full">
                        <thead className="hidden md:table-header-group bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Santri</th>
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">H</th>
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">I</th>
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">S</th>
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">A</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Performa</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr className="block md:table-row"><td colSpan="7" className="block md:table-cell text-center py-10"><IconLoader /></td></tr>
                            ) : santriList.length > 0 ? (
                                santriList.map((santri) => (
                                    <tr key={santri.id_santri} className="block mb-4 p-4 border rounded-lg shadow-sm md:table-row md:mb-0 md:p-0 md:border-b md:shadow-none">
                                        {/* Card View untuk Mobile */}
                                        <td className="md:hidden">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-gray-900 break-words">{santri.nama}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{santri.Kela.nama_kelas}</p>
                                                </div>
                                                <div className={`flex-shrink-0 text-lg font-bold ${santri.rekap.performance > 80 ? 'text-green-600' : 'text-yellow-600'}`}>{santri.rekap.performance}%</div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t grid grid-cols-4 gap-2 text-center">
                                                <RekapBadge label="Hadir" value={santri.rekap.H} color="green" />
                                                <RekapBadge label="Izin" value={santri.rekap.I} color="blue" />
                                                <RekapBadge label="Sakit" value={santri.rekap.S} color="yellow" />
                                                <RekapBadge label="Alpa" value={santri.rekap.A} color="red" />
                                            </div>
                                            <div className="mt-4 pt-3 border-t flex justify-end">
                                                <button onClick={() => openModal(santri)} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 hover:bg-blue-100">
                                                    <IconEye /><span>Lihat Detail</span>
                                                </button>
                                            </div>
                                        </td>
                                        
                                        {/* Table View untuk Desktop */}
                                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{santri.nama}</div>
                                            <div className="text-sm text-gray-500">{santri.Kela.nama_kelas}</div>
                                        </td>
                                        <td className="hidden md:table-cell px-2 py-4 text-center whitespace-nowrap text-sm font-semibold text-green-700">{santri.rekap.H}</td>
                                        <td className="hidden md:table-cell px-2 py-4 text-center whitespace-nowrap text-sm font-semibold text-blue-700">{santri.rekap.I}</td>
                                        <td className="hidden md:table-cell px-2 py-4 text-center whitespace-nowrap text-sm font-semibold text-yellow-700">{santri.rekap.S}</td>
                                        <td className="hidden md:table-cell px-2 py-4 text-center whitespace-nowrap text-sm font-semibold text-red-700">{santri.rekap.A}</td>
                                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-center">
                                            <div className={`relative w-20 h-5 bg-gray-200 rounded-full overflow-hidden`}>
                                                <div className={`absolute top-0 left-0 h-full rounded-full ${santri.rekap.performance > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${santri.rekap.performance}%` }}></div>
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800 mix-blend-screen">{santri.rekap.performance}%</span>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(santri)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1"><IconEye /><span>View</span></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="block md:table-row"><td colSpan="7" className="block md:table-cell text-center py-10 text-gray-500">
                                    {'Tidak ada data santri untuk filter yang dipilih.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {selectedSantri && (
                <AbsensiDetailModal isOpen={isModalOpen} closeModal={closeModal} santri={selectedSantri} token={token} />
            )}
        </>
    );
}