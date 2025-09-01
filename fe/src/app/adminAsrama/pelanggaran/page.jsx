"use client";

import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiPlus, FiEdit, FiTrash2, FiX, FiAlertTriangle, FiShield, FiLoader, FiTag, FiHash } from 'react-icons/fi';
import { useAuth } from '../../AuthContext'; // Import useAuth

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const getTypeClass = (type) => {
  switch (type) {
    case 'Ringan': return 'bg-green-100 text-green-800';
    case 'Sedang': return 'bg-yellow-100 text-yellow-800';
    case 'Berat': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function PelanggaranPage() {
  const { token } = useAuth(); // Ambil token dari AuthContext
  const [pelanggaranItems, setPelanggaranItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const defaultNewItem = { nama: '', jenis: 'Ringan', bobot: '' };
  const [currentItem, setCurrentItem] = useState(defaultNewItem);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return; // Jangan fetch jika token belum ada
      setIsLoading(true);
      try {
        const response = await fetch(`${backendUrl}/api/pelanggaran-asrama`, {
          headers: { 'x-access-token': token } // Sertakan token
        });
        if (!response.ok) throw new Error('Gagal mengambil data');
        const data = await response.json();
        setPelanggaranItems(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]); // Tambahkan token sebagai dependency

  const openModal = (item = null) => {
    if (item) {
      setIsEditing(true);
      setCurrentItem(item);
    } else {
      setIsEditing(false);
      setCurrentItem(defaultNewItem);
    }
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const openDeleteModal = (item) => { setItemToDelete(item); setIsDeleteModalOpen(true); };
  const closeDeleteModal = () => { setItemToDelete(null); setIsDeleteModalOpen(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsModalLoading(true);
    const url = isEditing ? `${backendUrl}/api/pelanggaran-asrama/${currentItem.id_pelanggaran}` : `${backendUrl}/api/pelanggaran-asrama`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-access-token': token // Sertakan token
        },
        body: JSON.stringify({ ...currentItem, bobot: Number(currentItem.bobot) }),
      });
      if (!response.ok) throw new Error(`Gagal ${isEditing ? 'memperbarui' : 'menyimpan'} data`);
      
      // Ambil data terbaru untuk sinkronisasi
      const savedItem = await response.json();
      if (isEditing) {
        setPelanggaranItems(pelanggaranItems.map(item => item.id_pelanggaran === savedItem.id_pelanggaran ? savedItem : item));
      } else {
        setPelanggaranItems([...pelanggaranItems, savedItem]);
      }
      closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsModalLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/pelanggaran-asrama/${itemToDelete.id_pelanggaran}`, {
        method: 'DELETE',
        headers: { 'x-access-token': token } // Sertakan token
      });
      if (!response.ok) throw new Error('Gagal menghapus data');
      setPelanggaranItems(pelanggaranItems.filter(item => item.id_pelanggaran !== itemToDelete.id_pelanggaran));
      closeDeleteModal();
    } catch (error) {
      console.error(error);
    } finally {
      setIsModalLoading(false);
    }
  };

  return (
    <div>
        <div className="flex justify-start mb-6">
            <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FiPlus size={20} />
                <span>Jenis Pelanggaran</span>
            </button>
        </div>

        {isLoading ? (
            <div className="text-center py-10 flex justify-center items-center gap-2 text-gray-500">
                <FiLoader className="animate-spin" />
                <span>Memuat data pelanggaran...</span>
            </div>
        ) : pelanggaranItems.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500">Belum ada jenis pelanggaran yang ditambahkan.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {pelanggaranItems.map((pelanggaran) => (
                    <div key={pelanggaran.id_pelanggaran} className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-orange-100">
                                <FiShield className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-800">{pelanggaran.nama}</p>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeClass(pelanggaran.jenis)}`}>
                                        {pelanggaran.jenis}
                                    </span>
                                </div>
                                <p className="text-sm text-blue-600 font-medium">{pelanggaran.bobot} Poin</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                            <button onClick={() => openModal(pelanggaran)} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-white text-sm rounded-md hover:bg-yellow-500 transition-colors">
                                <FiEdit size={14} />
                                <span>Edit</span>
                            </button>
                            <button onClick={() => openDeleteModal(pelanggaran)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors">
                                <FiTrash2 size={14} />
                                <span>Hapus</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Modal untuk Tambah dan Edit */}
        <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={closeModal}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
                </Transition.Child>
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isEditing ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                            {isEditing ? <FiEdit className="h-6 w-6 text-yellow-600" /> : <FiPlus className="h-6 w-6 text-blue-600" />}
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                                {isEditing ? 'Edit Jenis Pelanggaran' : 'Tambah Jenis Pelanggaran'}
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500">Atur nama, jenis, dan bobot poin.</p>
                                        </div>
                                    </div>
                                    <button type="button" className="p-1 rounded-full text-gray-400 hover:bg-gray-100" onClick={closeModal}><FiX size={20} /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="pelanggaranName" className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggaran</label>
                                        <div className="relative">
                                            <FiTag className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                                            <input type="text" id="pelanggaranName" value={currentItem.nama} onChange={(e) => setCurrentItem({ ...currentItem, nama: e.target.value })} className="pl-10 pr-3 py-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900" placeholder="Contoh: Tidak ikut apel" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                                        <select id="type" value={currentItem.jenis} onChange={(e) => setCurrentItem({ ...currentItem, jenis: e.target.value })} className="px-3 py-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900">
                                            <option>Ringan</option>
                                            <option>Sedang</option>
                                            <option>Berat</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="bobot" className="block text-sm font-medium text-gray-700 mb-1">Bobot Poin</label>
                                        <div className="relative">
                                            <FiHash className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                                            <input type="number" id="bobot" value={currentItem.bobot} onChange={(e) => setCurrentItem({ ...currentItem, bobot: e.target.value })} className="pl-10 pr-3 py-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900" placeholder="Contoh: 5" required />
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                                        <button type="button" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={closeModal}>Batal</button>
                                        <button type="submit" disabled={isModalLoading} className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
                                            {isModalLoading && <FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                                            {isEditing ? 'Simpan Perubahan' : 'Simpan'}
                                        </button>
                                    </div>
                                </form>
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
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">Hapus Jenis Pelanggaran</Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Apakah Anda yakin ingin menghapus "{itemToDelete?.nama}"? Tindakan ini tidak dapat dibatalkan.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button type="button" disabled={isModalLoading} className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 sm:ml-3 sm:w-auto disabled:bg-red-300" onClick={handleDeleteItem}>
                                        {isModalLoading && <FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                                        Hapus
                                    </button>
                                    <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={closeDeleteModal}>
                                        Batal
                                    </button>
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