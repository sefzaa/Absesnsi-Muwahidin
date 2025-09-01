"use client";

import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiPlus, FiEdit, FiTrash2, FiSun, FiClipboard, FiX, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const iconMap = { FiSun: FiSun, FiClipboard: FiClipboard };
const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const formatSchedule = (kegiatan) => {
    if (!kegiatan.repetitionType) return kegiatan.schedule;
    switch (kegiatan.repetitionType) {
        case 'harian': return kegiatan.time ? `Setiap Hari, Pukul ${kegiatan.time.substring(0, 5)}` : 'Setiap Hari';
        case 'mingguan':
            if (kegiatan.days && kegiatan.days.length > 0) {
                const sortedDays = daysOfWeek.filter(day => kegiatan.days.includes(day));
                return `Setiap Minggu: ${sortedDays.join(', ')}`;
            }
            return 'Setiap Minggu';
        case 'bulanan':
            if (kegiatan.dates && kegiatan.dates.length > 0) {
                const sortedDates = [...kegiatan.dates].sort((a, b) => a - b);
                return `Setiap Bulan: Tgl ${sortedDates.join(', ')}`;
            }
            return 'Setiap Bulan';
        default: return 'Jadwal tidak ditentukan';
    }
};

const ScheduleForm = ({ initialItem, onSubmit, onClose }) => {
    const [item, setItem] = useState(initialItem);
    const [dateInput, setDateInput] = useState(initialItem.dates ? initialItem.dates.join(', ') : '');

    useEffect(() => {
        setItem(initialItem);
        setDateInput(initialItem.dates ? initialItem.dates.join(', ') : '');
    }, [initialItem]);

    const handleRepetitionChange = (e) => {
        const { value } = e.target;
        setItem(prev => ({ ...prev, repetitionType: value, days: [], dates: [], time: '' }));
        if (value !== 'bulanan') { setDateInput(''); }
    };

    const handleDayChange = (day) => {
        const newDays = item.days.includes(day) ? item.days.filter(d => d !== day) : [...item.days, day];
        setItem({ ...item, days: newDays });
    };

    const handleDateInputChange = (e) => {
        const sanitizedValue = e.target.value.replace(/[^0-9,\s]/g, '');
        setDateInput(sanitizedValue);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalDates = dateInput.split(',').map(d => parseInt(d.trim(), 10)).filter(num => !isNaN(num) && num > 0 && num <= 31);
        const finalItem = { ...item, dates: [...new Set(finalDates)] };
        onSubmit(finalItem);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="kegiatanName" className="block text-sm font-medium text-gray-700">Nama Kegiatan</label>
                <input type="text" id="kegiatanName" name="kegiatanName" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" placeholder="Contoh: Pengajian Kitab" required />
            </div>
            <div>
                <label htmlFor="repetitionType" className="block text-sm font-medium text-gray-700">Ulangi</label>
                <select id="repetitionType" value={item.repetitionType} onChange={handleRepetitionChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900">
                    <option value="harian">Setiap Hari</option>
                    <option value="mingguan">Setiap Minggu</option>
                    <option value="bulanan">Setiap Bulan</option>
                </select>
            </div>
            {item.repetitionType === 'harian' && (
                <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700">Pukul</label>
                    <input type="time" id="time" value={item.time || ''} onChange={(e) => setItem({ ...item, time: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" required/>
                </div>
            )}
            {item.repetitionType === 'mingguan' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Pilih Hari</label>
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {daysOfWeek.map(day => (
                            <label key={day} className="flex items-center space-x-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={item.days.includes(day)} onChange={() => handleDayChange(day)} className="rounded text-blue-600 focus:ring-blue-500" />
                                <span className="text-gray-900">{day}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            {item.repetitionType === 'bulanan' && (
                <div>
                    <label htmlFor="dates" className="block text-sm font-medium text-gray-700">Pilih Tanggal</label>
                    <input type="text" id="dates" value={dateInput} onChange={handleDateInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" placeholder="Contoh: 1, 15, 25" />
                    <p className="text-xs text-gray-500 mt-1">Pisahkan tanggal dengan koma.</p>
                </div>
            )}
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button type="submit" className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:ml-3 sm:w-auto">
                    {item.id ? 'Simpan Perubahan' : 'Simpan'}
                </button>
                <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={onClose}>
                    Batal
                </button>
            </div>
        </form>
    );
};

export default function KegiatanRutinPage() {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [kegiatanItems, setKegiatanItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const defaultNewItem = { name: '', repetitionType: 'harian', time: '', days: [], dates: [] };
    const [currentItem, setCurrentItem] = useState(defaultNewItem);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        const fetchKegiatan = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const response = await fetch(`${backendUrl}/api/jadwal-rutin`, {
                    headers: { 'x-access-token': token }
                });
                if (!response.ok) throw new Error('Gagal mengambil data');
                const data = await response.json();
                setKegiatanItems(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchKegiatan();
    }, [token]);

    const openModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setCurrentItem({ ...defaultNewItem, ...item });
        } else {
            setIsEditing(false);
            setCurrentItem(defaultNewItem);
        }
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);
    const openDeleteModal = (item) => { setItemToDelete(item); setIsDeleteModalOpen(true); };
    const closeDeleteModal = () => { setItemToDelete(null); setIsDeleteModalOpen(false); };

    const handleFormSubmit = async (itemData) => {
        const headers = {
            'Content-Type': 'application/json',
            'x-access-token': token
        };

        if (isEditing) {
            try {
                const response = await fetch(`${backendUrl}/api/jadwal-rutin/${itemData.id}`, { // PERBAIKAN: Gunakan .id
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(itemData)
                });
                if (!response.ok) throw new Error('Gagal memperbarui data');
                const updatedItem = await response.json();
                setKegiatanItems(kegiatanItems.map(item => item.id === updatedItem.id ? updatedItem : item)); // PERBAIKAN: Gunakan .id
            } catch (error) {
                console.error("Error updating item:", error);
            }
        } else {
            try {
                const response = await fetch(`${backendUrl}/api/jadwal-rutin/create`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(itemData)
                });
                if (!response.ok) throw new Error('Gagal menambah data');
                const newItem = await response.json();
                setKegiatanItems([...kegiatanItems, newItem]);
            } catch (error) {
                console.error("Error adding item:", error);
            }
        }
        closeModal();
    };

    const handleDeleteItem = async () => {
        if (itemToDelete) {
            try {
                const response = await fetch(`${backendUrl}/api/jadwal-rutin/${itemToDelete.id}`, { // PERBAIKAN: Gunakan .id
                    method: 'DELETE',
                    headers: { 'x-access-token': token }
                });
                if (!response.ok) throw new Error('Gagal menghapus data');
                setKegiatanItems(kegiatanItems.filter(item => item.id !== itemToDelete.id)); // PERBAIKAN: Gunakan .id
                closeDeleteModal();
            } catch (error) {
                console.error("Error deleting item:", error);
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
                    <p className="text-gray-500">Belum ada kegiatan rutin yang ditambahkan.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {kegiatanItems.map((kegiatan) => {
                        const IconComponent = iconMap[kegiatan.icon] || FiClipboard;
                        return (
                            <div key={kegiatan.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"> {/* PERBAIKAN: Gunakan .id */}
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${kegiatan.iconBg || 'bg-gray-100'}`}>
                                        <IconComponent className={`h-6 w-6 ${kegiatan.iconColor || 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{kegiatan.name}</p>
                                        <p className="text-sm text-gray-500">{formatSchedule(kegiatan)}</p>
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

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">{isEditing ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}</Dialog.Title>
                                                <p className="text-sm text-gray-500 mt-1">Isi detail kegiatan di bawah ini.</p>
                                            </div>
                                        </div>
                                        <button type="button" className="p-1.5 text-gray-400 bg-transparent rounded-lg hover:bg-gray-200 hover:text-gray-900" onClick={closeModal}>
                                            <FiX className="h-5 w-5" />
                                            <span className="sr-only">Close modal</span>
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        <ScheduleForm initialItem={currentItem} onSubmit={handleFormSubmit} onClose={closeModal} />
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            <Transition appear show={isDeleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeDeleteModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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