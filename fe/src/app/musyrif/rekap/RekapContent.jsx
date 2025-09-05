"use client";

import { useState, useEffect, useCallback } from 'react';
import { FiLoader, FiUser, FiUserCheck, FiChevronRight } from 'react-icons/fi';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Ini adalah komponen yang akan digunakan di Modal dan di halaman Cetak
export default function RekapContent({ santri, token, isPrintPage = false }) {
    const [rekapData, setRekapData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchData = useCallback(async () => {
        if (!santri || !token) return;
        setIsLoading(true);
        
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        try {
            const response = await fetch(`${backendUrl}/api/rekap/${santri.id_santri}?startDate=${startDate}&endDate=${endDate}`, {
                headers: { 'x-access-token': token }
            });
            if (!response.ok) throw new Error('Gagal memuat data rekap');
            setRekapData(await response.json());
        } catch (error) {
            console.error(error);
            setRekapData(null);
        } finally {
            setIsLoading(false);
        }
    }, [santri, month, year, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const monthName = new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });

    return (
        <div>
            {/* --- HEADER --- */}
            <div className={`border-b border-gray-200 pb-4 ${isPrintPage ? 'text-center' : ''}`}>
                <h3 className="text-2xl font-bold leading-6 text-gray-900">
                    Rekapitulasi Santri: {santri?.nama}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Menampilkan data untuk periode <span className="font-semibold">{monthName} {year}</span>
                </p>
            </div>

            {/* --- KONTROL FILTER --- */}
            <div className="flex flex-col sm:flex-row items-center gap-4 my-6 print:hidden">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                        {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                    </select>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                        {Array.from({ length: 5 }, (_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
                    </select>
                </div>
                 {/* Tombol Cetak hanya ada di halaman print */}
                {isPrintPage && (
                     <button onClick={() => window.print()} className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-md hover:bg-gray-900">
                        <FiPrinter size={16} /><span>Cetak Laporan</span>
                    </button>
                )}
            </div>
            
            {/* --- KONTEN REKAP --- */}
            <div className={`mt-4 space-y-6 ${!isPrintPage ? 'max-h-[60vh] overflow-y-auto pr-3 -mr-3' : ''}`}>
                {isLoading ? (
                    <div className="flex justify-center items-center p-20 text-gray-500">
                        <FiLoader className="animate-spin h-8 w-8 mr-4" />
                        <span className="text-lg">Memuat rekap...</span>
                    </div>
                ) : rekapData ? (
                    <>
                        <RekapSection 
                            icon={FiUser} 
                            title="Data Diri Santri"
                            data={rekapData.santri}
                            isInfo
                        />
                        <RekapSection 
                            icon={FiUserCheck} 
                            title="Rekapitulasi Absensi" 
                            data={rekapData.absensi?.list} 
                            performance={rekapData.absensi?.performa}
                            renderItem={(item) => (
                                <div className="flex justify-between items-center py-1">
                                    <span>
                                        <span className="font-semibold text-gray-800">{item.kegiatan_nama}</span> - <span className={`font-medium ${item.status === 'Hadir' ? 'text-green-600' : 'text-red-600'}`}>{item.status}</span>
                                    </span>
                                    <span className="text-xs text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                            )} 
                        />
                        {/* Tambahkan komponen RekapSection lain di sini jika ada data lain */}
                    </>
                ) : (
                    <div className="text-center p-20 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-gray-700">Data Tidak Ditemukan</p>
                        <p className="text-sm text-gray-500 mt-1">Tidak ada data rekapitulasi yang tersedia untuk periode yang dipilih.</p>
                    </div>
                )}
            </div>
        </div>
    );
}


// Komponen ini tidak berubah, jadi kita letakkan di sini agar file lebih rapi
const RekapSection = ({ icon: Icon, title, data, renderItem, performance, isInfo }) => {
    if (isInfo && data) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm print:shadow-none print:border-gray-400">
                <h4 className="flex items-center gap-3 font-bold text-lg text-gray-800 mb-4">
                    <Icon className="text-blue-600" size={20}/> 
                    <span>{title}</span>
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div className="text-gray-500">Nama Lengkap</div>
                    <div className="font-semibold text-gray-900">{data.nama || '-'}</div>
                    <div className="text-gray-500">Kelas</div>
                    <div className="font-semibold text-gray-900">{data.Kela?.nama_kelas || '-'}</div>
                </div>
            </div>
        );
    }
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm print:shadow-none print:border-gray-400">
            <div className="flex justify-between items-start p-5 border-b border-gray-200 print:border-gray-400">
                <h4 className="flex items-center gap-3 font-bold text-lg text-gray-800">
                    <Icon className="text-blue-600" size={20} /> 
                    <span>{title}</span>
                </h4>
                {performance != null && (
                    <div className="text-right flex-shrink-0 ml-4">
                        <p className={`font-bold text-2xl ${performance >= 80 ? 'text-green-600' : performance >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {performance}%
                        </p>
                        <p className="text-xs text-gray-500 -mt-1">Performa Kehadiran</p>
                    </div>
                )}
            </div>
            <div className="p-5">
                {data && data.length > 0 ? (
                    <ul className="space-y-2">
                        {data.map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 pb-2 last:pb-0 print:border-gray-300">
                                <FiChevronRight className="mt-1 text-gray-400 flex-shrink-0" />
                                <div className="flex-grow">{renderItem(item, index)}</div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-center text-gray-500 py-4">Tidak ada data untuk periode ini.</p>
                )}
            </div>
        </div>
    );
};