// file: src/app/wali-kamar/absensi/[id_kegiatan]/page.jsx
"use client";

import { useState, useEffect, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Listbox, Transition } from '@headlessui/react';
import { FiSave, FiChevronDown, FiCheck, FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import moment from 'moment-timezone';
import 'moment/locale/id';
import { useAuth } from '../../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const statusOptions = ['Hadir', 'Alpa', 'Izin', 'Sakit'];

// Helper function untuk styling status
const getStatusClasses = (status) => {
    switch (status.toLowerCase()) {
        case 'hadir': return 'bg-green-100 text-green-700';
        case 'alpa': return 'bg-red-100 text-red-700';
        case 'izin': return 'bg-yellow-100 text-yellow-700';
        case 'sakit': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export default function AbsensiDetailPage() { 
    const params = useParams(); 
    const router = useRouter();
    const { id_kegiatan: id_kegiatan_unik } = params;

    // State untuk data utama (dikelompokkan)
    const [groupedStudents, setGroupedStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [kegiatanName, setKegiatanName] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const { token } = useAuth();
    
    // State untuk notifikasi modal sementara
    const [showNotif, setShowNotif] = useState(false);
    const [notifContent, setNotifContent] = useState({ message: '', type: 'success' });

    // State baru untuk melacak tab kamar yang aktif
    const [selectedTab, setSelectedTab] = useState(0);

    useEffect(() => {
        if (!id_kegiatan_unik || !token) {
            setIsLoading(false);
            return;
        }

        const nameFromId = id_kegiatan_unik.split('-').slice(2).join(' ').replace(/_/g, ' ');
        setKegiatanName(nameFromId.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()));
        setCurrentDate(moment().tz('Asia/Jakarta').locale('id').format('dddd, DD MMMM YYYY'));

        const fetchSantri = async () => {
             setIsLoading(true);
            try {
                const response = await fetch(`${backendUrl}/api/absensi/detail/${id_kegiatan_unik}/santri`, {
                    headers: { 'x-access-token': token }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Gagal memuat daftar santri');
                }
                const data = await response.json();
                setGroupedStudents(data);
            } catch (error) {
                console.error(error);
                setNotifContent({ message: error.message, type: 'error' });
                setShowNotif(true);
                setTimeout(() => setShowNotif(false), 2000);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSantri();
    }, [id_kegiatan_unik, token]);

    const handleStatusChange = (roomIndex, studentId, newStatus) => {
        setGroupedStudents(currentGroups => {
            const newGroups = JSON.parse(JSON.stringify(currentGroups));
            const room = newGroups[roomIndex];
            const studentIndex = room.santri.findIndex(s => s.id_santri === studentId);
            
            if (studentIndex > -1) {
                room.santri[studentIndex].status = newStatus;
            }
            return newGroups;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const payload = groupedStudents.flatMap(group => group.santri.map(s => ({ id_santri: s.id_santri, status: s.status })));
        
        try {
            const response = await fetch(`${backendUrl}/api/absensi/detail/${id_kegiatan_unik}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal menyimpan absensi');
            }
            
            setNotifContent({ message: 'Absensi berhasil disimpan!', type: 'success' });
            setShowNotif(true);

            setTimeout(() => {
                router.push('/wali-kamar/absensi');
            }, 2000);

        } catch (error) {
            setNotifContent({ message: error.message, type: 'error' });
            setShowNotif(true);
            setTimeout(() => {
                setShowNotif(false);
                setIsSaving(false);
            }, 2000);
        } 
    };

    const TemporaryNotification = () => (
        <Transition
            show={showNotif}
            as={Fragment}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 flex items-center gap-4 shadow-xl">
                    {notifContent.type === 'success' ? (
                        <FiCheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                        <FiXCircle className="h-8 w-8 text-red-500" />
                    )}
                    <span className="text-lg font-medium text-gray-800">{notifContent.message}</span>
                </div>
            </div>
        </Transition>
    );

    const currentRoom = groupedStudents[selectedTab];

    return (
        <div className="space-y-6">
            <TemporaryNotification />

            <div className="flex justify-between items-center">
                 <h2 className="text-lg font-semibold text-gray-700">
                    Kegiatan - <span className="text-gray-900 font-bold">{currentDate}</span> &gt; <span className="text-gray-900 font-bold">{kegiatanName}</span>
                </h2>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving || isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? <FiLoader className="animate-spin" /> : <FiSave size={18} />}
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
            </div>
            
            {isLoading ? (
                <div className="text-center py-10"><FiLoader className="animate-spin inline-block mr-2" /> Memuat data...</div>
            ) : groupedStudents.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border">
                    {/* --- KONTENER TAB BARU --- */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                            {groupedStudents.map((room, index) => (
                                <button
                                    key={room.id_kamar}
                                    onClick={() => setSelectedTab(index)}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        selectedTab === index
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {room.nomor_kamar}
                                    <span className={`ml-2 text-xs font-semibold py-0.5 px-2 rounded-full ${
                                        selectedTab === index
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {room.santri.length}
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>
                    {/* --- AKHIR KONTENER TAB --- */}

                    {/* --- KONTEN TAB (TABEL) --- */}
                    <div className="p-6">
                        {currentRoom && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50/50 text-gray-500">
                                        <tr>
                                            <th className="p-4 font-medium w-16">NO</th>
                                            <th className="p-4 font-medium">NAMA</th>
                                            <th className="p-4 font-medium">STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {currentRoom.santri.map((student, studentIndex) => (
                                            <tr key={student.id_santri} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-600">{studentIndex + 1}</td>
                                                <td className="p-4 font-semibold text-gray-800">{student.nama}</td>
                                                <td className="p-4">
                                                    <Listbox value={student.status} onChange={(newStatus) => handleStatusChange(selectedTab, student.id_santri, newStatus)}>
                                                        <div className="relative w-32">
                                                            <Listbox.Button className={`relative w-full cursor-default rounded-full py-1.5 pl-3 pr-10 text-left text-xs font-medium focus:outline-none ${getStatusClasses(student.status)}`}>
                                                                <span className="block truncate">{student.status}</span>
                                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                                    <FiChevronDown className="h-4 w-4" aria-hidden="true" />
                                                                </span>
                                                            </Listbox.Button>
                                                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                                                                    {statusOptions.map((status, statusIdx) => (
                                                                        <Listbox.Option key={statusIdx} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900' }`} value={status}>
                                                                            {({ selected }) => (
                                                                                <>
                                                                                    <span className={`block truncate ${ selected ? 'font-medium' : 'font-normal' }`}>{status}</span>
                                                                                    {selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600"><FiCheck className="h-5 w-5" aria-hidden="true" /></span>) : null}
                                                                                </>
                                                                            )}
                                                                        </Listbox.Option>
                                                                    ))}
                                                                </Listbox.Options>
                                                            </Transition>
                                                        </div>
                                                    </Listbox>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500 py-10">Tidak ada santri yang diasuh.</div>
            )}
        </div>
    );
}
