// file: src/app/wali-kamar/absensi/page.jsx
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiSun, FiCheckSquare, FiPlusSquare, FiLoader, FiEdit, FiCheckCircle } from 'react-icons/fi';
import moment from 'moment-timezone';
import 'moment/locale/id';
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const iconMap = { FiSun, FiCheckSquare, FiPlusSquare };

export default function AbsensiPage() {
    const [kegiatanList, setKegiatanList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        const today = moment().tz('Asia/Jakarta').locale('id');
        setCurrentDate(today.format('dddd, DD MMMM YYYY'));

        const fetchKegiatan = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const response = await fetch(`${backendUrl}/api/absensi/kegiatan-hari-ini`, {
                    headers: { 'x-access-token': token }
                });
                if (!response.ok) throw new Error('Gagal memuat kegiatan');
                const data = await response.json();
                setKegiatanList(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchKegiatan();
    }, [token]);

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Kegiatan - {currentDate}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-10"><FiLoader className="animate-spin inline-block mr-2" /> Memuat kegiatan...</div>
                ) : kegiatanList.length > 0 ? (
                    kegiatanList.map((kegiatan) => {
                        const IconComponent = iconMap[kegiatan.icon] || FiCheckSquare;
                        return (
                            // --- CARD KEGIATAN YANG SUDAH DIMODIFIKASI ---
                            <div key={kegiatan.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col justify-between gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${kegiatan.iconBg}`}><IconComponent className={`h-6 w-6 ${kegiatan.iconColor}`} /></div>
                                        <p className="font-semibold text-gray-800">{kegiatan.name}</p>
                                    </div>
                                    {kegiatan.isCompleted && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                            <FiCheckCircle /> Selesai
                                        </span>
                                    )}
                                </div>
                                
                                {kegiatan.isCompleted && (
                                    <div className="text-xs text-gray-500 grid grid-cols-2 gap-x-4 gap-y-1">
                                        <span>Hadir: <span className="font-semibold text-gray-700">{kegiatan.summary.Hadir}/{kegiatan.totalSantri}</span></span>
                                        <span>Izin: <span className="font-semibold text-gray-700">{kegiatan.summary.Izin}/{kegiatan.totalSantri}</span></span>
                                        <span>Sakit: <span className="font-semibold text-gray-700">{kegiatan.summary.Sakit}/{kegiatan.totalSantri}</span></span>
                                        <span>Alpa: <span className="font-semibold text-gray-700">{kegiatan.summary.Alpa}/{kegiatan.totalSantri}</span></span>
                                    </div>
                                )}
                                
                                <Link
                                    href={`/wali-kamar/absensi/${kegiatan.id}`}
                                    className={`flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        kegiatan.isCompleted
                                        ? 'bg-yellow-400 text-white hover:bg-yellow-500'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                                >
                                    {kegiatan.isCompleted ? <FiEdit size={16} /> : <FiCheckSquare size={16} />}
                                    <span>{kegiatan.isCompleted ? 'Edit Absensi' : 'Absen'}</span>
                                </Link>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center text-gray-500 py-10"><p>Tidak ada kegiatan yang perlu diabsen hari ini.</p></div>
                )}
            </div>
        </div>
    );
}