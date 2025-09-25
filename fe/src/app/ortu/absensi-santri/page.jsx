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

// REVISI: PerformanceCard sekarang menampilkan rekap HISA
const PerformanceCard = ({ title, stats, colorClass }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={`text-3xl font-bold ${colorClass}`}>{stats.percentage.toFixed(1)}%</p>
        </div>
        <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-center space-x-2">
                <span className="font-medium text-green-600">H: {stats.H}</span>
                <span className="font-medium text-blue-600">I: {stats.I}</span>
                <span className="font-medium text-yellow-600">S: {stats.S}</span>
                <span className="font-medium text-red-600">A: {stats.A}</span>
            </p>
        </div>
    </div>
);

const AbsenList = ({ data, type, isLoading }) => {
    if (isLoading) return null;
    if (data.length === 0) {
        return <p className="text-center text-gray-500 py-8">Tidak ada data absensi pada periode ini.</p>;
    }

    const isAsrama = type === 'asrama';

    return (
        <div className="space-y-3">
            {data.map((item) => (
                <div key={isAsrama ? item.id_absen_kegiatan : item.id_absen_sekolah} className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-500">
                                {moment(item.tanggal).format('dddd, DD MMMM YYYY')}
                            </p>
                            <p className="font-bold text-gray-800 break-words mt-1">
                                {isAsrama ? item.nama_kegiatan : item.JamPelajaran.nama_jam}
                            </p>
                            {!isAsrama && (
                                <p className="text-sm text-gray-500">
                                    Pukul {item.JamPelajaran.jam_mulai.substring(0, 5)} - {item.JamPelajaran.jam_selesai.substring(0, 5)}
                                </p>
                            )}
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(item.status)}`}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
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
    const [activeTab, setActiveTab] = useState('asrama');

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
        if (!selectedAnak || !token) { setIsLoading(false); return; }
        
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
        const calcStats = (data) => {
            if (!data || data.length === 0) return { total: 0, H: 0, I: 0, S: 0, A: 0, percentage: 0 };
            const total = data.length;
            const hadir = data.filter(d => d.status === 'Hadir').length;
            const izin = data.filter(d => d.status === 'Izin').length;
            const sakit = data.filter(d => d.status === 'Sakit').length;
            const alpa = data.filter(d => d.status === 'Alpa').length;
            return { total, H: hadir, I: izin, S: sakit, A: alpa, percentage: (hadir / total) * 100 };
        };
        return { asrama: calcStats(absensiData.absensiKegiatan), sekolah: calcStats(absensiData.absensiSekolah) };
    }, [absensiData]);

    const handleCetak = () => {
        const santriName = anakList.find(a => a.id_santri == selectedAnak)?.nama || 'Santri';
        const period = moment(`${filterTahun}-${filterBulan}-01`).format('MMMM YYYY');
        
        const dataToPrint = activeTab === 'asrama' ? absensiData.absensiKegiatan : absensiData.absensiSekolah;
        const performance = activeTab === 'asrama' ? performanceStats.asrama : performanceStats.sekolah;
        
        const tableHeaders = activeTab === 'asrama' 
            ? `<th>Tanggal</th><th>Nama Kegiatan</th><th>Status</th>`
            : `<th>Tanggal</th><th>Jam Pelajaran</th><th>Waktu</th><th>Status</th>`;

        const tableRows = dataToPrint.map(item => activeTab === 'asrama' 
            ? `<tr><td>${moment(item.tanggal).format('DD MMM YYYY')}</td><td>${item.nama_kegiatan}</td><td>${item.status}</td></tr>`
            : `<tr><td>${moment(item.tanggal).format('DD MMM YYYY')}</td><td>${item.JamPelajaran.nama_jam}</td><td>${item.JamPelajaran.jam_mulai.substring(0,5)} - ${item.JamPelajaran.jam_selesai.substring(0,5)}</td><td>${item.status}</td></tr>`
        ).join('');
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Rekap Absensi ${santriName}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10px; }
                        .container { width: 95%; margin: auto; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: 600; }
                        h1, h2 { text-align: center; margin: 5px 0; }
                        h1 { font-size: 16px; } h2 { font-size: 14px; font-weight: normal; }
                        .rekap-summary { margin-top: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #f9f9f9; }
                        .rekap-summary p { margin: 4px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Rekap Absensi ${activeTab === 'asrama' ? 'Asrama' : 'Sekolah'}</h1>
                        <h2>${santriName} - Periode ${period}</h2>
                        <div class="rekap-summary">
                            <p><strong>Total Kegiatan/Pelajaran:</strong> ${performance.total}</p>
                            <p><strong>Hadir:</strong> ${performance.H}</p>
                            <p><strong>Izin:</strong> ${performance.I}</p>
                            <p><strong>Sakit:</strong> ${performance.S}</p>
                            <p><strong>Alpa:</strong> ${performance.A}</p>
                            <p><strong>Performa Kehadiran:</strong> ${performance.percentage.toFixed(1)}%</p>
                        </div>
                        <table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
                        <script>window.onload = function() { window.print(); window.close(); }</script>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const generateYears = () => Array.from({length: 6}, (_, i) => currentYear - i);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Anak</label>
                        <select
                            value={selectedAnak}
                            onChange={(e) => setSelectedAnak(e.target.value)}
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
                        <PerformanceCard title="Performa Kehadiran Asrama" stats={performanceStats.asrama} colorClass="text-blue-600" />
                        <PerformanceCard title="Performa Kehadiran Sekolah" stats={performanceStats.sekolah} colorClass="text-green-600" />
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="border-b border-gray-200">
                            <nav className="flex" aria-label="Tabs">
                                <button onClick={() => setActiveTab('asrama')} className={`flex-1 text-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'asrama' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}>
                                    Absensi Asrama
                                </button>
                                <button onClick={() => setActiveTab('sekolah')} className={`flex-1 text-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'sekolah' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}>
                                    Absensi Sekolah
                                </button>
                            </nav>
                        </div>
                        
                        <div className="p-4">
                           {activeTab === 'asrama' && <AbsenList data={absensiData.absensiKegiatan} type="asrama" isLoading={isLoading} />}
                           {activeTab === 'sekolah' && <AbsenList data={absensiData.absensiSekolah} type="sekolah" isLoading={isLoading} />}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}