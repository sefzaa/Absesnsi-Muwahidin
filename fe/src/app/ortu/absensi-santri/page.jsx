"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { FiLoader, FiAlertCircle, FiPrinter } from 'react-icons/fi';
import moment from 'moment-timezone';
import 'moment/locale/id';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
moment.locale('id');
moment.tz.setDefault('Asia/Jakarta');

const getStatusClasses = (status) => {
    switch (status) {
        case 'Hadir': return 'bg-green-100 text-green-800';
        case 'Izin': return 'bg-blue-100 text-blue-800';
        case 'Sakit': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-red-100 text-red-800';
    }
};

const PerformanceCard = ({ title, percentage, colorClass }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{percentage.toFixed(1)}%</p>
    </div>
);

// [PERUBAHAN] Komponen AbsenTable sekarang responsif
const AbsenTable = ({ data, type, isLoading }) => {
    if (isLoading) return null;
    if (data.length === 0) {
        return <p className="text-center text-gray-500 py-8">Tidak ada data absensi pada periode ini.</p>;
    }

    const isAsrama = type === 'asrama';

    return (
        <>
            {/* Tampilan Tabel untuk Desktop (md ke atas) */}
            <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{isAsrama ? 'Nama Kegiatan' : 'Jam Pelajaran'}</th>
                        {!isAsrama && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item) => (
                        <tr key={isAsrama ? item.id_absen_kegiatan : item.id_absen_sekolah}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{moment(item.tanggal).format('dddd, DD MMMM YYYY')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{isAsrama ? item.nama_kegiatan : item.JamPelajaran.nama_jam}</td>
                            {!isAsrama && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.JamPelajaran.jam_mulai.substring(0, 5)} - {item.JamPelajaran.jam_selesai.substring(0, 5)}</td>}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(item.status)}`}>
                                    {item.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Tampilan Kartu untuk Mobile (di bawah md) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {data.map((item) => (
                    <div key={isAsrama ? item.id_absen_kegiatan : item.id_absen_sekolah} className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <p className="font-bold text-gray-800">
                                    {isAsrama ? item.nama_kegiatan : item.JamPelajaran.nama_jam}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {moment(item.tanggal).format('dddd, DD MMM YYYY')}
                                </p>
                                {!isAsrama && (
                                    <p className="text-sm text-gray-500">
                                        Pukul {item.JamPelajaran.jam_mulai.substring(0, 5)} - {item.JamPelajaran.jam_selesai.substring(0, 5)}
                                    </p>
                                )}
                            </div>
                            <div className="ml-4">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};


export default function AbsensiSantriPage() {
    const { token } = useAuth();
    const [anakList, setAnakList] = useState([]);
    const [selectedAnak, setSelectedAnak] = useState('');
    const [absensiData, setAbsensiData] = useState({ absensiKegiatan: [], absensiSekolah: [] });
    
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();

    const [filterBulan, setFilterBulan] = useState(currentMonth);
    const [filterTahun, setFilterTahun] = useState(currentYear);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('asrama'); // 'asrama' or 'sekolah'

    useEffect(() => {
        if (!token) return;
        const fetchAnak = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/ortu/anak`, { headers: { 'x-access-token': token } });
                if (!res.ok) throw new Error('Gagal mengambil daftar anak');
                const data = await res.json();
                setAnakList(data);
                if (data.length > 0) setSelectedAnak(data[0].id_santri);
            } catch (err) { setError(err.message); }
        };
        fetchAnak();
    }, [token]);

    useEffect(() => {
        if (!selectedAnak || !token) {
            setIsLoading(false);
            return;
        }
        
        const fetchAbsensi = async () => {
            setIsLoading(true);
            setError('');
            try {
                const url = `${backendUrl}/api/ortu/absensi/${selectedAnak}?bulan=${filterBulan}&tahun=${filterTahun}`;
                const res = await fetch(url, { headers: { 'x-access-token': token } });
                if (!res.ok) throw new Error('Gagal mengambil data absensi.');
                const data = await res.json();
                setAbsensiData(data);
            } catch (err) {
                setError(err.message);
                setAbsensiData({ absensiKegiatan: [], absensiSekolah: [] });
            } finally { setIsLoading(false); }
        };
        fetchAbsensi();
    }, [selectedAnak, filterBulan, filterTahun, token]);
    
    const performanceStats = useMemo(() => {
        const calcPerf = (data) => {
            if (!data || data.length === 0) return { total: 0, hadir: 0, percentage: 0 };
            const total = data.length;
            const hadir = data.filter(d => d.status === 'Hadir').length;
            return { total, hadir, percentage: (hadir / total) * 100 };
        };
        return { asrama: calcPerf(absensiData.absensiKegiatan), sekolah: calcPerf(absensiData.absensiSekolah) };
    }, [absensiData]);

    const handleCetak = () => {
        const santriName = anakList.find(a => a.id_santri === selectedAnak)?.nama || 'Santri';
        const period = moment(`${filterTahun}-${filterBulan}-01`).format('MMMM YYYY');
        
        const dataToPrint = activeTab === 'asrama' ? absensiData.absensiKegiatan : absensiData.absensiSekolah;
        const tableHeaders = activeTab === 'asrama' 
            ? `<th>Tanggal</th><th>Nama Kegiatan</th><th>Status</th>`
            : `<th>Tanggal</th><th>Jam Pelajaran</th><th>Waktu</th><th>Status</th>`;

        const tableRows = dataToPrint.map(item => activeTab === 'asrama' 
            ? `<tr><td>${moment(item.tanggal).format('DD MMM YYYY')}</td><td>${item.nama_kegiatan}</td><td>${item.status}</td></tr>`
            : `<tr><td>${moment(item.tanggal).format('DD MMM YYYY')}</td><td>${item.JamPelajaran.nama_jam}</td><td>${item.JamPelajaran.jam_mulai.substring(0,5)} - ${item.JamPelajaran.jam_selesai.substring(0,5)}</td><td>${item.status}</td></tr>`
        ).join('');
        
        const performance = activeTab === 'asrama' ? performanceStats.asrama : performanceStats.sekolah;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head><title>Rekap Absensi ${santriName}</title>
                    <style>
                        body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }
                        h1, h2 { text-align: center; } @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <h1>Rekap Absensi ${activeTab === 'asrama' ? 'Asrama' : 'Sekolah'}</h1>
                    <h2>${santriName} - Periode ${period}</h2>
                    <p><strong>Total Kehadiran:</strong> ${performance.hadir} dari ${performance.total} (${performance.percentage.toFixed(1)}%)</p>
                    <table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const generateYears = () => {
        const years = [];
        for (let i = currentYear; i >= currentYear - 5; i--) { years.push(i); }
        return years;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Anak</label>
                        <select
                            value={selectedAnak}
                            onChange={(e) => setSelectedAnak(Number(e.target.value))}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-700"
                            disabled={anakList.length === 0}
                        >
                            {anakList.map(anak => (<option key={anak.id_santri} value={anak.id_santri}>{anak.nama}</option>))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:col-span-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                            <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-700">
                                {moment.months().map((m, i) => (<option key={i+1} value={i+1}>{m}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                            <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-700">
                                {generateYears().map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleCetak} disabled={isLoading || (absensiData.absensiKegiatan.length === 0 && absensiData.absensiSekolah.length === 0)} className="flex items-center justify-center gap-2 w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200">
                        <FiPrinter /> Cetak Rekap
                    </button>
                </div>
            </div>

            {isLoading && <div className="flex justify-center p-8"><FiLoader className="animate-spin text-4xl text-indigo-600" /></div>}
            {error && <div className="flex items-center gap-2 bg-red-100 text-red-700 p-4 rounded-lg"><FiAlertCircle /> {error}</div>}

            {!isLoading && !error && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PerformanceCard title="Performa Kehadiran Asrama" percentage={performanceStats.asrama.percentage} colorClass="text-blue-600" />
                        <PerformanceCard title="Performa Kehadiran Sekolah" percentage={performanceStats.sekolah.percentage} colorClass="text-green-600" />
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="border-b border-gray-200">
                            {/* [PERUBAHAN] Navigasi Tab dibuat memenuhi kontainer */}
                            <nav className="flex" aria-label="Tabs">
                                <button onClick={() => setActiveTab('asrama')} className={`flex-1 text-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'asrama' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}>
                                    Absensi Asrama
                                </button>
                                <button onClick={() => setActiveTab('sekolah')} className={`flex-1 text-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'sekolah' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}>
                                    Absensi Sekolah
                                </button>
                            </nav>
                        </div>
                        
                        <div>
                           {activeTab === 'asrama' && <AbsenTable data={absensiData.absensiKegiatan} type="asrama" isLoading={isLoading} />}
                           {activeTab === 'sekolah' && <AbsenTable data={absensiData.absensiSekolah} type="sekolah" isLoading={isLoading} />}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}