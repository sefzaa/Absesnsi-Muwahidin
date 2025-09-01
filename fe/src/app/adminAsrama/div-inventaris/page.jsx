"use client";

import { useState } from 'react';
// Menambahkan FiUser untuk pengganti avatar
import { FiPlus, FiX, FiEdit, FiTrash2, FiAlertTriangle, FiUser } from 'react-icons/fi';

// ▼▼▼ 1. DATA DISESUAIKAN UNTUK DIVISI INVENTARIS ▼▼▼
// Hanya berisi id, name, dan kontak. Avatar dan role dihilangkan.
const initialInventarisData = [
  {
    id: 1,
    name: 'Gavin Ross',
    kontak: '85212345678',
  },
  {
    id: 2,
    name: 'Nina Jørgensen',
    kontak: '87887654321',
  },
  {
    id: 3,
    name: 'Kenji Tanaka',
    kontak: '89901012345',
  },
];

// Komponen Modal sama persis seperti referensi
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><FiX size={24} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function DivisiInventarisPage() {
  const [inventarisData, setInventarisData] = useState(initialInventarisData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAkun, setSelectedAkun] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleViewAkun = (akun) => {
    setSelectedAkun(akun);
    setModalMode('view');
    setIsViewModalOpen(true);
  };
  
  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedAkun(null);
  };
  
  const openDeleteModal = (akun) => {
    setItemToDelete(akun);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  }

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      setInventarisData(currentData => currentData.filter(akun => akun.id !== itemToDelete.id));
      handleCloseModals();
      closeDeleteModal();
    }
  };
  
  return (
    <div>
      <div className="flex justify-start mb-6">
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><FiPlus size={20} /><span>Tambah Akun</span></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventarisData.map((akun) => (
          // ▼▼▼ 2. TAMPILAN KARTU DISESUAIKAN (TANPA AVATAR & ROLE) ▼▼▼
          <div key={akun.id} onClick={() => handleViewAkun(akun)} className="bg-white p-6 rounded-2xl shadow-sm text-center flex flex-col items-center cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E5E7EB' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`}}>
            {/* Menggunakan Ikon sebagai pengganti Avatar */}
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4 ring-4 ring-white">
                <FiUser className="h-12 w-12 text-gray-400" />
            </div>
            <p className="font-bold text-lg text-gray-800">{akun.name}</p>
            <p className="text-sm text-blue-600 font-medium">+62 {akun.kontak}</p>
          </div>
        ))}
      </div>
      
      {/* ▼▼▼ 3. FORM TAMBAH DISESUAIKAN (HANYA NAMA, KONTAK, PASSWORD) ▼▼▼ */}
      <Modal isOpen={isAddModalOpen} onClose={handleCloseModals} title="Tambah Akun Inventaris">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama</label>
            <input type="text" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400" placeholder="Masukkan nama" />
          </div>
          <div>
            <label htmlFor="add-kontak" className="block text-sm font-medium text-gray-700">Kontak</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">+62</span>
              </div>
              <input type="tel" id="add-kontak" className="block w-full rounded-md border-gray-300 py-2 pl-12 pr-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900" placeholder="812-3456-7890" pattern="8[0-9]{8,11}" title="Masukkan nomor telepon valid dimulai dengan angka 8."/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400" placeholder="Masukkan password" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={handleCloseModals} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail / Edit */}
      {selectedAkun && (
        <Modal isOpen={isViewModalOpen} onClose={handleCloseModals} title={modalMode === 'view' ? 'Detail Akun' : 'Edit Akun'}>
          {modalMode === 'view' ? (
             // ▼▼▼ 4. TAMPILAN DETAIL DISESUAIKAN (SANGAT SIMPEL) ▼▼▼
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-white">
                    <FiUser className="h-16 w-16 text-gray-400" />
               </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{selectedAkun.name}</p>
                <p className="text-base text-blue-600 font-medium">+62 {selectedAkun.kontak}</p>
              </div>
              <div className="w-full flex justify-between gap-3 pt-4">
                 <button onClick={() => openDeleteModal(selectedAkun)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2/>Hapus</button>
                 <button onClick={() => setModalMode('edit')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><FiEdit/>Edit</button>
              </div>
            </div>
          ) : (
            // ▼▼▼ 5. FORM EDIT DISESUAIKAN (HANYA NAMA, KONTAK, PASSWORD) ▼▼▼
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama</label>
                <input type="text" defaultValue={selectedAkun.name} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
              </div>
              <div>
                <label htmlFor="edit-kontak" className="block text-sm font-medium text-gray-700">Kontak</label>
                <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">+62</span>
                    </div>
                    <input type="tel" id="edit-kontak" className="block w-full rounded-md border-gray-300 py-2 pl-12 pr-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900" defaultValue={selectedAkun.kontak} pattern="8[0-9]{8,11}" title="Masukkan nomor telepon valid dimulai dengan angka 8."/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password Baru (Opsional)</label>
                <input type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" placeholder="Kosongkan jika tidak ingin diubah" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModalMode('view')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan Perubahan</button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Modal Konfirmasi Hapus (Tidak ada perubahan, sudah generik) */}
      {itemToDelete && (
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Konfirmasi Hapus">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <FiAlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <p className="mt-4 text-gray-700">
                Apakah Anda yakin ingin menghapus akun untuk <strong className="font-semibold">{itemToDelete.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-center gap-4 mt-6">
                <button onClick={closeDeleteModal} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                <button onClick={handleDeleteConfirm} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}