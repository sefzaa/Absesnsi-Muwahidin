"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

// --- Icon Components (Pengganti react-icons) ---
const Icon = ({ children, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {children}
    </svg>
);
const FiHome = ({ className }) => <Icon className={className}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></Icon>;
const FiUsers = ({ className }) => <Icon className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></Icon>;
const FiLoader = ({ className }) => <Icon className={className}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></Icon>;
const FiArrowLeft = ({ className }) => <Icon className={className}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></Icon>;
const FiCheckSquare = ({ className }) => <Icon className={className}><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></Icon>;
const FiSave = ({ className }) => <Icon className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></Icon>;


// Komponen Notifikasi
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    const baseStyle = "fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white transition-opacity duration-300 z-50";
    const typeStyle = type === 'success' ? "bg-green-500" : "bg-red-500";
    return (
        <div className={`${baseStyle} ${typeStyle}`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold">X</button>
        </div>
    );
};

const AbsenPage = () => {
    const { user, token } = useAuth();

    const [view, setView] = useState('kelas'); // 'kelas', 'jam', 'absen'
    const [kelasSekolah, setKelasSekolah] = useState([]);
    const [jamPelajaran, setJamPelajaran] = useState([]);
    const [santriList, setSantriList] = useState([]);
    
    const [selectedKelas, setSelectedKelas] = useState(null);
    const [selectedJam, setSelectedJam] = useState([]); // Array of IDs
    const [absensi, setAbsensi] = useState({}); // { [id_santri]: { status: 'Hadir' } }
    
    const [currentDate, setCurrentDate] = useState('');
    const [tanggalForApi, setTanggalForApi] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    // --- STATE BARU UNTUK MENYIMPAN DATA SUMMARY ---
    const [summaries, setSummaries] = useState({});

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    const showNotification = (message, type = 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 4000);
    };

    const apiFetch = async (url, options = {}) => {
        try {
            const response = await fetch(`${backendUrl}/api${url}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token,
                    ...options.headers,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (err) {
            console.error("API Fetch Error:", err);
            showNotification(err.message || 'Terjadi kesalahan jaringan.');
            throw err;
        }
    };

    const fetchSummaries = async (tanggal) => {
        if (!tanggal) return;
        try {
            const data = await apiFetch(`/absen-sekolah/summary?tanggal=${tanggal}`);
            setSummaries(data);
        } catch (err) {
            console.error("Gagal mengambil summary:", err);
            setSummaries({}); // Reset jika gagal
        }
    };

    useEffect(() => {
        const today = new Date();
        const formattedDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(today);
        setTanggalForApi(formattedDate);
        setCurrentDate(new Intl.DateTimeFormat('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta'
        }).format(today));
        
        if (token) {
            fetchKelasSekolah();
            fetchSummaries(formattedDate);
        } else {
            setLoading(false);
        }
    }, [token]);
    
    const fetchKelasSekolah = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/absen-sekolah/kelas-sekolah');
            setKelasSekolah(data);
        } catch (err) {
            // Notifikasi sudah ditangani oleh apiFetch
        } finally {
            setLoading(false);
        }
    };
    
    const handleKelasClick = async (kelas) => {
        setSelectedKelas(kelas);
        setLoading(true);
        try {
            const data = await apiFetch(`/absen-sekolah/jam-pelajaran?id_kelas_sekolah=${kelas.id_kelas_sekolah}&tanggal=${tanggalForApi}`);
            setJamPelajaran(data);
            setView('jam');
        } catch (err) {
            setView('kelas');
        } finally {
            setLoading(false);
        }
    };

    const handleJamSelection = (id_jam) => {
        setSelectedJam(prev => 
            prev.includes(id_jam) 
                ? prev.filter(id => id !== id_jam) 
                : [...prev, id_jam]
        );
    };

    const handleMulaiAbsen = async () => {
        if (selectedJam.length === 0) {
            showNotification("Pilih minimal satu jam pelajaran.");
            return;
        }
        setLoading(true);
        try {
            const santriData = await apiFetch(`/absen-sekolah/santri/${selectedKelas.id_kelas_sekolah}`);
            setSantriList(santriData);
            
            const existingAbsenData = await apiFetch(`/absen-sekolah/detail?id_kelas_sekolah=${selectedKelas.id_kelas_sekolah}&tanggal=${tanggalForApi}&id_jam_pelajaran=${selectedJam[0]}`);
            
            const initialAbsensi = {};
            const absenMap = new Map(existingAbsenData.map(item => [item.id_santri, item.status]));

            santriData.forEach(santri => {
                initialAbsensi[santri.id_santri] = {
                    status: absenMap.get(santri.id_santri) || 'Hadir'
                };
            });

            setAbsensi(initialAbsensi);
            setView('absen');
        } catch (err) {
            // Notifikasi sudah ditangani
        } finally {
            setLoading(false);
        }
    };

    const handleAbsensiChange = (id_santri, status) => {
        setAbsensi(prev => ({
            ...prev,
            [id_santri]: { ...prev[id_santri], status }
        }));
    };
    
    const handleSubmitAbsensi = async () => {
        if (!user || !user.id_pegawai) {
            showNotification("Data pegawai tidak ditemukan, silakan login ulang.");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                id_kelas_sekolah: selectedKelas.id_kelas_sekolah,
                id_pegawai: user.id_pegawai,
                tanggal: tanggalForApi,
                absensi: []
            };

            selectedJam.forEach(id_jam => {
                santriList.forEach(santri => {
                    payload.absensi.push({
                        id_santri: santri.id_santri,
                        status: absensi[santri.id_santri]?.status || 'Alpa',
                        id_jam_pelajaran: id_jam
                    });
                });
            });

            await apiFetch('/absen-sekolah/save', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showNotification('Absensi berhasil disimpan!', 'success');
            resetState();
        } catch (err) {
            // Notifikasi sudah ditangani
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setView('kelas');
        setSelectedKelas(null);
        setSelectedJam([]);
        setAbsensi({});
        setSantriList([]);
        fetchKelasSekolah();
        fetchSummaries(tanggalForApi);
    };
    
    const goBack = () => {
        if (view === 'absen') setView('jam');
        else if (view === 'jam') {
            setSelectedKelas(null);
            setSelectedJam([]);
            setView('kelas');
        }
    }

    const renderContent = () => {
        if (loading) {
            return <div className="col-span-full text-center py-10"><FiLoader className="animate-spin inline-block mr-2 text-xl" /> Memuat data...</div>;
        }
        
        switch (view) {
            case 'jam':
                return renderJamView();
            case 'absen':
                return renderAbsenView();
            case 'kelas':
            default:
                if (kelasSekolah.length === 0) {
                    return <div className="col-span-full text-center text-gray-500 py-10"><p>Tidak ada kelas sekolah yang tersedia.</p></div>;
                }
                return renderKelasView();
        }
    };

    function renderKelasView() {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kelasSekolah.map(kelas => {
                    const classSummaryData = summaries[kelas.id_kelas_sekolah];
                    return (
                        <div key={kelas.id_kelas_sekolah} onClick={() => handleKelasClick(kelas)} 
                             className="bg-white p-4 rounded-lg shadow-sm flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-3 rounded-full bg-blue-100"><FiHome className="h-6 w-6 text-blue-600" /></div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{kelas.nama_kelas_sekolah}</p>
                                        <p className="text-sm text-gray-500">{kelas.jenis_kelamin}</p>
                                    </div>
                                </div>
                                <div className="border-t pt-2 space-y-1">
                                    {classSummaryData?.summary?.length > 0 ? (
                                        classSummaryData.summary.map(sum => (
                                            <div key={sum.id_jam_pelajaran} className="text-xs text-gray-600">
                                                <span className="font-semibold">{sum.nama_jam}:</span>
                                                <span className="text-green-600"> H:{sum.hadir}</span>,
                                                <span className="text-yellow-600"> S:{sum.sakit}</span>,
                                                <span className="text-blue-600"> I:{sum.izin}</span>,
                                                <span className="text-red-600"> A:{sum.alpa}</span>
                                                <span> / {classSummaryData.totalSantri}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">Belum ada absensi hari ini.</p>
                                    )}
                                </div>
                            </div>
                            <button className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-500 text-white hover:bg-blue-600 mt-2">
                                <FiCheckSquare className="h-4 w-4" />
                                <span>Pilih Kelas</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    }
    
    function renderJamView() {
        const isEditing = jamPelajaran.some(jam => selectedJam.includes(jam.id_jam_pelajaran) && jam.selesai);
        const buttonText = isEditing ? 'Edit Absensi' : 'Mulai Absensi';
        const classSummaryData = summaries[selectedKelas?.id_kelas_sekolah];

        return (
            <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                    {jamPelajaran.map(jam => {
                        const jamSummary = classSummaryData?.summary?.find(s => s.id_jam_pelajaran === jam.id_jam_pelajaran);
                        return (
                            <div key={jam.id_jam_pelajaran} onClick={() => handleJamSelection(jam.id_jam_pelajaran)}
                                 className={`p-4 border rounded-lg flex flex-col justify-between text-center cursor-pointer transition-all duration-200 
                                            ${selectedJam.includes(jam.id_jam_pelajaran) ? 'bg-blue-500 text-white shadow-lg' : 'bg-white hover:bg-blue-50'}`}>
                                <div>
                                    <p className="font-bold text-lg text-gray-800">{jam.nama_jam}</p>
                                    <p className="text-sm text-gray-800">{jam.jam_mulai.slice(0,5)} - {jam.jam_selesai.slice(0,5)}</p>
                                    {jam.selesai && <span className="mt-1 inline-block bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">Selesai</span>}
                                </div>
                                {jamSummary && (
                                <div className="mt-2 pt-2 border-t text-xs text-gray-800">
                                    <p>
                                        <span className="text-green-600">H:{jamSummary.hadir}</span>, 
                                        <span className="text-yellow-600"> S:{jamSummary.sakit}</span>, 
                                        <span className="text-blue-600"> I:{jamSummary.izin}</span>, 
                                        <span className="text-red-600"> A:{jamSummary.alpa}</span>
                                        <span> / {classSummaryData.totalSantri}</span>
                                    </p>
                                    <p className="font-semibold truncate">Oleh: {jamSummary.penginput}</p>
                                </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <button onClick={handleMulaiAbsen} disabled={selectedJam.length === 0 || loading}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-400 transition duration-300 flex items-center justify-center gap-2">
                    <FiUsers className="h-5 w-5" />
                    {loading ? 'Memuat...' : `${buttonText} (${selectedJam.length}) JP`}
                </button>
            </div>
        );
    }

    function renderAbsenView() {
        return (
            <div>
                <div className="flex justify-end mb-4">
                     <button onClick={handleSubmitAbsensi} disabled={loading}
                             className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 transition duration-300 flex items-center gap-2">
                         <FiSave className="h-5 w-5"/>
                         <span>{loading ? 'Menyimpan...' : 'Simpan Absensi'}</span>
                     </button>
                </div>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Santri</th>
                                <th scope="col" className="px-6 py-3 text-center">Status Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {santriList.map(santri => (
                                <tr key={santri.id_santri} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {santri.nama}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap justify-center items-center gap-2">
                                            {['Hadir', 'Izin', 'Sakit', 'Alpa'].map(status => (
                                                <button key={status}
                                                    onClick={() => handleAbsensiChange(santri.id_santri, status)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors 
                                                        ${absensi[santri.id_santri]?.status === status ? 
                                                            (status === 'Hadir' ? 'bg-green-500 text-white' : 
                                                            status === 'Sakit' ? 'bg-yellow-500 text-white' :
                                                            status === 'Izin' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white') : 
                                                            'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <Notification 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification({ message: '', type: '' })} 
            />
            <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                     <h1 className="text-2xl font-bold mb-1 text-gray-800">
                         {view === 'kelas' && 'Pilih Kelas untuk Absensi'}
                         {view === 'jam' && `Pilih Jam Pelajaran - Kelas ${selectedKelas?.nama_kelas_sekolah || ''}`}
                         {view === 'absen' && `Input Absensi - Kelas ${selectedKelas?.nama_kelas_sekolah || ''}`}
                     </h1>
                     <p className="text-gray-600">{currentDate}</p>
                </div>
                {view !== 'kelas' && (
                    <button onClick={goBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center gap-2 transition duration-300">
                        <FiArrowLeft />
                        <span>Kembali</span>
                    </button>
                )}
            </div>

            {renderContent()}
        </div>
    );
};

export default AbsenPage;