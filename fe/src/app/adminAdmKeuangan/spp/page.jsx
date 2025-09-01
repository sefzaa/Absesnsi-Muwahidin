"use client";

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiX, FiAlertTriangle, FiLoader, FiTag } from 'react-icons/fi';

// Definisikan URL base API Anda. Ganti jika perlu.
const API_BASE_URL = 'http://localhost:3000/api/spp';

export default function SppPage() {
  const [sppItems, setSppItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [newItem, setNewItem] = useState({ name: '', amount: '' });
  const [currentItem, setCurrentItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Helper Functions untuk Format Angka ---

  // Fungsi untuk memformat angka dengan pemisah ribuan saat diketik
  const formatNumberInput = (value) => {
    if (!value) return '';
    const numericValue = value.toString().replace(/[^0-9]/g, '');
    if (numericValue === '') return '';
    return new Intl.NumberFormat('id-ID').format(numericValue);
  };

  // Fungsi untuk mengubah angka yang diformat kembali menjadi angka biasa
  const parseFormattedNumber = (formattedValue) => {
    if (!formattedValue) return 0;
    return Number(String(formattedValue).replace(/\./g, ''));
  };


  // Fungsi untuk mengambil data dari API
  const fetchSppItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Gagal mengambil data SPP');
      const data = await response.json();
      setSppItems(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Anda bisa menambahkan state untuk menampilkan notifikasi error di UI
    } finally {
      setIsLoading(false);
    }
  };

  // Ambil data saat komponen pertama kali dimuat
  useEffect(() => {
    fetchSppItems();
  }, []);

  const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  // --- Handlers untuk Modal ---
  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewItem({ name: '', amount: '' });
  };

  const openEditModal = (item) => {
    // Saat membuka modal edit, format angka agar tampil dengan benar
    setCurrentItem({ ...item, amount: formatNumberInput(item.amount) });
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentItem(null);
  };

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // --- Handlers untuk Aksi CRUD ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.amount) return;
    setIsModalLoading(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Ubah kembali ke angka sebelum mengirim ke API
        body: JSON.stringify({ name: newItem.name, amount: parseFormattedNumber(newItem.amount) }),
      });
      if (!response.ok) throw new Error('Gagal menambahkan item');
      const createdItem = await response.json();
      setSppItems([...sppItems, createdItem]);
      closeAddModal();
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!currentItem) return;
    setIsModalLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${currentItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Ubah kembali ke angka sebelum mengirim ke API
        body: JSON.stringify({ name: currentItem.name, amount: parseFormattedNumber(currentItem.amount) }),
      });
      if (!response.ok) throw new Error('Gagal memperbarui item');
      const updatedItem = await response.json();
      setSppItems(sppItems.map(item => item.id === updatedItem.id ? updatedItem : item));
      closeEditModal();
    } catch (error) {
      console.error("Error updating item:", error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsModalLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Gagal menghapus item');
      setSppItems(sppItems.filter(item => item.id !== itemToDelete.id));
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsModalLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Manajemen Komponen SPP</h1>
        <div className="flex justify-start mb-6">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FiPlus size={20} />
            <span>Tambah Komponen</span>
          </button>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <FiLoader className="animate-spin h-8 w-8 text-gray-500" />
              <span className="ml-3 text-gray-500">Memuat data...</span>
            </div>
          ) : sppItems.length > 0 ? (
            <div className="space-y-4">
              {sppItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-cyan-100">
                      <FiDollarSign className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-base">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <p className="text-base text-blue-600 font-medium text-left sm:text-right w-full sm:w-36">
                      {formatCurrency(item.amount)}
                    </p>
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <button onClick={() => openEditModal(item)} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-white text-sm rounded-md hover:bg-yellow-500 transition-colors"><FiEdit size={14} /><span>Edit</span></button>
                      <button onClick={() => openDeleteModal(item)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"><FiTrash2 size={14} /><span>Hapus</span></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <p className="text-gray-500">Belum ada data komponen SPP. Silakan tambahkan item baru.</p>
            </div>
          )}
        </div>
      </div>



      {/* --- MODALS --- */}
      {/* Modal Tambah */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeAddModal}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                            <div className="flex items-center gap-3">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0">
                                    <FiPlus className="h-6 w-6 text-blue-600" />
                                </div>
                                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                  Tambah Komponen SPP Baru
                                </Dialog.Title>
                            </div>
                            <form onSubmit={handleAddItem} className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">Nama Komponen</label>
                                    <div className="relative">
                                        <FiTag className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                                        <input type="text" id="itemName" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="pl-10 mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" placeholder="Contoh: Uang Buku" required />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                                        <input 
                                          type="text" 
                                          id="amount" 
                                          value={newItem.amount} 
                                          onChange={(e) => setNewItem({ ...newItem, amount: formatNumberInput(e.target.value) })} 
                                          className="pl-12 mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" 
                                          placeholder="150.000" 
                                          required 
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                                    <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none" onClick={closeAddModal}>Batal</button>
                                    <button type="submit" disabled={isModalLoading} className="inline-flex justify-center items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-blue-300 transition-colors">
                                        {isModalLoading && <FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                                        Simpan
                                    </button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
      </Transition>

      {/* Modal Edit */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
         <Dialog as="div" className="relative z-10" onClose={closeEditModal}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                           {currentItem && (
                             <>
                                <div className="flex items-center gap-3">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0">
                                        <FiEdit className="h-6 w-6 text-yellow-600" />
                                    </div>
                                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                      Edit Komponen SPP
                                    </Dialog.Title>
                                </div>
                                <form onSubmit={handleUpdateItem} className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="editItemName" className="block text-sm font-medium text-gray-700 mb-1">Nama Komponen</label>
                                        <div className="relative">
                                            <FiTag className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                                            <input type="text" id="editItemName" value={currentItem.name} onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })} className="pl-10 mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="editAmount" className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                                            <input 
                                              type="text" 
                                              id="editAmount" 
                                              value={currentItem.amount} 
                                              onChange={(e) => setCurrentItem({ ...currentItem, amount: formatNumberInput(e.target.value) })} 
                                              className="pl-12 mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900" 
                                              required 
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                                        <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none" onClick={closeEditModal}>Batal</button>
                                        <button type="submit" disabled={isModalLoading} className="inline-flex justify-center items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-blue-300 transition-colors">
                                            {isModalLoading && <FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                                            Simpan Perubahan
                                        </button>
                                    </div>
                                </form>
                             </>
                           )}
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
                                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">Hapus Komponen</Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Apakah Anda yakin ingin menghapus item "{itemToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button type="button" disabled={isModalLoading} className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 sm:ml-3 sm:w-auto disabled:bg-red-300 transition-colors" onClick={handleDeleteItem}>
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
