"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiEdit3, FiX, FiSearch, FiLoader, FiPlus, FiEye, FiTrendingUp, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen Badge Status
const StatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full";
    const specificClasses = status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";
    return <span className={`${baseClasses} ${specificClasses}`}>{status ? 'Aktif' : 'Tidak Aktif'}</span>;
};

// Komponen Modal
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black bg-opacity-40" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            {/* --- PERUBAHAN DI SINI --- */}
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-800">{title}</Dialog.Title>
                                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><FiX size={24} /></button>
                                </div>
                                {children}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// Data tombol filter
const filterButtons = [
    { id: 'all', label: 'Semua' }, { id: 1, label: '1' }, { id: 2, label: '2' }, { id: 3, label: '3' }, { id: 4, label: '4' }, { id: 5, label: '5' }, { id: 6, label: '6' },
];

// Template data santri baru
const initialSantriState = {
    nama: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    alamat: '',
    tahun_masuk: new Date().getFullYear().toString(),
    status_aktif: 'Aktif',
    id_kelas: '',
    Ortu: {
        nama_ortu_lk: '',
        nama_ortu_pr: '',
        pekerjaan_lk: '',
        pekerjaan_pr: '',
        no_telp: '',
        alamat: ''
    }
};

// Fungsi bantuan untuk memformat tanggal
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (error) {
        return '';
    }
};

