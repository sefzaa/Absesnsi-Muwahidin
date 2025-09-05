"use client";

import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiPlus, FiEdit, FiTrash2, FiAward, FiFlag, FiTrendingUp, FiX, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../AuthContext'; // Import useAuth

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const iconMap = {
  FiAward: FiAward,
  FiFlag: FiFlag,
  FiTrendingUp: FiTrendingUp,
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);
    
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(correctedDate);
};

export default function KegiatanTambahanPage() {
    const { token } = useAuth(); // Ambil token dari AuthContext
    const [isLoading, setIsLoading] = useState(true);
    const [kegiatanItems, setKegiatanItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const defaultNewItem = { name: '', date: '' };
    const [currentItem, setCurrentItem] = useState(defaultNewItem);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchKegiatan = async () => {
        if (!token) return; // Jangan fetch jika token belum ada
        setIsLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/kegiatan-tambahan`, {
                headers: { 'x-access-token': token } // Tambahkan header otentikasi
            });
            if (!response.ok) throw new Error('Gagal mengambil data');
            const data = await response.json();
            
            const formattedData = data.map(item => ({
                id: item.id_kegiatan,
                name: item.nama,
                date: item.tanggal ? item.tanggal.split('T')[0] : '',
                // Salin properti lain jika ada
                icon: item.icon,
                iconBg: item.iconBg,
                iconColor: item.iconColor
            }));
            setKegiatanItems(formattedData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKegiatan();
    }, [token]); // Tambahkan token sebagai dependency

    const openModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setCurrentItem({ ...item });
        } else {
            setIsEditing(false);
            setCurrentItem(defaultNewItem);
        }
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    const openDeleteModal = (item) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };
    const closeDeleteModal = () => {
        setItemToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: currentItem.name,
            date: currentItem.date,
        };

        const url = isEditing 
            ? `${backendUrl}/api/kegiatan-tambahan/${currentItem.id}`
            : `${backendUrl}/api/kegiatan-tambahan/create`;
        
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'x-access-token': token // Sertakan token
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`Gagal ${isEditing ? 'memperbarui' : 'menambah'} data`);
            
            fetchKegiatan(); // Refresh data dari server
        } catch (error) {
            console.error(`Error submitting form:`, error);
        } finally {
            closeModal();
        }
    };

    const handleDeleteItem = async () => {
        if (itemToDelete) {
            try {
                const response = await fetch(`${backendUrl}/api/kegiatan-tambahan/${itemToDelete.id}`, {
                    method: 'DELETE',
                    headers: { 'x-access-token': token } // Sertakan token
                });
                if (!response.ok) throw new Error('Gagal menghapus data');
                
                setKegiatanItems(kegiatanItems.filter(item => item.id !== itemToDelete.id));
            } catch (error) {
                console.error("Error deleting item:", error);
            } finally {
                closeDeleteModal();
            }
        }
    };

    return (
        <div>
            <div className="flex justify-start mb-6">
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FiPlus size={20} />
                    <span>Kegiatan</span>
                </button>
            </div>
            
            {isLoading ? (
                <div className="text-center p-10"><FiLoader className="animate-spin inline-block mr-2" /> Memuat data kegiatan...</div>
            ) : kegiatanItems.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500">Belum ada kegiatan tambahan yang dijadwalkan.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {kegiatanItems.map((kegiatan) => {
                        const IconComponent = iconMap[kegiatan.icon] || FiAward;
                        return (
                            <div key={kegiatan.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${kegiatan.iconBg || 'bg-gray-100'}`}>
                                        <IconComponent className={`h-6 w-6 ${kegiatan.iconColor || 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{kegiatan.name}</p>
                                        <p className="text-sm text-gray-500">{formatDate(kegiatan.date)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-end sm:self-center">
                                    <button onClick={() => openModal(kegiatan)} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-white text-sm rounded-md hover:bg-yellow-500 transition-colors">
                                        <FiEdit size={14} />
                                        <span>Edit</span>
                                    </button>
                                    <button onClick={() => openDeleteModal(kegiatan)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors">
                                        <FiTrash2 size={14} />
                                        <span>Hapus</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Tambah/Edit */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                                    <div className="flex items-start justify-between p-5 border-b rounded-t">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${isEditing ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                                {isEditing ? (<FiEdit className="h-6 w-6 text-yellow-500" aria-hidden="true" />) : (<FiPlus className="h-6 w-6 text-blue-600" aria-hidden="true" />)}
                                            </div>
                                            <div>
                                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">{isEditing ? 'Edit Kegiatan Tambahan' : 'Tambah Kegiatan Tambahan'}</Dialog.Title>
                                                <p className="text-sm text-gray-500 mt-1">Lengkapi detail kegiatan di bawah ini.</p>
                                            </div>
                                        </div>
                                        <button type="button" className="p-1.5 text-gray-400 bg-transparent rounded-lg hover:bg-gray-200 hover:text-gray-900" onClick={closeModal}>
                                            <FiX className="h-5 w-5" />
                                            <span className="sr-only">Close modal</span>
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        {currentItem && (
                                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                                <div>
                                                    <label htmlFor="kegiatanName" className="block text-sm font-medium text-gray-700">Nama Kegiatan</label>
                                                    <input type="text" id="kegiatanName" name="kegiatanName" value={currentItem.name} onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" placeholder="Contoh: Lomba Cerdas Cermat" required />
                                                </div>
                                                <div>
                                                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tanggal</label>
                                                    <input type="date" id="date" name="date" value={currentItem.date} onChange={(e) => setCurrentItem({ ...currentItem, date: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" required />
                                                </div>
                                                <div className="pt-4 mt-5 sm:mt-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                                                    <button type="submit" className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:ml-3 sm:w-auto">
                                                        {isEditing ? 'Simpan Perubahan' : 'Simpan'}
                                                    </button>
                                                    <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={closeModal}>
                                                        Batal
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            
            {/* Modal Hapus */}
            <Transition appear show={isDeleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeDeleteModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">Hapus Kegiatan</Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">Apakah Anda yakin ingin menghapus kegiatan "{itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        <button type="button" className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 sm:ml-3 sm:w-auto" onClick={handleDeleteItem}>Hapus</button>
                                        <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={closeDeleteModal}>Batal</button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}