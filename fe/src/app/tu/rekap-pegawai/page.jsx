"use client";

import { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import { FiEye, FiX, FiLoader, FiCalendar, FiUsers, FiPrinter, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Komponen Modal (Dengan Perbaikan) ---
const DetailModal = ({ pegawai, onClose, periode }) => { // periode adalah objek { bulan, tahun }
    if (!pegawai) return null;

    // --- PERBAIKAN DIMULAI DI SINI ---
    // Ubah objek periode menjadi teks yang bisa ditampilkan
    const periodeText = new Date(periode.tahun, periode.bulan - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Hadir': return 'bg-green-100 text-green-800';
            case 'Sakit': return 'bg-yellow-100 text-yellow-800';
            case 'Izin': return 'bg-blue-100 text-blue-800';
            case 'Alpa': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Ubah history dari objek ke array dan urutkan berdasarkan tanggal
    const historyList = Object.values(pegawai.history).sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    return (
        <Transition appear show={!!pegawai} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                <div className="p-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">Detail Absensi: {pegawai.nama}</Dialog.Title>
                                    {/* Gunakan variabel periodeText yang sudah diformat */}
                                    <p className="text-sm text-gray-500 mt-1">Periode: {periodeText}</p>
                                    {/* --- AKHIR PERBAIKAN --- */}
                                    <div className="mt-4 max-h-[60vh] overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {historyList.length > 0 ? (
                                                    historyList.map(item => (
                                                        <tr key={item.id_absensi}>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{new Date(item.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>{item.status}</span></td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{item.jam_masuk || '-'}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{item.keterangan || '-'}</td>
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
export default function RekapPegawaiPage() {
    const { token } = useAuth();
    const [rekapData, setRekapData] = useState([]);
    const [filters, setFilters] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() });
    const [isLoading, setIsLoading] = useState(true);
    const [modalPegawai, setModalPegawai] = useState(null);
    const [activeJabatanId, setActiveJabatanId] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'asc' });

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
            const data = await apiFetch(`/rekap-absen-pegawai?${params.toString()}`);
            setRekapData(data);
        } catch (error) {
            console.error("Gagal memuat data rekap:", error);
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, filters]);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token, filters]);

    useEffect(() => {
        if (rekapData.length > 0) {
            const isCurrentTabValid = rekapData.some(j => j.id_jabatan === activeJabatanId);
            if (activeJabatanId === 'all' || !isCurrentTabValid) {
                // Jangan lakukan apa-apa, biarkan 'all' atau tab yang valid tetap terpilih
            }
        } else {
             setActiveJabatanId('all');
        }
    }, [rekapData, activeJabatanId]);

    const handleFilterChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleSort = (key) => { setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' })); };
    const periodeText = new Date(filters.tahun, filters.bulan - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    const filteredAndSortedPegawai = useMemo(() => {
        let pegawaiList = [];
        if (activeJabatanId === 'all') {
            pegawaiList = rekapData.flatMap(jabatan => jabatan.pegawai);
        } else {
            const selectedJabatan = rekapData.find(j => j.id_jabatan === parseInt(activeJabatanId));
            pegawaiList = selectedJabatan ? selectedJabatan.pegawai : [];
        }

        pegawaiList.sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            if (valA < valB) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return pegawaiList;
    }, [rekapData, activeJabatanId, sortConfig]);

    const downloadRekap = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.text("Rekap Kehadiran Pegawai", 14, 22);
        doc.setFontSize(12);
        doc.text(`Periode: ${periodeText}`, 14, 30);

        rekapData.forEach((jabatan, index) => {
            if (index > 0) { doc.addPage(); }
            doc.setFontSize(14);
            doc.setTextColor(40);
            doc.text(`Jabatan: ${jabatan.nama_jabatan}`, 14, 40);

            const daysInMonth = new Date(filters.tahun, filters.bulan, 0).getDate();
            const dateColumns = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
            const head = [
                ['Nama Pegawai', 'Total', ...dateColumns]
            ];

            const body = [];
            jabatan.pegawai.forEach(p => {
                const { hadir, sakit, izin, alpa, terlambat } = p.performance;
                const totalText = `H:${hadir}, S:${sakit}, I:${izin}, A:${alpa}, T:${terlambat}`;
                const dateRow = [];
                for (let i = 1; i <= daysInMonth; i++) {
                    const date = `${filters.tahun}-${String(filters.bulan).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    const record = p.history[date];
                    let initial = '-';
                    if (record) {
                        initial = record.status.charAt(0);
                        if (record.status === 'Hadir' && record.status_jam_masuk === 'Terlambat') {
                            initial = 'T';
                        }
                    }
                    dateRow.push(initial);
                }
                body.push([p.nama, totalText, ...dateRow]);
            });

            autoTable(doc, {
                head: head,
                body: body,
                startY: 50,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 7, cellPadding: 1 },
            });
        });

        doc.save(`rekap_pegawai_${periodeText.replace(/\s+/g, '_')}.pdf`);
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
    const SortIcon = ({ direction }) => {
        if (!direction) return <FiChevronDown className="inline-block ml-1 text-gray-400" />
        return direction === 'asc' ? <FiChevronUp className="inline-block ml-1" /> : <FiChevronDown className="inline-block ml-1" />;
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <DetailModal pegawai={modalPegawai} onClose={() => setModalPegawai(null)} periode={filters} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Rekap Kehadiran Pegawai</h2>
                    <p className="text-gray-600">Laporan absensi untuk periode <span className="font-semibold">{periodeText}</span>.</p>
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
                        <button onClick={() => setActiveJabatanId('all')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeJabatanId === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Semua Jabatan</button>
                        {rekapData.map(jabatan => (
                            <button key={jabatan.id_jabatan} onClick={() => setActiveJabatanId(jabatan.id_jabatan)}
                                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeJabatanId === jabatan.id_jabatan ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                {jabatan.nama_jabatan}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex justify-end mb-4">
                        <button onClick={downloadRekap} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700">
                            <FiPrinter /> <span>Download Rekap</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('nama')}>Nama Pegawai <SortIcon direction={sortConfig.key === 'nama' ? sortConfig.direction : null}/></th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('jabatan')}>Jabatan <SortIcon direction={sortConfig.key === 'jabatan' ? sortConfig.direction : null}/></th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase" title="Hadir">H</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase" title="Sakit">S</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase" title="Izin">I</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase" title="Alpa">A</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase" title="Terlambat">T</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAndSortedPegawai.map((pegawai, index) => (
                                    <tr key={pegawai.id_pegawai}>
                                        <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{pegawai.nama}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{pegawai.jabatan}</td>
                                        <td className="px-2 py-4 text-sm text-center text-green-600 font-semibold">{pegawai.performance.hadir}</td>
                                        <td className="px-2 py-4 text-sm text-center text-yellow-600 font-semibold">{pegawai.performance.sakit}</td>
                                        <td className="px-2 py-4 text-sm text-center text-blue-600 font-semibold">{pegawai.performance.izin}</td>
                                        <td className="px-2 py-4 text-sm text-center text-red-600 font-semibold">{pegawai.performance.alpa}</td>
                                        <td className="px-2 py-4 text-sm text-center text-orange-600 font-semibold">{pegawai.performance.terlambat}</td>
                                        <td className="px-4 py-4 text-center">
                                            <button onClick={() => setModalPegawai(pegawai)} className="text-gray-500 hover:text-blue-600" title="Lihat Detail"><FiEye /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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