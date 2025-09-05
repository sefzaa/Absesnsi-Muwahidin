"use client";

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../../AuthContext'; // Sesuaikan path ini jika direktori Anda berbeda
import { Dialog, Transition } from '@headlessui/react';
import { 
    FiPlusSquare, FiEdit, FiTrash2, FiClock, FiX,
    FiLoader, FiAlertCircle, FiCheckCircle 
} from 'react-icons/fi';

// =================================================================
// BAGIAN 1: KOMPONEN UI
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
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={`w-full ${maxWidth} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}>
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                                    {icon && <span className="mr-3">{icon}</span>}
                                    {title}
                                </Dialog.Title>
                                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none">
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
        success: <FiCheckCircle className="text-green-500" size={48} />,
        error: <FiAlertCircle className="text-red-500" size={48} />,
        loading: <FiLoader className="animate-spin text-blue-500" size={48} />,
    };

    return (
        <Transition appear show={notification.isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={notification.type !== 'loading' ? onClose : () => {}}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-8 text-center align-middle shadow-xl transition-all">
                                <div className="flex justify-center">{icons[notification.type]}</div>
                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 mt-5">{notification.title}</Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">{notification.message}</p>
                                </div>
                                {notification.type !== 'loading' && (
                                    <div className="mt-6">
                                        <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none" onClick={onClose}>
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
// BAGIAN 2: KOMPONEN UTAMA HALAMAN
// =================================================================

export default function JamPelajaranPage() {
    const { token } = useAuth();
    const [jamPelajaranList, setJamPelajaranList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [formData, setFormData] = useState({ nama_jam: '', jam_mulai: '', jam_selesai: '' });
    const [notification, setNotification] = useState({ isOpen: false, type: '', title: '', message: '' });

    const showNotification = useCallback((type, title, message) => {
        setNotification({ isOpen: true, type, title, message });
    }, []);
    
    const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/jam-pelajaran`;
    
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
            const data = await apiFetch('/');
            setJamPelajaranList(data);
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

    useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

    const closeModal = () => setModalState({ type: null, data: null });
    
    const openModal = (type, data = null) => {
        setModalState({ type, data });
        if (type === 'add') {
            setFormData({ nama_jam: '', jam_mulai: '', jam_selesai: '' });
        } else if (type === 'edit' && data) {
            setFormData({ nama_jam: data.nama_jam, jam_mulai: data.jam_mulai, jam_selesai: data.jam_selesai });
        }
    };

    const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        showNotification('loading', 'Menyimpan Data', 'Harap tunggu sebentar...');
        try {
            if (modalState.type === 'add') {
                await apiFetch('/', { method: 'POST', body: JSON.stringify(formData) });
            } else {
                await apiFetch(`/${modalState.data.id_jam_pelajaran}`, { method: 'PUT', body: JSON.stringify(formData) });
            }
            closeModal();
            showNotification('success', 'Berhasil', 'Jam pelajaran telah berhasil disimpan.');
        } catch (error) {
            showNotification('error', 'Gagal Menyimpan', error.message);
        }
    };

    const handleDelete = async () => {
        showNotification('loading', 'Menghapus Data', 'Harap tunggu sebentar...');
        try {
            await apiFetch(`/${modalState.data.id_jam_pelajaran}`, { method: 'DELETE' });
            closeModal();
            showNotification('success', 'Berhasil Dihapus', 'Jam pelajaran telah berhasil dihapus.');
        } catch (error) {
            showNotification('error', 'Gagal Menghapus', error.message);
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <NotificationModal notification={notification} onClose={closeNotification} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Pengaturan Jam Pelajaran</h2>
                <button onClick={() => openModal('add')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    <FiPlusSquare /> <span>Tambah Jam</span>
                </button>
            </div>
            
            {/* --- PERBAIKAN RESPONSIVE DIMULAI DI SINI --- */}

            {/* Tampilan Tabel untuk Desktop (md dan lebih besar) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Sesi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Mulai</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Selesai</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan="4" className="text-center py-10"><FiLoader className="animate-spin inline-block mr-2" /> Memuat data...</td></tr>
                        ) : jamPelajaranList.length > 0 ? (
                            jamPelajaranList.map((item) => (
                                <tr key={item.id_jam_pelajaran} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama_jam}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam_mulai.substring(0, 5)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam_selesai.substring(0, 5)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <button onClick={() => openModal('edit', item)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit"><FiEdit size={18} /></button>
                                            <button onClick={() => openModal('delete', item)} className="text-red-600 hover:text-red-800 transition-colors" title="Hapus"><FiTrash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className="text-center py-10 text-gray-500"><p>Belum ada data jam pelajaran.</p><p className="text-sm">Silakan klik tombol "Tambah Jam" untuk memulai.</p></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Tampilan Kartu untuk Mobile (di bawah md) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {isLoading ? (
                    <div className="text-center py-10"><FiLoader className="animate-spin inline-block mr-2" /> Memuat data...</div>
                ) : jamPelajaranList.length > 0 ? (
                    jamPelajaranList.map((item) => (
                        <div key={item.id_jam_pelajaran} className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-3">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-gray-900 text-lg">{item.nama_jam}</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openModal('edit', item)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit"><FiEdit size={18} /></button>
                                    <button onClick={() => openModal('delete', item)} className="text-red-600 hover:text-red-800 p-1" title="Hapus"><FiTrash2 size={18} /></button>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-3 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Mulai:</span>
                                    <span className="font-medium text-gray-800">{item.jam_mulai.substring(0, 5)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Selesai:</span>
                                    <span className="font-medium text-gray-800">{item.jam_selesai.substring(0, 5)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500"><p>Belum ada data jam pelajaran.</p><p className="text-sm">Silakan klik tombol "Tambah Jam" untuk memulai.</p></div>
                )}
            </div>

            {/* --- AKHIR PERBAIKAN RESPONSIVE --- */}

            <Modal isOpen={modalState.type === 'add' || modalState.type === 'edit'} onClose={closeModal} title={modalState.type === 'add' ? 'Tambah Jam Pelajaran' : 'Edit Jam Pelajaran'} icon={<FiClock size={20} className="text-blue-500" />} maxWidth="max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sesi (Contoh: Jam ke-1)</label>
                        <input type="text" name="nama_jam" value={formData.nama_jam} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
                        <input type="time" name="jam_mulai" value={formData.jam_mulai} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
                        <input type="time" name="jam_selesai" value={formData.jam_selesai} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">Batal</button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Simpan</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={modalState.type === 'delete'} onClose={closeModal} title="Konfirmasi Hapus" icon={<FiAlertCircle className="text-red-500" />}>
                <p className="text-sm text-gray-600">Anda yakin ingin menghapus <strong>{modalState.data?.nama_jam}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="pt-5 flex justify-end gap-3">
                    <button type="button" onClick={closeModal} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">Batal</button>
                    <button type="button" onClick={handleDelete} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md shadow-sm font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">Ya, Hapus</button>
                </div>
            </Modal>
        </div>
    );
}