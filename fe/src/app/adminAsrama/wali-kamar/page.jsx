"use client";

import { useState, useEffect, Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
// DITAMBAHKAN: Import ikon FiHome
import { FiPlus, FiX, FiEdit, FiTrash2, FiAlertTriangle, FiLoader, FiUser, FiLock, FiHome } from 'react-icons/fi';
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const Modal = ({ isOpen, onClose, children }) => {
  // Komponen Modal tidak perlu diubah
  if (!isOpen) return null;
  return (
    <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                            {children}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
    </Transition>
  );
};

// Helper untuk format tanggal
const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    // Mengatasi masalah zona waktu UTC dari database
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(correctedDate);
};

export default function WaliKamarPage() {
  const { token } = useAuth();
  const [waliKamarData, setWaliKamarData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedWali, setSelectedWali] = useState(null);
  const [profileImage, setProfileImage] = useState({ file: null, preview: '' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // Generate daftar tahun untuk dropdown
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2010;
    let yearOptions = [];
    for (let i = currentYear; i >= startYear; i--) {
        yearOptions.push(i);
    }
    return yearOptions;
  }, []);

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
        const response = await fetch(`${backendUrl}/api/akun/wali-kamar`, { headers: { 'x-access-token': token } });
        if (!response.ok) throw new Error('Gagal mengambil data');
        const data = await response.json();
        setWaliKamarData(data);
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
        fetchData();
    }
  }, [token]);

  const handleOpenModal = (mode, wali = null) => {
    setModalMode(mode);
    setPassword('');
    setUsername('');
    if (wali) {
        setSelectedWali({ 
            ...wali, 
            kontak: wali.kontak || '', 
            tanggal_lahir: wali.tanggal_lahir ? wali.tanggal_lahir.split('T')[0] : ''
        });
        setProfileImage({ file: null, preview: wali.avatar || '' });
    } else {
        setSelectedWali({ 
            name: '', kontak: '', tempat_lahir: '', tanggal_lahir: '', alamat: '', 
            tahun_masuk: new Date().getFullYear().toString()
        });
        setProfileImage({ file: null, preview: '' });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWali(null);
    setProfileImage({ file: null, preview: '' });
  };
  
  const openDeleteModal = (wali) => {
    setItemToDelete(wali);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { alert("Ukuran file terlalu besar! Maksimal 1MB."); return; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { alert("Format file tidak didukung! Gunakan JPG, PNG, atau WebP."); return; }
      setProfileImage({ file: file, preview: URL.createObjectURL(file) });
    }
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        const response = await fetch(`${backendUrl}/api/akun/wali-kamar/${itemToDelete.id_wali_kamar}`, { 
            method: 'DELETE',
            headers: { 'x-access-token': token }
        });
        if (!response.ok) throw new Error('Gagal menghapus data');
        setWaliKamarData(currentData => currentData.filter(wali => wali.id_wali_kamar !== itemToDelete.id_wali_kamar));
        handleCloseModal();
        closeDeleteModal();
      } catch (error) {
        console.error("Gagal menghapus data:", error);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const isEditing = modalMode === 'edit';
    const url = isEditing ? `${backendUrl}/api/akun/wali-kamar/${selectedWali.id_wali_kamar}` : `${backendUrl}/api/akun/wali-kamar`;
    const method = isEditing ? 'PUT' : 'POST';

    const formData = new FormData();
    formData.append('nama', selectedWali.name);
    formData.append('no_telp', selectedWali.kontak);
    formData.append('tempat_lahir', selectedWali.tempat_lahir);
    formData.append('tanggal_lahir', selectedWali.tanggal_lahir);
    formData.append('alamat', selectedWali.alamat);
    formData.append('tahun_masuk', selectedWali.tahun_masuk);

    if (profileImage.file) {
        formData.append('avatar', profileImage.file);
    }
    if (!isEditing) {
        if (!password || !username) { alert('Username dan Password wajib diisi untuk akun baru.'); return; }
        formData.append('username', username);
        formData.append('password', password);
    } else if (password) {
        formData.append('password', password);
    }

    try {
        const response = await fetch(url, { 
            method, 
            headers: { 'x-access-token': token },
            body: formData 
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal menyimpan data');
        }
        fetchData();
        handleCloseModal();
    } catch (error) {
        console.error("Submit Error:", error);
        alert(`Terjadi Kesalahan: ${error.message}`);
    }
  };
  
  return (
    <div>
      <div className="flex justify-start mb-6">
        <button onClick={() => handleOpenModal('add')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><FiPlus size={20} /><span>Tambah Wali Kamar</span></button>
      </div>

      {isLoading ? (
        <div className="text-center py-10"><FiLoader className="animate-spin inline-block" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {waliKamarData.map((wali) => (
            <div key={wali.id_wali_kamar} onClick={() => handleOpenModal('view', wali)} className="bg-white p-6 rounded-2xl shadow-sm text-center flex flex-col items-center cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E5E7EB' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`}}>
              <img src={wali.avatar} alt={`Avatar of ${wali.name}`} className="w-24 h-24 rounded-full object-cover mb-4 ring-4 ring-white"/>
              <p className="font-bold text-lg text-gray-800">{wali.name}</p>
              
              {/* DITAMBAHKAN: Menampilkan Asrama & Kamar di Card View */}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <FiHome />
                <span>{wali.asrama} - {wali.kamar}</span>
              </div>

              <p className="text-sm text-blue-600 font-medium">{wali.kontak ? `+62 ${wali.kontak}` : '-'}</p>
            </div>
          ))}
        </div>
      )}
      
      {selectedWali && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          {modalMode === 'view' ? (
            <>
              <div className="flex justify-end"><button onClick={handleCloseModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><FiX size={24} /></button></div>
              <div className="flex flex-col items-center text-center space-y-4 -mt-4">
                <img src={profileImage.preview || selectedWali.avatar} alt={`Avatar of ${selectedWali.name}`} className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-100"/>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{selectedWali.name}</p>
                  <p className="text-base text-blue-600 font-medium">{selectedWali.kontak ? `+62 ${selectedWali.kontak}` : '-'}</p>
                </div>
                {/* DIPERBARUI: Menampilkan kembali Asrama & Kamar di detail view */}
                <div className="w-full text-left bg-gray-50 p-4 rounded-lg text-sm">
                  <div className="flex justify-between py-2 border-b"><span className="font-medium text-gray-600">Tempat Lahir:</span><span className="text-gray-800">{selectedWali.tempat_lahir || '-'}</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="font-medium text-gray-600">Tanggal Lahir:</span><span className="text-gray-800">{formatDateForDisplay(selectedWali.tanggal_lahir)}</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="font-medium text-gray-600">Alamat:</span><span className="text-gray-800">{selectedWali.alamat || '-'}</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="font-medium text-gray-600">Tahun Masuk:</span><span className="text-gray-800">{selectedWali.tahun_masuk || '-'}</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="font-medium text-gray-600">Asrama:</span><span className="text-gray-800">{selectedWali.asrama}</span></div>
                  <div className="flex justify-between py-2"><span className="font-medium text-gray-600">Kamar:</span><span className="text-gray-800">{selectedWali.kamar}</span></div>
                </div>
                <div className="w-full flex justify-between gap-3 pt-4">
                  <button onClick={() => openDeleteModal(selectedWali)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FiTrash2/>Hapus</button>
                  <button onClick={() => setModalMode('edit')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><FiEdit/>Edit</button>
                </div>
              </div>
            </>
          ) : (
            // Form Edit tidak diubah, sudah sesuai permintaan
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${modalMode === 'edit' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                        {modalMode === 'edit' ? <FiEdit className="h-6 w-6 text-yellow-600" /> : <FiPlus className="h-6 w-6 text-blue-600" />}
                    </div>
                    <div>
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">{modalMode === 'edit' ? 'Edit Wali Kamar' : 'Tambah Wali Kamar Baru'}</Dialog.Title>
                        <p className="text-sm text-gray-500">Isi detail informasi di bawah.</p>
                    </div>
                </div>
                <button type="button" className="p-1 rounded-full text-gray-400 hover:bg-gray-100" onClick={handleCloseModal}><FiX size={20} /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto Profil</label>
                    <div className="mt-1 flex items-center gap-4">
                        <span className="inline-block h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                            {profileImage.preview ? ( <img src={profileImage.preview} alt="Preview" className="h-full w-full object-cover" /> ) : ( <FiUser className="h-full w-full text-gray-300" /> )}
                        </span>
                        <label htmlFor="file-upload" className="cursor-pointer rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50">
                            <span>Ganti</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP hingga 1MB.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  <input type="text" value={selectedWali.name} onChange={e => setSelectedWali({...selectedWali, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                        <input type="text" value={selectedWali.tempat_lahir} onChange={e => setSelectedWali({...selectedWali, tempat_lahir: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                        <input type="date" value={selectedWali.tanggal_lahir} onChange={e => setSelectedWali({...selectedWali, tanggal_lahir: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <input type="text" value={selectedWali.alamat} onChange={e => setSelectedWali({...selectedWali, alamat: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" placeholder="Contoh: Padang" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Masuk</label>
                  <select value={selectedWali.tahun_masuk} onChange={e => setSelectedWali({...selectedWali, tahun_masuk: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-gray-900">
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kontak</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-500 sm:text-sm">+62</span></div>
                        <input type="tel" value={selectedWali.kontak} onChange={e => setSelectedWali({...selectedWali, kontak: e.target.value})} className="block w-full rounded-md border-gray-300 py-2 pl-12 pr-3 shadow-sm sm:text-sm text-gray-900" pattern="8[0-9]{8,11}" />
                    </div>
                </div>
                {modalMode === 'add' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" required />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{modalMode === 'edit' ? 'Password Baru (Opsional)' : 'Password'}</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900" placeholder={modalMode === 'edit' ? 'Kosongkan jika tidak diubah' : 'Wajib diisi'} required={modalMode !== 'edit'} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <button type="button" onClick={modalMode === 'edit' ? () => setModalMode('view') : handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                </div>
              </form>
            </>
          )}
        </Modal>
      )}

      {itemToDelete && (
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><FiAlertTriangle className="h-6 w-6 text-red-600" /></div>
            <p className="mt-4 text-gray-700">Apakah Anda yakin ingin menghapus data untuk <strong className="font-semibold">{itemToDelete.name}</strong>?</p>
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