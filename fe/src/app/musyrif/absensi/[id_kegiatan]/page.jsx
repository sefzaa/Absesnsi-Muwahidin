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

const getStatusClasses = (status) => {
    switch (status.toLowerCase()) {
        case 'hadir': return 'bg-green-100 text-green-800';
        case 'alpa': return 'bg-red-100 text-red-800';
        case 'izin': return 'bg-yellow-100 text-yellow-800';
        case 'sakit': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function AbsensiDetailPage() { 
    const params = useParams(); 
    const router = useRouter();
    // Path untuk musyrif
    const basePath = '/musyrif/absensi';
    const { id_kegiatan: id_kegiatan_unik } = params;

    const [groupedStudents, setGroupedStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [kegiatanName, setKegiatanName] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const { token } = useAuth();
    
    const [showNotif, setShowNotif] = useState(false);
    const [notifContent, setNotifContent] = useState({ message: '', type: 'success' });
    const [selectedTab, setSelectedTab] = useState(0);

    useEffect(() => {
        if (!id_kegiatan_unik || !token) {
            setIsLoading(false);
            return;
        }

        const nameFromId = id_kegiatan_unik.split('-').slice(3).join(' ').replace(/_/g, ' ');
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
                setTimeout(() => setShowNotif(false), 3000);
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
                router.push(basePath); 
            }, 2000);

        } catch (error) {
            setNotifContent({ message: error.message, type: 'error' });
            setShowNotif(true);
            setTimeout(() => {
                setShowNotif(false);
                setIsSaving(false);
            }, 3000);
        } 
    };

    const TemporaryNotification = () => (
        <Transition show={showNotif} as={Fragment} enter="transition-opacity duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 flex items-center gap-4 shadow-2xl w-full max-w-sm">
                    {notifContent.type === 'success' ? <FiCheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" /> : <FiXCircle className="h-8 w-8 text-red-500 flex-shrink-0" />}
                    <span className="text-base font-medium text-gray-800">{notifContent.message}</span>
                </div>
            </div>
        </Transition>
    );

    const currentRoom = groupedStudents[selectedTab];

    const StatusSelector = ({ student }) => (
        <Listbox value={student.status} onChange={(newStatus) => handleStatusChange(selectedTab, student.id_santri, newStatus)}>
            <div className="relative w-32">
                <Listbox.Button className={`relative w-full cursor-default rounded-full py-2 pl-4 pr-10 text-left text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 transition-shadow shadow-sm hover:shadow-md ${getStatusClasses(student.status)}`}>
                    <span className="block truncate">{student.status}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><FiChevronDown className="h-5 w-5 text-gray-500" aria-hidden="true" /></span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                        {statusOptions.map((status, statusIdx) => (
                            <Listbox.Option key={statusIdx} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-blue-100 text-blue-900' : 'text-gray-900' }`} value={status}>
                                {({ selected }) => (
                                    <>
                                        <span className={`block truncate ${ selected ? 'font-semibold' : 'font-normal' }`}>{status}</span>
                                        {selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"><FiCheck className="h-5 w-5" aria-hidden="true" /></span>) : null}
                                    </>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    );

    return (
        <div className="space-y-6">
            <TemporaryNotification />

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                 <div className="flex-grow">
                    <h2 className="text-xl font-bold text-gray-800 leading-tight">
                        Absensi: {kegiatanName}
                    </h2>
                    <p className="text-sm text-gray-500">{currentDate}</p>
                 </div>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving || isLoading} 
                    className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isSaving ? <FiLoader className="animate-spin h-5 w-5" /> : <FiSave size={18} />}
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
                </button>
            </div>
            
            {isLoading ? (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                    <FiLoader className="animate-spin h-8 w-8 text-blue-500" />
                    <p className="mt-4 text-gray-600">Memuat data santri...</p>
                </div>
            ) : groupedStudents.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    
                    {/* --- [PERBAIKAN] NAVIGASI TAB KELAS YANG LEBIH RESPONSIVE --- */}
                    <div className="border-b border-gray-200">
                        <div className="overflow-x-auto">
                            {/* Perubahan: Jarak dan padding diatur ulang agar lebih kompak di mobile */}
                            <nav className="-mb-px flex" aria-label="Tabs">
                                {groupedStudents.map((kelas, index) => (
                                    <button
                                        key={kelas.id_kelas}
                                        onClick={() => setSelectedTab(index)}
                                        // Perubahan: Padding (px, py) dan ukuran teks (text) dibuat lebih kecil di mobile
                                        // dan akan membesar di layar sm (640px) ke atas.
                                        className={`flex-shrink-0 whitespace-nowrap py-3 px-3 text-xs border-b-2 font-medium 
                                            sm:py-4 sm:px-5 sm:text-sm
                                            transition-colors duration-200 focus:outline-none 
                                            ${ selectedTab === index 
                                                ? 'border-blue-500 text-blue-600' 
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' 
                                            }`}
                                    >
                                        {kelas.nama_kelas}
                                        {/* Perubahan: Badge jumlah santri juga dikecilkan di mobile */}
                                        <span className={`ml-2 text-[10px] font-bold py-0.5 px-2 rounded-full 
                                            sm:text-xs sm:py-1 sm:px-2.5 
                                            ${ selectedTab === index 
                                                ? 'bg-blue-100 text-blue-600' 
                                                : 'bg-gray-100 text-gray-600' 
                                            }`}>
                                            {kelas.santri.length}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        {currentRoom && (
                            <div>
                                <table className="w-full text-sm text-left hidden md:table">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="p-4 font-semibold w-16">No</th>
                                            <th className="p-4 font-semibold">Nama Santri</th>
                                            <th className="p-4 font-semibold">Status Kehadiran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentRoom.santri.map((student, studentIndex) => (
                                            <tr key={student.id_santri} className="hover:bg-gray-50/50">
                                                <td className="p-4 text-gray-600 font-medium">{studentIndex + 1}</td>
                                                <td className="p-4 font-semibold text-gray-800">{student.nama}</td>
                                                <td className="p-4">
                                                    <StatusSelector student={student} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="grid grid-cols-1 gap-4 md:hidden">
                                    {currentRoom.santri.map((student, studentIndex) => (
                                        <div key={student.id_santri} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                            <div className="flex flex-col space-y-3">
                                                <div>
                                                    <p className="font-bold text-gray-800 text-base">{student.nama}</p>
                                                    <p className="text-xs text-gray-500 font-medium">No. {studentIndex + 1}</p>
                                                </div>
                                                <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                                                    <StatusSelector student={student} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500 py-20 bg-gray-50 rounded-lg">
                    <p className="font-semibold">Tidak ada data santri</p>
                    <p className="text-sm mt-1">Tidak ada santri yang terdaftar dalam kegiatan ini.</p>
                </div>
            )}
        </div>
    );
}