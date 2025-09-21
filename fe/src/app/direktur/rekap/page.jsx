"use client";

import { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
import { useAuth } from '../../AuthContext'; 
import { Dialog, Transition } from '@headlessui/react';
import { FiEye, FiPrinter, FiLoader, FiAlertCircle, FiX, FiSearch } from 'react-icons/fi';
import moment from 'moment-timezone';
import 'moment/locale/id';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
moment.locale('id');
moment.tz.setDefault('Asia/Jakarta');

// Komponen Detail Modal (Pop-up)
const DetailAbsenModal = ({ isOpen, closeModal, santriId, bulan, tahun, viewType }) => {
    const { token } = useAuth();
    const [detailData, setDetailData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && santriId) {
            setIsLoading(true);
            const fetchDetails = async () => {
                const url = `${backendUrl}/api/direktur/detail-santri/${santriId}?bulan=${bulan}&tahun=${tahun}`;
                try {
                    const res = await fetch(url, { headers: { 'x-access-token': token } });
                    const data = await res.json();
                    if(!res.ok) throw new Error(data.message || 'Gagal memuat detail');
                    setDetailData(data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDetails();
        }
    }, [isOpen, santriId, bulan, tahun, token]);

    const title = viewType === 'asrama' ? 'Absensi Asrama' : 'Absensi Sekolah';
    const dataToDisplay = detailData ? (viewType === 'asrama' ? detailData.absensiKegiatan : detailData.absensiSekolah) : [];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black bg-opacity-30" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-48"><FiLoader className="animate-spin text-4xl text-indigo-600" /></div>
                                ) : detailData ? (
                                    <>
                                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                            Detail {title}
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Santri: <strong>{detailData.santri.nama}</strong> <br/>
                                                Periode: {moment(`${tahun}-${bulan}-01`).format('MMMM YYYY')}
                                            </p>
                                        </div>
                                        <div className="mt-4 max-h-96 overflow-y-auto border rounded-md">
                                            {dataToDisplay.length > 0 ? (
                                                <table className="min-w-full text-sm divide-y divide-gray-200">
                                                    <thead className="bg-gray-50 sticky top-0">
                                                         <tr>
                                                            <th className="px-4 py-2 text-left font-medium text-gray-500">Tanggal</th>
                                                            <th className="px-4 py-2 text-left font-medium text-gray-500">{viewType === 'asrama' ? 'Kegiatan' : 'Pelajaran'}</th>
                                                            <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {dataToDisplay.map((item, index) => (
                                                            <tr key={item.id_absen_kegiatan || item.id_absen_sekolah || index}>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">{moment(item.tanggal).format('dddd, DD MMM YYYY')}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                                                                    {viewType === 'asrama' 
                                                                        ? (item.nama_kegiatan || 'Kegiatan tidak terdefinisi') 
                                                                        : (item.JamPelajaran?.nama_jam || 'N/A')}
                                                                </td>
                                                                <td className="px-4 py-2 whitespace-nowrap">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ item.status === 'Hadir' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                                                                        {item.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : <p className="p-4 text-gray-500 text-center">Tidak ada data absensi pada periode ini.</p>}
                                        </div>
                                    </>
                                ) : <p className="text-center p-8">Gagal memuat data detail.</p>}
                                <div className="mt-6 flex justify-end">
                                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none" onClick={closeModal}>
                                        Tutup
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// Komponen utama halaman rekap
export default function RekapPage() {
    const { token } = useAuth();
    const [rekapData, setRekapData] = useState([]);
    const [kelasOptions, setKelasOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');

    const currentYear = moment().year();
    const [filterBulan, setFilterBulan] = useState(moment().month() + 1);
    const [filterTahun, setFilterTahun] = useState(currentYear);
    const [filterKelas, setFilterKelas] = useState('');
    const [filterKelamin, setFilterKelamin] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSantriId, setSelectedSantriId] = useState(null);
    const [modalViewType, setModalViewType] = useState('asrama');

    useEffect(() => {
        if (!token) return;
        const fetchFilters = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/direktur/filters`, { headers: { 'x-access-token': token } });
                if (!res.ok) throw new Error((await res.json()).message);
                const data = await res.json();
                setKelasOptions(data);
            } catch (err) {
                setError(`Gagal memuat filter: ${err.message}`);
            }
        };
        fetchFilters();
    }, [token]);
    
    const fetchRekap = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError('');
        let url = `${backendUrl}/api/direktur/rekap?bulan=${filterBulan}&tahun=${filterTahun}`;
        if (filterKelas) url += `&id_kelas=${filterKelas}`;
        if (filterKelamin) url += `&jenis_kelamin=${filterKelamin}`;

        try {
            const res = await fetch(url, { headers: { 'x-access-token': token } });
            if (!res.ok) throw new Error((await res.json()).message || 'Gagal memuat rekap');
            const data = await res.json();
            setRekapData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, filterBulan, filterTahun, filterKelas, filterKelamin]);

    useEffect(() => {
        const handler = setTimeout(() => {
             fetchRekap();
        }, 500);
        return () => clearTimeout(handler);
    }, [fetchRekap]);
    
    const filteredData = useMemo(() => {
        if (!searchTerm) return rekapData;
        return rekapData.filter(santri => 
            santri.nama.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rekapData, searchTerm]);

    const handleViewDetail = (santriId, viewType) => {
        setSelectedSantriId(santriId);
        setModalViewType(viewType);
        setIsModalOpen(true);
    };

    const handleCetakSemua = () => {
        const dataToPrint = filteredData;
        const period = moment(`${filterTahun}-${filterBulan}-01`).format('MMMM YYYY');

        const groupedData = dataToPrint.reduce((acc, santri) => {
            const gender = santri.jenis_kelamin || 'Lainnya';
            const className = santri.nama_kelas || 'Tanpa Kelas';
            if (!acc[gender]) acc[gender] = {};
            if (!acc[gender][className]) acc[gender][className] = [];
            acc[gender][className].push(santri);
            return acc;
        }, {});

        let printContent = '';
        const genderOrder = ['Putra', 'Putri'];

        genderOrder.forEach(gender => {
            if (groupedData[gender]) {
                const classes = Object.keys(groupedData[gender]).sort();
                classes.forEach(className => {
                    const santriInClass = groupedData[gender][className];
                    printContent += `<div style="page-break-after: always;">`;
                    printContent += `<h3>Rekap Kelas: ${className} (${gender})</h3>`;
                    printContent += `<table><thead><tr><th>Nama Santri</th><th>Performa Asrama (%)</th><th>Performa Sekolah (%)</th></tr></thead><tbody>`;
                    santriInClass.forEach(s => {
                        printContent += `<tr><td>${s.nama}</td><td>${s.performa_asrama.toFixed(1)}</td><td>${s.performa_sekolah.toFixed(1)}</td></tr>`;
                    });
                    printContent += `</tbody></table></div>`;
                });
            }
        });
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Rekap Absensi Santri - ${period}</title>
            <style> body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; margin-top: 10px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; } th { background-color: #f2f2f2; } h1, h2 { text-align: center; } h3 { text-align: left; margin-top: 20px; padding-bottom: 5px; border-bottom: 1px solid #ccc;} @media print { .no-print { display: none; } div { page-break-inside: avoid; } } </style>
            </head><body> <h1>Rekap Absensi Seluruh Santri</h1><h2>Periode: ${period}</h2> ${printContent} <script>window.onload = function() { window.print(); window.close(); }</script> </body></html>`);
        printWindow.document.close();
    };
    
    const generateYears = () => Array.from({length: 6}, (_, i) => currentYear - i);

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Periode</label>
                        <div className="flex gap-2 mt-1">
                            <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} className="block w-full text-sm border-gray-300 rounded-md shadow-sm px-3 py-2.5 text-gray-500">
                                {moment.months().map((m, i) => (<option key={i+1} value={i+1}>{m}</option>))}
                            </select>
                            <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="block w-full text-sm border-gray-300 rounded-md shadow-sm px-3 py-2.5 text-gray-500">
                                {generateYears().map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                         <label className="text-sm font-medium text-gray-700">Kelas </label>
                        <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm px-3 py-2.5 text-gray-500">
                            <option value="">Semua Kelas</option>
                            {kelasOptions
                                .filter(k => k.nama_kelas.toLowerCase() !== 'alumni')
                                .map(k => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>)}
                        </select>
                    </div>
                     <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Cari Nama Santri</label>
                         <div className="relative mt-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Ketik nama..."
                                className="block w-full pl-10 text-sm border-gray-300 rounded-md shadow-sm px-3 py-2.5 text-gray-500"
                            />
                         </div>
                    </div>
                </div>
                 <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <div className="flex space-x-1 border border-gray-200 rounded-lg p-1">
                            {['', 'Putra', 'Putri'].map(gender => (
                                <button key={gender} onClick={() => setFilterKelamin(gender)} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${filterKelamin === gender ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    {gender === '' ? 'Semua Santri' : gender}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleCetakSemua} disabled={filteredData.length === 0 || isLoading} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-gray-400">
                        <FiPrinter /> Cetak Laporan
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                {isLoading && <div className="flex justify-center p-8"><FiLoader className="animate-spin text-4xl text-indigo-600" /></div>}
                {error && <div className="flex items-center gap-2 bg-red-100 text-red-700 p-4 rounded-lg"><FiAlertCircle /> {error}</div>}
                {!isLoading && !error && (
                    filteredData.length > 0 ? (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performa Asrama</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performa Sekolah</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredData.map((santri) => (
                                            <tr key={santri.id_santri}>
                                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{santri.nama}</div><div className="text-sm text-gray-500">{santri.nama_kelas}</div></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{santri.performa_asrama.toFixed(1)}%</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{santri.performa_sekolah.toFixed(1)}%</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex justify-center items-center space-x-2">
                                                        <button onClick={() => handleViewDetail(santri.id_santri, 'asrama')} title="Lihat Absen Asrama" className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><FiEye size={16}/></button>
                                                        <button onClick={() => handleViewDetail(santri.id_santri, 'sekolah')} title="Lihat Absen Sekolah" className="p-2 text-green-600 hover:bg-green-100 rounded-full"><FiEye size={16}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="md:hidden p-4 space-y-4">
                                {filteredData.map((santri) => (
                                    <div key={santri.id_santri} className="bg-white border rounded-lg p-4 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-md font-bold text-gray-900">{santri.nama}</p>
                                                <p className="text-sm text-gray-500">{santri.nama_kelas}</p>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <button onClick={() => handleViewDetail(santri.id_santri, 'asrama')} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><FiEye size={18}/></button>
                                                <button onClick={() => handleViewDetail(santri.id_santri, 'sekolah')} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><FiEye size={18}/></button>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                                            <div>
                                                <p className="text-xs text-gray-500">Asrama</p>
                                                <p className="text-lg font-semibold text-gray-500">{santri.performa_asrama.toFixed(1)}%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Sekolah</p>
                                                <p className="text-lg font-semibold text-gray-500">{santri.performa_sekolah.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <p className="text-center text-gray-500 py-8">Tidak ada data untuk ditampilkan sesuai filter.</p>
                )}
            </div>

            <DetailAbsenModal 
                isOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                santriId={selectedSantriId}
                bulan={filterBulan}
                tahun={filterTahun}
                viewType={modalViewType}
            />
        </div>
    );
}