export default function SantriPage() {
    const { token, user } = useAuth();
    const [allSantri, setAllSantri] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // --- PERUBAHAN: State untuk modal konfirmasi dan notifikasi ---
    const [isConfirmPromoteModalOpen, setIsConfirmPromoteModalOpen] = useState(false);
    const [notification, setNotification] = useState({ isOpen: false, message: '', isError: false });

    const [editingSantri, setEditingSantri] = useState(null);
    const [viewingSantri, setViewingSantri] = useState(null);
    const [newSantriData, setNewSantriData] = useState(initialSantriState);

    const [kelasOptions, setKelasOptions] = useState([]);

    // Fetch data santri dari backend
    const fetchSantri = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/santri`, {
                headers: { 'x-access-token': token }
            });
            if (!response.ok) throw new Error('Gagal mengambil data santri');
            const data = await response.json();
            setAllSantri(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data kelas untuk dropdown
    const fetchKelasOptions = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${backendUrl}/api/santri/kelas`, { headers: { 'x-access-token': token } });
            const data = await res.json();
            setKelasOptions(data);
        } catch (error) {
            console.error("Gagal mengambil data kelas:", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSantri();
            fetchKelasOptions();
            if (user?.jenis_kelamin) {
                setNewSantriData(prev => ({ ...prev, jenis_kelamin: user.jenis_kelamin }));
            }
        }
    }, [token, user]);

    // Memoized filtered santri
    const filteredSantri = useMemo(() => {
        return allSantri.filter(santri => {
            const matchesFilter = activeFilter === 'all' 
                ? true 
                : santri.Kela?.id_kelas === activeFilter;
            
            const matchesSearch = santri.nama.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesFilter && matchesSearch;
        });
    }, [allSantri, searchTerm, activeFilter]);

    // --- Handlers untuk Modal ---
    const openEditModal = (santri) => {
        setEditingSantri({
            ...santri,
            tanggal_lahir: formatDateForInput(santri.tanggal_lahir),
            status_aktif: santri.status_aktif ? 'Aktif' : 'Tidak Aktif',
            Ortu: santri.Ortu || initialSantriState.Ortu
        });
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => setIsEditModalOpen(false);

    const openViewModal = (santri) => {
        setViewingSantri(santri);
        setIsViewModalOpen(true);
    };
    const closeViewModal = () => setIsViewModalOpen(false);

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
        setNewSantriData({ ...initialSantriState, jenis_kelamin: user?.jenis_kelamin || '' });
    };
    const closeCreateModal = () => setIsCreateModalOpen(false);

    // --- PERUBAHAN: Handler untuk menutup modal notifikasi ---
    const closeNotificationModal = () => setNotification({ isOpen: false, message: '', isError: false });

    // --- Handlers untuk Aksi CRUD ---
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newSantriData,
                status_aktif: newSantriData.status_aktif === 'Aktif'
            };
            const response = await fetch(`${backendUrl}/api/santri`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Gagal membuat data santri');
            }
            await fetchSantri();
            closeCreateModal();
        } catch (error) {
            console.error("Error creating santri:", error);
        }
    };
    
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...editingSantri,
                status_aktif: editingSantri.status_aktif === 'Aktif'
            };

            const response = await fetch(`${backendUrl}/api/santri/${editingSantri.id_santri}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Gagal memperbarui data');
            }
            await fetchSantri();
            closeEditModal();
        } catch (error) {
            console.error("Error updating santri:", error);
        }
    };

    // --- PERUBAHAN: Fungsi untuk mengeksekusi kenaikan kelas setelah konfirmasi ---
    const executePromoteClasses = async () => {
        setIsConfirmPromoteModalOpen(false); // Tutup modal konfirmasi
        try {
            const response = await fetch(`${backendUrl}/api/santri/promote`, {
                method: 'POST',
                headers: { 'x-access-token': token }
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Gagal memproses kenaikan kelas');
            }
            await fetchSantri();
            // Tampilkan notifikasi sukses
            setNotification({ isOpen: true, message: result.message, isError: false });
        } catch (error) {
            console.error("Error promoting classes:", error);
            // Tampilkan notifikasi error
            setNotification({ isOpen: true, message: `Error: ${error.message}`, isError: true });
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <button onClick={openCreateModal} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        <FiPlus size={16} /><span>Input Santri</span>
                    </button>
                    {/* --- PERUBAHAN: onClick membuka modal konfirmasi --- */}
                    <button onClick={() => setIsConfirmPromoteModalOpen(true)} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                        <FiTrendingUp size={16} /><span>Update Tahun Pelajaran</span>
                    </button>
                </div>
                <div className="relative w-full sm:max-w-xs">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Cari nama santri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                </div>
            </div>
            
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto mb-6">
                {filterButtons.map((filter) => (
                    <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFilter === filter.id ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-600 hover:bg-white/60'}`}>
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* --- PERUBAHAN: Wrapper div untuk membuat tabel bisa di-scroll secara horizontal --- */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full min-w-[800px] text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase">
                        <tr>
                            <th className="p-4 font-medium w-12 text-center">NO</th>
                            <th className="p-4 font-medium whitespace-nowrap">NAMA</th>
                            <th className="p-4 font-medium whitespace-nowrap">KELAS</th>
                            <th className="p-4 font-medium whitespace-nowrap">TAHUN MASUK</th>
                            <th className="p-4 font-medium whitespace-nowrap">STATUS</th>
                            <th className="p-4 font-medium whitespace-nowrap">AKSI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr><td colSpan="6" className="text-center p-10"><FiLoader className="animate-spin inline-block mr-2" /> Memuat data...</td></tr>
                        ) : filteredSantri.length > 0 ? (
                            filteredSantri.map((santri, index) => (
                                <tr key={santri.id_santri} className="hover:bg-gray-50">
                                    <td className="p-4 text-center text-gray-500">{index + 1}</td>
                                    <td className="p-4 font-semibold text-gray-800 whitespace-nowrap">{santri.nama}</td>
                                    <td className="p-4 text-gray-600">{santri.Kela?.nama_kelas || '-'}</td>
                                    <td className="p-4 text-gray-600">{santri.tahun_masuk || '-'}</td>
                                    <td className="p-4"><StatusBadge status={santri.status_aktif} /></td>
                                    <td className="p-4 flex items-center gap-2 whitespace-nowrap">
                                        <button onClick={() => openViewModal(santri)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                                            <FiEye size={14} /><span>View</span>
                                        </button>
                                        <button onClick={() => openEditModal(santri)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                                            <FiEdit3 size={14} /><span>Edit</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="text-center p-10 text-gray-500">Tidak ada data santri yang cocok.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL CREATE --- */}
            {isCreateModalOpen && (
                <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Input Data Santri Baru">
                    <form onSubmit={handleCreate} className="space-y-6">
                        {/* Data Diri Santri */}
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-lg font-semibold mb-3 text-gray-700">Data Diri Santri</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                    <input type="text" required value={newSantriData.nama} onChange={(e) => setNewSantriData({...newSantriData, nama: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                                    <select required value={newSantriData.jenis_kelamin} onChange={(e) => setNewSantriData({...newSantriData, jenis_kelamin: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" disabled={!!user?.jenis_kelamin}>
                                        <option value="">-- Pilih --</option>
                                        <option>Putra</option>
                                        <option>Putri</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tempat Lahir</label>
                                    <input type="text" value={newSantriData.tempat_lahir} onChange={(e) => setNewSantriData({...newSantriData, tempat_lahir: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                                    <input type="date" value={newSantriData.tanggal_lahir} onChange={(e) => setNewSantriData({...newSantriData, tanggal_lahir: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Alamat Santri</label>
                                    <textarea value={newSantriData.alamat} onChange={(e) => setNewSantriData({...newSantriData, alamat: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tahun Masuk</label>
                                    <input type="text" value={newSantriData.tahun_masuk} onChange={(e) => setNewSantriData({...newSantriData, tahun_masuk: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kelas</label>
                                    <select value={newSantriData.id_kelas} onChange={(e) => setNewSantriData({...newSantriData, id_kelas: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                        <option value="">-- Pilih Kelas --</option>
                                        {kelasOptions.map(k => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Data Orang Tua */}
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-lg font-semibold mb-3 text-gray-700">Data Orang Tua / Wali</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Ayah</label>
                                    <input type="text" value={newSantriData.Ortu.nama_ortu_lk} onChange={(e) => setNewSantriData({...newSantriData, Ortu: {...newSantriData.Ortu, nama_ortu_lk: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pekerjaan Ayah</label>
                                    <input type="text" value={newSantriData.Ortu.pekerjaan_lk} onChange={(e) => setNewSantriData({...newSantriData, Ortu: {...newSantriData.Ortu, pekerjaan_lk: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Ibu</label>
                                    <input type="text" value={newSantriData.Ortu.nama_ortu_pr} onChange={(e) => setNewSantriData({...newSantriData, Ortu: {...newSantriData.Ortu, nama_ortu_pr: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pekerjaan Ibu</label>
                                    <input type="text" value={newSantriData.Ortu.pekerjaan_pr} onChange={(e) => setNewSantriData({...newSantriData, Ortu: {...newSantriData.Ortu, pekerjaan_pr: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">No. Telepon</label>
                                    <input type="tel" value={newSantriData.Ortu.no_telp} onChange={(e) => setNewSantriData({...newSantriData, Ortu: {...newSantriData.Ortu, no_telp: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Alamat Orang Tua</label>
                                    <textarea value={newSantriData.Ortu.alamat} onChange={(e) => setNewSantriData({...newSantriData, Ortu: {...newSantriData.Ortu, alamat: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                            <button type="button" onClick={closeCreateModal} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* --- MODAL EDIT --- */}
            {editingSantri && (
                <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`Edit Data: ${editingSantri.nama}`}>
                    <form onSubmit={handleUpdate} className="space-y-6">
                        {/* Data Diri Santri */}
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-lg font-semibold mb-3 text-gray-700">Data Diri Santri</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama</label>
                                    <input type="text" value={editingSantri.nama} onChange={(e) => setEditingSantri({...editingSantri, nama: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tempat Lahir</label>
                                    <input type="text" value={editingSantri.tempat_lahir || ''} onChange={(e) => setEditingSantri({...editingSantri, tempat_lahir: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                                    <input type="date" value={editingSantri.tanggal_lahir || ''} onChange={(e) => setEditingSantri({...editingSantri, tanggal_lahir: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Alamat</label>
                                    <textarea value={editingSantri.alamat || ''} onChange={(e) => setEditingSantri({...editingSantri, alamat: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tahun Masuk</label>
                                    <input type="text" value={editingSantri.tahun_masuk || ''} onChange={(e) => setEditingSantri({...editingSantri, tahun_masuk: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kelas</label>
                                    <select value={editingSantri.id_kelas || ''} onChange={(e) => setEditingSantri({...editingSantri, id_kelas: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                        <option value="">-- Pilih Kelas --</option>
                                        {kelasOptions.map(k => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select value={editingSantri.status_aktif} onChange={(e) => setEditingSantri({...editingSantri, status_aktif: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                        <option>Aktif</option>
                                        <option>Tidak Aktif</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Data Orang Tua */}
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-lg font-semibold mb-3 text-gray-700">Data Orang Tua / Wali</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Ayah</label>
                                    <input type="text" value={editingSantri.Ortu?.nama_ortu_lk || ''} onChange={(e) => setEditingSantri({...editingSantri, Ortu: {...editingSantri.Ortu, nama_ortu_lk: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pekerjaan Ayah</label>
                                    <input type="text" value={editingSantri.Ortu?.pekerjaan_lk || ''} onChange={(e) => setEditingSantri({...editingSantri, Ortu: {...editingSantri.Ortu, pekerjaan_lk: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Ibu</label>
                                    <input type="text" value={editingSantri.Ortu?.nama_ortu_pr || ''} onChange={(e) => setEditingSantri({...editingSantri, Ortu: {...editingSantri.Ortu, nama_ortu_pr: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pekerjaan Ibu</label>
                                    <input type="text" value={editingSantri.Ortu?.pekerjaan_pr || ''} onChange={(e) => setEditingSantri({...editingSantri, Ortu: {...editingSantri.Ortu, pekerjaan_pr: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">No. Telepon</label>
                                    <input type="tel" value={editingSantri.Ortu?.no_telp || ''} onChange={(e) => setEditingSantri({...editingSantri, Ortu: {...editingSantri.Ortu, no_telp: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Alamat Orang Tua</label>
                                    <textarea value={editingSantri.Ortu?.alamat || ''} onChange={(e) => setEditingSantri({...editingSantri, Ortu: {...editingSantri.Ortu, alamat: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                            <button type="button" onClick={closeEditModal} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan Perubahan</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* --- MODAL VIEW --- */}
            {viewingSantri && (
                <Modal isOpen={isViewModalOpen} onClose={closeViewModal} title={`Detail Data: ${viewingSantri.nama}`}>
                    <div className="space-y-6">
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-lg font-semibold mb-3 text-gray-700">Data Diri Santri</h4>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div className="flex flex-col"><dt className="text-gray-500">Nama:</dt><dd className="text-gray-800 font-medium">{viewingSantri.nama}</dd></div>
                                <div className="flex flex-col"><dt className="text-gray-500">Jenis Kelamin:</dt><dd className="text-gray-800 font-medium">{viewingSantri.jenis_kelamin}</dd></div>
                                <div className="flex flex-col"><dt className="text-gray-500">Kelahiran:</dt><dd className="text-gray-800 font-medium">{viewingSantri.tempat_lahir}, {new Date(viewingSantri.tanggal_lahir).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</dd></div>
                                <div className="flex flex-col"><dt className="text-gray-500">Tahun Masuk:</dt><dd className="text-gray-800 font-medium">{viewingSantri.tahun_masuk}</dd></div>
                                <div className="flex flex-col"><dt className="text-gray-500">Kelas:</dt><dd className="text-gray-800 font-medium">{viewingSantri.Kela?.nama_kelas || '-'}</dd></div>
                                <div className="flex flex-col"><dt className="text-gray-500">Status:</dt><dd><StatusBadge status={viewingSantri.status_aktif} /></dd></div>
                                <div className="flex flex-col md:col-span-2"><dt className="text-gray-500">Alamat:</dt><dd className="text-gray-800 font-medium">{viewingSantri.alamat}</dd></div>
                            </dl>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="text-lg font-semibold mb-3 text-gray-700">Data Orang Tua / Wali</h4>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div className="flex flex-col"><dt className="text-gray-500">Nama Ayah:</dt><dd className="text-gray-800 font-medium">{viewingSantri.Ortu?.nama_ortu_lk || '-'}</dd></div>
                                <div className="flex flex-col"><dt className="text-gray-500">Pekerjaan Ayah:</dt><dd className="text-gray-800 font-medium">{viewingSantri.Ortu?.pekerjaan_lk || '-'}</dd></div>
                                <div className="flex flex-col"><dt className="text-gray-500">Nama Ibu:</dt><dd className="text-gray-800 font-medium">{viewingSantri.Ortu?.nama_ortu_pr || '-'}</dd></div>
                                <div className="flex flex-col"><dt className="text-gray-500">Pekerjaan Ibu:</dt><dd className="text-gray-800 font-medium">{viewingSantri.Ortu?.pekerjaan_pr || '-'}</dd></div>
                                <div className="flex flex-col"><dt className="text-gray-500">No. Telepon:</dt><dd className="text-gray-800 font-medium">{viewingSantri.Ortu?.no_telp || '-'}</dd></div>
                                <div className="flex flex-col md:col-span-2"><dt className="text-gray-500">Alamat Ortu:</dt><dd className="text-gray-800 font-medium">{viewingSantri.Ortu?.alamat || '-'}</dd></div>
                            </dl>
                        </div>
                        <div className="flex justify-end pt-4 border-t mt-6">
                            <button type="button" onClick={closeViewModal} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Tutup</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* --- BARU: Modal untuk Konfirmasi Kenaikan Kelas --- */}
            <Modal isOpen={isConfirmPromoteModalOpen} onClose={() => setIsConfirmPromoteModalOpen(false)} title="Konfirmasi Kenaikan Kelas">
                <div className="text-center">
                    <FiAlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
                    <h3 className="mb-2 text-lg font-normal text-gray-600">
                        Apakah Anda yakin ingin menaikkan kelas semua santri aktif?
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setIsConfirmPromoteModalOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">
                            Batal
                        </button>
                        <button onClick={executePromoteClasses} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            Ya, Lanjutkan
                        </button>
                    </div>
                </div>
            </Modal>

            {/* --- BARU: Modal untuk Notifikasi Hasil Aksi --- */}
            <Modal isOpen={notification.isOpen} onClose={closeNotificationModal} title={notification.isError ? "Terjadi Kesalahan" : "Sukses"}>
                 <div className="text-center">
                    {notification.isError ? (
                        <FiAlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                    ) : (
                        <FiCheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                    )}
                    <p className="text-gray-700 mb-6">{notification.message}</p>
                    <button onClick={closeNotificationModal} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Tutup
                    </button>
                </div>
            </Modal>
        </div>
    );
}