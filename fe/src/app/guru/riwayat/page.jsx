"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

// --- Komponen Ikon ---
const Icon = ({ children, className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>);
const FiLoader = ({ className }) => <Icon className={className}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></Icon>;
const FiBarChart2 = ({ className }) => <Icon className={className}><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></Icon>;
const FiEye = ({ className }) => <Icon className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></Icon>;
const FiX = ({ className }) => <Icon className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></Icon>;

// --- Komponen Notifikasi ---
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    const baseStyle = "fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white transition-opacity duration-300 z-50";
    const typeStyle = type === 'success' ? "bg-green-500" : "bg-red-500";
    return (<div className={`${baseStyle} ${typeStyle}`}><span>{message}</span><button onClick={onClose} className="ml-4 font-bold">X</button></div>);
};

// --- Komponen ProgressBar ---
const ProgressBar = ({ percentage }) => {
    const bgColor = percentage > 80 ? 'bg-green-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="w-full bg-gray-200 rounded-full h-4">
            <div className={`${bgColor} h-4 rounded-full text-xs text-white flex items-center justify-center`} style={{ width: `${percentage}%` }}>
                {percentage > 10 && `${percentage}%`}
            </div>
        </div>
    );
};

// --- Komponen Modal ---
const RiwayatModal = ({ santri, onClose, isLoading }) => {
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex justify-center items-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Riwayat Absen: {santri.nama}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <FiX className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center"><FiLoader className="animate-spin inline-block text-2xl" /></div>
                    ) : santri.history && santri.history.length > 0 ? (
                        <ul className="space-y-3">
                            {santri.history.map((item, index) => (
                                // --- PERBAIKAN DI SINI: Menambahkan key yang unik ---
                                <li key={`${item.tanggal}-${item.JamPelajaran.nama_jam}-${index}`} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                    <div>
                                        <p className="font-semibold text-gray-700">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <p className="text-sm text-gray-500">{item.JamPelajaran.nama_jam}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500">Tidak ada riwayat untuk ditampilkan.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Komponen Halaman Utama ---
const RiwayatPage = () => {
    const { token } = useAuth();
    const [kelas, setKelas] = useState([]);
    const [selectedKelasId, setSelectedKelasId] = useState(null);
    const [santriPerformance, setSantriPerformance] = useState([]);
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [loadingKelas, setLoadingKelas] = useState(true);
    const [loadingSantri, setLoadingSantri] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    const apiFetch = async (url, options = {}) => {
        try {
            const response = await fetch(`${backendUrl}/api${url}`, { ...options, headers: { 'Content-Type': 'application/json', 'x-access-token': token, ...options.headers } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'HTTP error');
            return data;
        } catch (err) {
            setNotification({ message: err.message || 'Gagal memuat data.', type: 'error' });
            throw err;
        }
    };

    useEffect(() => {
        if (token) {
            apiFetch('/riwayat-absen/kelas')
                .then(data => {
                    setKelas(data);
                    if (data.length > 0) {
                        handleKelasClick(data[0].id_kelas_sekolah);
                    }
                })
                .catch(() => {})
                .finally(() => setLoadingKelas(false));
        }
    }, [token]);

    const handleKelasClick = (kelasId) => {
        setSelectedKelasId(kelasId);
        setLoadingSantri(true);
        setSantriPerformance([]);
        apiFetch(`/riwayat-absen/performance?id_kelas_sekolah=${kelasId}`)
            .then(data => setSantriPerformance(data))
            .catch(() => {})
            .finally(() => setLoadingSantri(false));
    };

    const handleViewDetails = (santri) => {
        setIsModalOpen(true);
        setLoadingDetail(true);
        apiFetch(`/riwayat-absen/detail?id_santri=${santri.id_santri}`)
            .then(history => {
                setSelectedSantri({ ...santri, history });
            })
            .catch(() => {
                setIsModalOpen(false); // Tutup modal jika gagal
            })
            .finally(() => setLoadingDetail(false));
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSantri(null);
    };

    return (
        <div>
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            <RiwayatModal santri={selectedSantri} onClose={closeModal} isLoading={loadingDetail} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Riwayat Absensi</h1>
                <p className="text-gray-600">Lihat rekapitulasi kehadiran santri dari kelas yang pernah Anda ajar.</p>
            </div>

            {loadingKelas ? (
                <div className="text-center py-8"><FiLoader className="animate-spin inline-block text-3xl text-gray-500" /></div>
            ) : kelas.length > 0 ? (
                <>
                    <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-gray-200">
                        {kelas.map(k => (
                            <button key={k.id_kelas_sekolah} onClick={() => handleKelasClick(k.id_kelas_sekolah)}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${selectedKelasId === k.id_kelas_sekolah ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                {k.nama_kelas_sekolah}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {loadingSantri ? (
                            <div className="text-center py-8"><FiLoader className="animate-spin inline-block text-2xl text-gray-500" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">No</th>
                                            <th scope="col" className="px-6 py-3">Nama Santri</th>
                                            <th scope="col" className="px-6 py-3">Performa Kehadiran</th>
                                            <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {santriPerformance.map((santri, index) => (
                                            <tr key={santri.id_santri} className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 text-gray-800">{index + 1}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{santri.nama}</td>
                                                <td className="px-6 py-4">
                                                    <div className='flex items-center gap-4'>
                                                        <div className='w-full'>
                                                           <ProgressBar percentage={santri.percentage} />
                                                        </div>
                                                        <div className='text-xs text-gray-500 w-28 text-right'>
                                                           {santri.hadir} dari {santri.total} pertemuan
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleViewDetails(santri)} className="text-blue-600 hover:text-blue-800">
                                                        <FiEye className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <FiBarChart2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Belum Ada Riwayat</h3>
                    <p className="mt-1 text-sm text-gray-500">Anda belum pernah melakukan absensi. Silakan lakukan absensi terlebih dahulu.</p>
                </div>
            )}
        </div>
    );
};

export default RiwayatPage;