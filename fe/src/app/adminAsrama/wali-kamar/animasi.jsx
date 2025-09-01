"use client";

// ▼▼▼ 1. MENAMBAHKAN IMPORT DARI HEADLESS UI & FRAGMENT ▼▼▼
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiPlus, FiX, FiEdit, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

// Data awal tidak berubah
const initialWaliKamarData = [
  {
    id: 1,
    name: 'Jason Price',
    kontak: '81234567890',
    asal: 'Jakarta',
    kamar: '1A',
    asrama: 'Ibrahim',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80'
  },
  {
    id: 2,
    name: 'Jukkoe Siso',
    kontak: '81122334455',
    asal: 'Surabaya',
    kamar: '2B',
    asrama: 'Yahya',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=761&q=80'
  },
   {
    id: 3,
    name: 'Harriet King',
    kontak: '85678901234',
    asal: 'Bandung',
    kamar: '3A',
    asrama: 'Yusuf',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80'
  },
];


export default function WaliKamarPage() {
  const [waliKamarData, setWaliKamarData] = useState(initialWaliKamarData);
  // ▼▼▼ 2. STATE MANAGEMENT DISESUAIKAN UNTUK HEADLESS UI ▼▼▼
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // --- Fungsi untuk mengelola modal ---
  function openAddModal() {
    setCurrentItem({ name: '', kontak: '', asal: '', password: '' }); // Set item default
    setIsAddModalOpen(true);
  }
  function closeAddModal() { setIsAddModalOpen(false); }

  function openEditModal(item) {
    setCurrentItem(item);
    setIsEditModalOpen(true);
  }
  function closeEditModal() { setIsEditModalOpen(false); }

  function openDeleteModal(item) {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  }
  function closeDeleteModal() { setIsDeleteModalOpen(false); }

  // --- Fungsi untuk mengelola data (CRUD) ---
  function handleAddItem(e) {
    e.preventDefault();
    // Logika untuk menambah item baru
    const newItem = { ...currentItem, id: Date.now(), avatar: 'https://placehold.co/100x100/E2E8F0/475569?text=New' };
    setWaliKamarData([...waliKamarData, newItem]);
    closeAddModal();
  }

  function handleUpdateItem(e) {
    e.preventDefault();
    // Logika untuk update item
    setWaliKamarData(waliKamarData.map(item => item.id === currentItem.id ? currentItem : item));
    closeEditModal();
  }

  function handleDeleteItem() {
    // Logika untuk hapus item
    setWaliKamarData(waliKamarData.filter(item => item.id !== currentItem.id));
    closeDeleteModal();
  }
  
  return (
    <div>
      <div className="flex justify-start mb-6">
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FiPlus size={20} />
          <span>Tambah Wali Kamar</span>
        </button>
      </div>

      {/* Grid Kartu Wali Kamar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {waliKamarData.map((wali) => (
          // ▼▼▼ 3. KARTU SEKARANG MEMBUKA MODAL EDIT/HAPUS ▼▼▼
          <div key={wali.id} className="bg-white p-6 rounded-2xl shadow-sm text-center flex flex-col items-center group relative"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E5E7EB' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
            }}
          >
            <img src={wali.avatar} alt={`Avatar of ${wali.name}`} className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-white"/>
            <p className="font-bold text-lg text-gray-800">{wali.name}</p>
            <p className="text-sm text-gray-500 mb-2">{wali.asal}</p>
            <p className="text-sm text-blue-600 font-medium">+62 {wali.kontak}</p>
            
            {/* Tombol Edit/Hapus yang muncul saat hover */}
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEditModal(wali)} className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"><FiEdit size={20} /></button>
              <button onClick={() => openDeleteModal(wali)} className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"><FiTrash2 size={20} /></button>
            </div>
          </div>
        ))}
      </div>
      
      {/* ▼▼▼ 4. IMPLEMENTASI MODAL BARU MENGGUNAKAN HEADLESS UI ▼▼▼ */}

      {/* Modal untuk Tambah dan Edit */}
      <Transition appear show={isAddModalOpen || isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={isAddModalOpen ? closeAddModal : closeEditModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            {/* INI BAGIAN LATAR BELAKANG MODALNYA */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {isAddModalOpen ? 'Tambah Wali Kamar Baru' : 'Edit Wali Kamar'}
                  </Dialog.Title>
                  <form onSubmit={isAddModalOpen ? handleAddItem : handleUpdateItem} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nama</label>
                      <input type="text" value={currentItem?.name} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Kontak</label>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">+62</span>
                        <input type="tel" value={currentItem?.kontak} onChange={(e) => setCurrentItem({...currentItem, kontak: e.target.value})} className="block w-full rounded-md border-gray-300 py-2 pl-12 pr-3 text-gray-900" pattern="8[0-9]{8,11}" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asal</label>
                      <input type="text" value={currentItem?.asal} onChange={(e) => setCurrentItem({...currentItem, asal: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input type="password" onChange={(e) => setCurrentItem({...currentItem, password: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" placeholder={isEditModalOpen ? 'Kosongkan jika tidak diubah' : ''} required={isAddModalOpen} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={isAddModalOpen ? closeAddModal : closeEditModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal untuk Konfirmasi Hapus */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeDeleteModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-start gap-4">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0">
                      <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-0 flex-1">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">Hapus Wali Kamar</Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Apakah Anda yakin ingin menghapus data untuk **{currentItem?.name}**? Tindakan ini tidak dapat dibatalkan.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 flex flex-row-reverse gap-3">
                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" onClick={handleDeleteItem}>Hapus</button>
                    <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={closeDeleteModal}>Batal</button>
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