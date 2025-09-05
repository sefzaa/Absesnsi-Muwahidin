"use client";

import { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
import { useAuth } from '../../AuthContext'; // Sesuaikan path ini
import { Dialog, Transition } from '@headlessui/react';
import { FiDownload, FiEye, FiX, FiLoader, FiCalendar, FiUsers, FiPrinter } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Komponen ProgressBar (Dikembalikan) ---
const ProgressBar = ({ percentage }) => {
    const bgColor = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`${bgColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

// --- Komponen Modal (Dikembalikan ke Tampilan Awal) ---
const DetailModal = ({ santri, onClose, periode }) => {
    if (!santri) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Hadir': return 'bg-green-100 text-green-800';
            case 'Sakit': return 'bg-yellow-100 text-yellow-800';
            case 'Izin': return 'bg-blue-100 text-blue-800';
            case 'Alpa': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Transition appear show={!!santri} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                <div className="p-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">Detail Absensi: {santri.nama}</Dialog.Title>
                                    <p className="text-sm text-gray-500 mt-1">Periode: {periode}</p>
                                    <div className="mt-4 max-h-[60vh] overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jam Pelajaran</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guru</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {santri.history.length > 0 ? (
                                                    santri.history.map((item, index) => (
                                                        <tr key={`${item.tanggal}-${item.nama_jam}-${index}`}>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{new Date(item.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{item.nama_jam}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>{item.status}</span></td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{item.guru}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="4" className="text-center py-4 text-sm text-gray-500">Tidak ada data riwayat absensi.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 flex justify-end">
                                    <button type="button" onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300">Tutup</button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// --- Komponen Utama Halaman ---
export default function RekapSantriPage() {
    const { token } = useAuth();
    const [rekapData, setRekapData] = useState([]);
    const [filters, setFilters] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() });
    const [isLoading, setIsLoading] = useState(true);
    const [modalSantri, setModalSantri] = useState(null);
    const [activeKelasId, setActiveKelasId] = useState(null);

    const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

    const apiFetch = useCallback(async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const headers = { 'Content-Type': 'application/json', 'x-access-token': token, ...options.headers };
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
            throw new Error(errorData.message);
        }
        return response.json();
    }, [token]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams(filters);
            const data = await apiFetch(`/rekap-absen-sekolah?${params.toString()}`);
            setRekapData(data);
            if (data.length > 0 && activeKelasId === null) {
                setActiveKelasId(data[0].id_kelas_sekolah);
            } else if (data.length === 0) {
                setActiveKelasId(null);
            }
        } catch (error) {
            console.error("Gagal memuat data rekap:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, filters, activeKelasId]);

    useEffect(() => { if (token) { fetchData(); } }, [token, filters]);
    const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); setActiveKelasId(null); };
    const periodeText = new Date(filters.tahun, filters.bulan - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const activeKelasData = useMemo(() => {
        if (!activeKelasId) return null;
        return rekapData.find(kelas => kelas.id_kelas_sekolah === activeKelasId);
    }, [rekapData, activeKelasId]);

    // --- Fungsi Download PDF per Santri (Format Detail Dikembalikan) ---
    const downloadPdfSantri = (santri, kelasInfo) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Rekap Kehadiran Detail: ${santri.nama}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Kelas: ${kelasInfo.nama_kelas_sekolah}`, 14, 30);
        doc.text(`Periode: ${periodeText}`, 14, 36);

        const tableColumn = ["Tanggal", "Jam Pelajaran", "Status", "Diabsen oleh"];
        const tableRows = santri.history.map(item => [
            new Date(item.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}),
            item.nama_jam, 
            item.status,
            item.guru
        ]);

        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45 });
        
        const finalY = (doc).lastAutoTable.finalY;
        doc.setFontSize(11);
        doc.text("Ringkasan Performa:", 14, finalY + 10);
        const { hadir, sakit, izin, alpa, total, percentage } = santri.performance;
        const summaryText = `Hadir: ${hadir} | Sakit: ${sakit} | Izin: ${izin} | Alpa: ${alpa}\nTotal Pertemuan Tercatat: ${total}\nPersentase Kehadiran: ${percentage}%`;
        doc.text(summaryText, 14, finalY + 16);

        doc.save(`rekap_detail_${santri.nama.replace(/\s+/g, '_')}_${periodeText}.pdf`);
    };
    
    // --- Fungsi Download PDF Matriks per Kelas (Nama Diperbaiki) ---
    const downloadRekapKelas = (kelas) => {
        if (!kelas) return;
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text(`Rekap Kehadiran Kelas: ${kelas.nama_kelas_sekolah}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Periode: ${periodeText}`, 14, 30);

        const daysInMonth = new Date(filters.tahun, filters.bulan, 0).getDate();
        const dateColumns = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
        const head = [
            [{ content: 'Nama Santri', rowSpan: 2, styles: { valign: 'middle'} }, { content: 'Performa', rowSpan: 2, styles: { valign: 'middle'} }, { content: 'Jam Pelajaran', rowSpan: 2, styles: { valign: 'middle'} }, { content: 'Tanggal', colSpan: daysInMonth, styles: { halign: 'center' } }],
            dateColumns
        ];

        const body = [];
        kelas.santri.forEach(santri => {
            const { hadir, sakit, izin, alpa, percentage } = santri.performance;
            const performaText = `${percentage}% (H:${hadir} S:${sakit} I:${izin} A:${alpa})`;
            
            kelas.master_jp.forEach((jp, jpIndex) => {
                const row = [];
                if (jpIndex === 0) {
                    row.push({ content: santri.nama, rowSpan: kelas.master_jp.length });
                    row.push({ content: performaText, rowSpan: kelas.master_jp.length });
                }
                row.push(jp.nama_jam);

                for (let i = 1; i <= daysInMonth; i++) {
                    const date = `${filters.tahun}-${String(filters.bulan).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    const status = santri.history_matrix[date]?.[jp.id_jam_pelajaran] || '-';
                    const initial = status.charAt(0);

                    let cellStyle = { halign: 'center', fontSize: 8 };
                    if(status === 'Hadir') cellStyle.textColor = [0, 150, 0];
                    if(status === 'Sakit') cellStyle.textColor = [255, 165, 0];
                    if(status === 'Izin') cellStyle.textColor = [0, 0, 255];
                    if(status === 'Alpa') cellStyle.textColor = [255, 0, 0];

                    row.push({ content: initial, styles: cellStyle });
                }
                body.push(row);
            });
        });

        autoTable(doc, {
            head: head,
            body: body,
            startY: 40,
            theme: 'grid',
            didParseCell: function(data) { if (data.cell.raw.rowSpan) { data.cell.styles.valign = 'middle'; } },
            styles: { fontSize: 8, cellPadding: 1, },
            headStyles: { fontSize: 8, fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: 'center' }
        });

        doc.save(`rekap_matriks_${kelas.nama_kelas_sekolah.replace(/\s+/g, '_')}_${periodeText}.pdf`);
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <DetailModal santri={modalSantri} onClose={() => setModalSantri(null)} periode={periodeText} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Rekap Kehadiran Santri</h2>
                    <p className="text-gray-600">Laporan absensi sekolah untuk periode <span className="font-semibold">{periodeText}</span>.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <select name="bulan" value={filters.bulan} onChange={handleFilterChange} className="block w-full sm:w-auto rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 text-gray-900">
                        {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                    </select>
                    <select name="tahun" value={filters.tahun} onChange={handleFilterChange} className="block w-full sm:w-auto rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 text-gray-900">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20"><FiLoader className="animate-spin inline-block text-4xl text-blue-500" /></div>
            ) : rekapData.length > 0 ? (
                <>
                    <div className="mb-6 flex flex-wrap items-center -mb-px border-b border-gray-200">
                        {rekapData.map(kelas => (
                            <button key={kelas.id_kelas_sekolah} onClick={() => setActiveKelasId(kelas.id_kelas_sekolah)}
                                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                                    activeKelasId === kelas.id_kelas_sekolah
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}>
                                {kelas.nama_kelas_sekolah}
                            </button>
                        ))}
                    </div>

                    {activeKelasData && (
                        <div>
                             <div className="flex justify-end mb-4">
                                <button onClick={() => downloadRekapKelas(activeKelasData)} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700">
                                    <FiPrinter /> <span>Download Rekap Kelas Ini</span>
                                </button>
                             </div>
                            
                            {/* --- Tampilan Tabel dan Kartu Dikembalikan Seperti Semula --- */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" title="Hadir">H</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" title="Sakit">S</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" title="Izin">I</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" title="Alpa">A</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performa</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {activeKelasData.santri.map((santri, index) => (
                                            <tr key={santri.id_santri}>
                                                <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-4 text-sm font-medium text-gray-900">{santri.nama}</td>
                                                <td className="px-4 py-4 text-sm text-center text-green-600 font-semibold">{santri.performance.hadir}</td>
                                                <td className="px-4 py-4 text-sm text-center text-yellow-600 font-semibold">{santri.performance.sakit}</td>
                                                <td className="px-4 py-4 text-sm text-center text-blue-600 font-semibold">{santri.performance.izin}</td>
                                                <td className="px-4 py-4 text-sm text-center text-red-600 font-semibold">{santri.performance.alpa}</td>
                                                <td className="px-4 py-4 text-sm text-gray-500 min-w-[150px]">
                                                    <div className="flex items-center gap-2">
                                                        <ProgressBar percentage={santri.performance.percentage} />
                                                        <span className="font-semibold">{santri.performance.percentage}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => setModalSantri(santri)} className="text-gray-500 hover:text-blue-600" title="Lihat Detail"><FiEye /></button>
                                                        <button onClick={() => downloadPdfSantri(santri, activeKelasData)} className="text-gray-500 hover:text-red-600" title="Download PDF Detail"><FiDownload /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {activeKelasData.santri.map((santri) => (
                                    <div key={santri.id_santri} className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-gray-900">{santri.nama}</p>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setModalSantri(santri)} className="text-gray-500 hover:text-blue-600 p-1" title="Lihat Detail"><FiEye /></button>
                                                <button onClick={() => downloadPdfSantri(santri, activeKelasData)} className="text-gray-500 hover:text-red-600 p-1" title="Download PDF Detail"><FiDownload /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <ProgressBar percentage={santri.performance.percentage} />
                                                <span className="text-sm font-semibold">{santri.performance.percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-100 pt-3 text-sm grid grid-cols-2 gap-2">
                                            <div className="flex justify-between"><span>Hadir:</span> <span className="font-semibold text-green-600">{santri.performance.hadir}</span></div>
                                            <div className="flex justify-between"><span>Sakit:</span> <span className="font-semibold text-yellow-600">{santri.performance.sakit}</span></div>
                                            <div className="flex justify-between"><span>Izin:</span> <span className="font-semibold text-blue-600">{santri.performance.izin}</span></div>
                                            <div className="flex justify-between"><span>Alpa:</span> <span className="font-semibold text-red-600">{santri.performance.alpa}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Data Tidak Ditemukan</h3>
                    <p className="mt-1 text-sm text-gray-500">Tidak ada data absensi untuk periode yang dipilih.</p>
                </div>
            )}
        </div>
    );
}