"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useAuth } from '../../AuthContext';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { 
    FiPlusSquare, FiEdit, FiTrash2, FiUsers, FiX,
    FiLoader, FiAlertCircle, FiCheckCircle, FiShuffle, FiChevronDown, FiUser 
} from 'react-icons/fi';

// =================================================================
// BAGIAN 1: KOMPONEN UI LENGKAP (STYLING DIPERCANTIK TANPA UBAH STRUKTUR)
// =================================================================

const Modal = ({ isOpen, onClose, title, icon, children, maxWidth = 'max-w-md' }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-6 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            {/* Penting: hilangkan overflow-hidden agar dropdown Combobox tidak terpotong */}
                            <Dialog.Panel className={`w-full ${maxWidth} transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all border border-gray-200`}> 
                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 flex items-center gap-2 border-b pb-3">
                                    {icon && <span className="text-blue-500">{icon}</span>}
                                    {title}
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none">
                                    <FiX size={24} />
                                </button>
                                <div className="mt-4">
                                    {children}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

const NotificationModal = ({ notification, onClose }) => {
    if (!notification.isOpen) return null;
    const icons = {
        success: <FiCheckCircle className="text-green-500" size={56} />,
        error: <FiAlertCircle className="text-red-500" size={56} />,
        loading: <FiLoader className="animate-spin text-blue-500" size={56} />,
    };
    return (
        <Transition appear show={notification.isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={notification.type !== 'loading' ? onClose : () => {}}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-6 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-sm transform overflow-visible rounded-2xl bg-white p-8 text-center align-middle shadow-2xl border border-gray-200">
                                <div className="flex justify-center">{icons[notification.type]}</div>
                                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mt-5">{notification.title}</Dialog.Title>
                                <div className="mt-2"><p className="text-sm text-gray-600">{notification.message}</p></div>
                                {notification.type !== 'loading' && (
                                    <div className="mt-6">
                                        <button type="button" className="inline-flex justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none" onClick={onClose}>
                                            OK
                                        </button>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};


// =================================================================
// BAGIAN 2: KOMPONEN UTAMA HALAMAN (LOGIKA TETAP, HANYA STYLING DIPERINDAH)
// =================================================================

export default function KelasSekolahPage() {
    const { token } = useAuth();
    const [kelasSekolahList, setKelasSekolahList] = useState([]);
    const [tingkatanList, setTingkatanList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [formData, setFormData] = useState({ nama_kelas_sekolah: '', id_kelas: '', kapasitas: 30, jenis_kelamin: 'Putra' });
    const [notification, setNotification] = useState({ isOpen: false, type: '', title: '', message: '' });
    
    const [studentsInClass, setStudentsInClass] = useState([]);
    const [unassignedStudents, setUnassignedStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSantri, setSelectedSantri] = useState(null);

    const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

    const showNotification = useCallback((type, title, message) => {
        setNotification({ isOpen: true, type, title, message });
    }, []);

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
            const [kelasData, tingkatanData] = await Promise.all([
                apiFetch('/kelas-sekolah/'),
                apiFetch('/kelas-sekolah/tingkatan/all')
            ]);
            setKelasSekolahList(kelasData);
            setTingkatanList(tingkatanData);
        } catch (error) {
            showNotification("error", "Gagal Memuat Data", error.message);
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, showNotification]);

    const closeNotification = useCallback(() => {
        setNotification(prev => ({ ...prev, isOpen: false }));
        if (notification.type === 'success') {
            fetchData();
        }
    }, [notification.type, fetchData]);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token, fetchData]);

    const closeModal = () => {
        setModalState({ type: null, data: null });
        setSearchQuery('');
        setSelectedSantri(null);
    };
    
    const openModal = async (type, data = null) => {
        setModalState({ type, data });
        if (type === 'add') {
            setFormData({ nama_kelas_sekolah: '', id_kelas: '', kapasitas: 30, jenis_kelamin: 'Putra' });
        } else if (type === 'edit' && data) {
            setFormData({ nama_kelas_sekolah: data.nama_kelas_sekolah, id_kelas: data.id_kelas, kapasitas: data.kapasitas, jenis_kelamin: data.jenis_kelamin });
        } else if (type === 'viewStudents' && data) {
            setIsLoading(true);
            try {
                const [studentsData, unassignedData] = await Promise.all([
                    apiFetch(`/kelas-sekolah/${data.id_kelas_sekolah}/students`),
                    apiFetch(`/kelas-sekolah/unassigned/students?jenis_kelamin=${data.jenis_kelamin}&id_kelas=${data.id_kelas}`)
                ]);
                setStudentsInClass(studentsData);
                setUnassignedStudents(unassignedData);
            } catch (error) {
                showNotification('error', 'Gagal Memuat Data Santri', error.message);
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const handleFormChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        showNotification('loading', 'Menyimpan Data', 'Harap tunggu sebentar...');
        try {
            if (modalState.type === 'add') {
                await apiFetch('/kelas-sekolah/', { method: 'POST', body: JSON.stringify(formData) });
            } else if (modalState.type === 'edit') {
                await apiFetch(`/kelas-sekolah/${modalState.data.id_kelas_sekolah}`, { method: 'PUT', body: JSON.stringify(formData) });
            }
            closeModal();
            showNotification('success', 'Berhasil', 'Data kelas telah berhasil disimpan.');
        } catch (error) {
            showNotification('error', 'Gagal Menyimpan', error.message);
        }
    };

    const handleDelete = async (id_kelas_sekolah) => {
        showNotification('loading', 'Menghapus Data', 'Harap tunggu sebentar...');
        try {
            await apiFetch(`/kelas-sekolah/${id_kelas_sekolah}`, { method: 'DELETE' });
            closeModal();
            showNotification('success', 'Berhasil Dihapus', 'Data kelas telah berhasil dihapus.');
        } catch (error) {
            showNotification('error', 'Gagal Menghapus', error.message);
        }
    };

    const handleRandomize = async () => {
        showNotification('loading', 'Mengacak Santri', 'Proses ini mungkin memakan beberapa saat...');
        try {
            const result = await apiFetch('/kelas-sekolah/randomize', { method: 'POST' });
            showNotification('success', 'Berhasil', result.message);
        } catch (error) {
            showNotification('error', 'Gagal Mengacak', error.message);
        }
    };
    
    const handleAddStudent = async () => {
        if (!selectedSantri) {
            showNotification('error', 'Gagal', 'Silakan pilih santri terlebih dahulu.');
            return;
        }
        try {
            await apiFetch('/kelas-sekolah/assign-student', { 
                method: 'POST', 
                body: JSON.stringify({ id_santri: selectedSantri.id_santri, id_kelas_sekolah: modalState.data.id_kelas_sekolah }) 
            });
            await openModal('viewStudents', modalState.data); 
            setSelectedSantri(null);
            setSearchQuery('');
        } catch (error) {
            showNotification('error', 'Gagal Menambahkan', error.message);
        }
    };

    const handleRemoveStudent = async (id_santri) => {
        try {
            await apiFetch('/kelas-sekolah/remove-student', { 
                method: 'POST', 
                body: JSON.stringify({ id_santri }) 
            });
            await openModal('viewStudents', modalState.data);
        } catch (error) {
            showNotification('error', 'Gagal Mengeluarkan', error.message);
        }
    };

    const filteredUnassignedStudents = useMemo(() => 
        searchQuery === ''
            ? unassignedStudents
            : unassignedStudents.filter(s => s.nama.toLowerCase().includes(searchQuery.toLowerCase())),
    [unassignedStudents, searchQuery]);
    
    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-pink-50 p-6 rounded-2xl shadow-lg border border-gray-200">
            <NotificationModal notification={notification} onClose={closeNotification} />

            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Manajemen Kelas Sekolah</h2>
                <div className="flex gap-3">
                    <button onClick={() => openModal('add')} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow hover:shadow-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                        <FiPlusSquare /> <span>Tambah Kelas</span>
                    </button>
                    <button onClick={handleRandomize} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-xl shadow hover:shadow-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all">
                        <FiShuffle /> <span>Acak Santri</span>
                    </button>
                </div>
            </div>
            
            {isLoading ? (
                <div className="text-center py-12 text-lg text-gray-600"><FiLoader className="animate-spin inline-block mr-2" /> Memuat data...</div>
            ) : kelasSekolahList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {kelasSekolahList.map((kelas) => (
                        <div key={kelas.id_kelas_sekolah} className="bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
                            <div className={`p-5 border-b-4 ${kelas.jenis_kelamin === 'Putra' ? 'border-blue-500' : 'border-pink-500'}`}>
                                <h3 className="font-extrabold text-gray-900 text-lg truncate" title={kelas.nama_kelas_sekolah}>{kelas.nama_kelas_sekolah}</h3>
                                <p className="text-sm text-gray-500">{kelas.tingkatan.nama_kelas}</p>
                            </div>
                            <div className="p-5 flex-grow space-y-4">
                                <div className="flex items-center text-sm">
                                    <FiUser className="mr-3 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-600">Kelas</span>
                                    <span className={`ml-auto font-semibold ${kelas.jenis_kelamin === 'Putra' ? 'text-blue-600' : 'text-pink-600'}`}>{kelas.jenis_kelamin}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <FiUsers className="mr-3 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-600">Kapasitas</span>
                                    <div className="ml-auto flex items-end gap-1">
                                        <span className="font-bold text-2xl text-gray-800">{kelas.jumlah_santri}</span>
                                        <span className="text-gray-500 text-sm"> / {kelas.kapasitas}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-auto p-3 bg-gray-50 border-t flex justify-end gap-2">
                                <button onClick={(e) => { e.stopPropagation(); openModal('viewStudents', kelas); }} className="text-blue-600 hover:text-blue-800 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                    LIHAT SANTRI
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); openModal('delete', kelas); }} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors" title="Hapus Kelas">
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 space-y-1">
                    <p className="text-base">Belum ada kelas yang dibuat.</p>
                    <p className="text-sm">Silakan klik tombol <span className="font-semibold">Tambah Kelas</span> untuk memulai.</p>
                </div>
            )}

            {/* Modal Tambah Kelas */}
            <Modal isOpen={modalState.type === 'add'} onClose={closeModal} title="Tambah Kelas Baru" icon={<FiPlusSquare size={20} className="text-blue-500" />}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas (Contoh: 10 IPA 1)</label>
                        <input type="text" name="nama_kelas_sekolah" value={formData.nama_kelas_sekolah} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tingkatan</label>
                        <select name="id_kelas" value={formData.id_kelas} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900">
                            <option value="">Pilih Tingkatan</option>
                            {tingkatanList.map(t => <option key={t.id_kelas} value={t.id_kelas}>{t.nama_kelas}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
                            <input type="number" name="kapasitas" value={formData.kapasitas} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                            <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900">
                                <option value="Putra">Putra</option>
                                <option value="Putri">Putri</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg shadow-sm font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors">Batal</button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Simpan</button>
                    </div>
                </form>
            </Modal>
            
            {/* Modal Hapus */}
            <Modal isOpen={modalState.type === 'delete'} onClose={closeModal} title="Konfirmasi Hapus" icon={<FiAlertCircle className="text-red-500" />}>
                <p className="text-sm text-gray-600">Anda yakin ingin menghapus kelas <strong>{modalState.data?.nama_kelas_sekolah}</strong>? Semua santri di dalamnya akan kehilangan kelas.</p>
                <div className="pt-5 flex justify-end gap-3">
                    <button type="button" onClick={closeModal} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg shadow-sm font-semibold hover:bg-gray-200 focus:outline-none">Batal</button>
                    <button type="button" onClick={() => handleDelete(modalState.data.id_kelas_sekolah)} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm font-semibold hover:bg-red-700 focus:outline-none">Ya, Hapus</button>
                </div>
            </Modal>

            {/* Modal Lihat Santri */}
            <Modal isOpen={modalState.type === 'viewStudents'} onClose={closeModal} title={`Daftar Santri: ${modalState.data?.nama_kelas_sekolah}`} maxWidth="max-w-4xl">
                <div className="max-h-[70vh] flex flex-col">
                    <div className="flex-grow overflow-y-auto rounded-lg border border-gray-200 shadow-inner">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="sticky top-0 bg-gray-100">
                                <tr>
                                    <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 w-12">No.</th>
                                    <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">Nama Santri</th>
                                    <th className="py-3 px-4 text-center text-sm font-bold text-gray-700 w-20">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {studentsInClass.length > 0 ? studentsInClass.map((santri, index) => (
                                    <tr key={santri.id_santri} className="hover:bg-blue-50/50">
                                        <td className="py-2 px-4 text-sm text-gray-500">{index + 1}</td>
                                        <td className="py-2 px-4 text-sm text-gray-800 font-medium">{santri.nama}</td>
                                        <td className="py-2 px-4 text-center">
                                            <button onClick={() => handleRemoveStudent(santri.id_santri)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100"><FiTrash2 size={16} /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="text-center text-gray-500 py-8">Belum ada santri di kelas ini.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-3 text-gray-800">Tambah Santri Manual</h4>
                        <div className="flex gap-3">
                             <Combobox value={selectedSantri} onChange={setSelectedSantri} as="div" className="relative flex-grow">
                                <div className="relative">
                                    <Combobox.Input className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" onChange={(event) => setSearchQuery(event.target.value)} displayValue={(santri) => santri ? santri.nama : ''} placeholder="Ketik untuk mencari santri..."/>
                                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3"><FiChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" /></Combobox.Button>
                                </div>
                                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    {/* z-50 + overflow-visible pada Dialog.Panel mencegah terpotong */}
                                    <Combobox.Options className="absolute mt-2 max-h-80 w-full overflow-auto rounded-lg bg-white py-2 text-base shadow-2xl ring-1 ring-black/10 focus:outline-none sm:text-sm z-[60]">
                                        {filteredUnassignedStudents.length === 0 && searchQuery !== '' ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-500">Santri tidak ditemukan.</div>
                                        ) : (
                                            filteredUnassignedStudents.map((santri) => (
                                                <Combobox.Option key={santri.id_santri} value={santri} className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>
                                                    {({ selected, active }) => (<><span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{santri.nama}</span>{selected ? <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'}`}><FiCheckCircle className="h-5 w-5" aria-hidden="true" /></span> : null}</>)}
                                                </Combobox.Option>
                                            ))
                                        )}
                                    </Combobox.Options>
                                </Transition>
                            </Combobox>
                            <button onClick={handleAddStudent} className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 text-white rounded-lg shadow font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors" disabled={!selectedSantri}>
                                Tambah
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
