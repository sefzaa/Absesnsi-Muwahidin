"use client";

import { useState, useEffect, Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../AuthContext';

// --- Helper & Komponen Ikon ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const LoaderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-indigo-600"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
const AlertTriangleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const CheckCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const SearchIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const SortIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>;
const SortUpIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const SortDownIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const Modal = ({ isOpen, onClose, children, size = 'md' }) => {
    const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };
    if (!isOpen) return null;
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}>{children}</Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

const NotificationModal = ({ isOpen, type, message, onClose }) => (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <div className="flex flex-col items-center text-center p-4">
            {type === 'success' && <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><CheckCircleIcon className="h-10 w-10 text-green-600" /></div>}
            {type === 'error' && <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100"><AlertTriangleIcon className="h-10 w-10 text-red-600" /></div>}
            <Dialog.Title as="h3" className="mt-5 text-xl font-semibold leading-6 text-gray-900">{type === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan'}</Dialog.Title>
            <div className="mt-3"><p className="text-sm text-gray-600">{message}</p></div>
            <div className="mt-6 w-full">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors" onClick={onClose}>Mengerti</button>
            </div>
        </div>
    </Modal>
);

const baseInputClasses = "mt-1 block w-full text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";
const selectClasses = `${baseInputClasses} appearance-none bg-no-repeat bg-right pr-8 bg-[url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="%236b7280" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 8 4 4 4-4"/></svg>')]`;

export default function PegawaiPage() {
    const { token } = useAuth();
    const [pegawaiData, setPegawaiData] = useState([]);
    const [jabatanList, setJabatanList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedPegawai, setSelectedPegawai] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [notification, setNotification] = useState({ isOpen: false, type: '', message: '' });
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJabatan, setSelectedJabatan] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'ascending' });

    const initialFormState = {
        nama: '', nip: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '',
        alamat: '', no_telp: '', tahun_masuk: new Date().getFullYear().toString(),
        username: '', password: '', id_jabatan: '', jabatan_baru: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const fetchData = async () => {
        if (!token) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const [pegawaiRes, jabatanRes] = await Promise.all([
                fetch(`${backendUrl}/api/pegawai`, { headers: { 'x-access-token': token } }),
                fetch(`${backendUrl}/api/jabatan`, { headers: { 'x-access-token': token } })
            ]);
            if (!pegawaiRes.ok || !jabatanRes.ok) {
                const errorData = await (pegawaiRes.ok ? jabatanRes.json() : pegawaiRes.json());
                throw new Error(errorData.message || 'Gagal mengambil data dari server.');
            }
            const pegawai = await pegawaiRes.json();
            const jabatan = await jabatanRes.json();
            setPegawaiData(pegawai);
            setJabatanList(jabatan);
        } catch (error) {
            setNotification({ isOpen: true, type: 'error', message: 'Gagal memuat data. Periksa koneksi atau server backend.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);
    
    const processedData = useMemo(() => {
        let filterableItems = [...pegawaiData];
        if (filterableItems.length > 0) {
            filterableItems = filterableItems
                .filter(pegawai => selectedJabatan === 'all' || pegawai.id_jabatan == selectedJabatan)
                .filter(pegawai => {
                    const term = searchTerm.toLowerCase();
                    return (
                        pegawai.nama.toLowerCase().includes(term) ||
                        (pegawai.nip && pegawai.nip.toLowerCase().includes(term)) ||
                        (pegawai.username && pegawai.username.toLowerCase().includes(term))
                    );
                });
            if (sortConfig.key) {
                filterableItems.sort((a, b) => {
                    const valA = a[sortConfig.key] || '';
                    const valB = b[sortConfig.key] || '';
                    if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                });
            }
        }
        return filterableItems;
    }, [pegawaiData, searchTerm, selectedJabatan, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <SortIcon className="h-4 w-4 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <SortUpIcon className="h-4 w-4 text-indigo-600" /> : <SortDownIcon className="h-4 w-4 text-indigo-600" />;
    };

    const handleOpenModal = (mode, pegawai = null) => {
        setModalMode(mode);
        if (mode === 'add') {
            setFormData(initialFormState);
        } else {
            setSelectedPegawai(pegawai);
            setFormData({ ...pegawai, tanggal_lahir: pegawai.tanggal_lahir ? pegawai.tanggal_lahir.split('T')[0] : '', password: '', jabatan_baru: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPegawai(null);
        setFormData(initialFormState);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const isEditing = modalMode === 'edit';
        const url = isEditing ? `${backendUrl}/api/pegawai/${selectedPegawai.id_pegawai}` : `${backendUrl}/api/pegawai`;
        const method = isEditing ? 'PUT' : 'POST';
        const submissionData = { ...formData };
        if (!submissionData.nip || submissionData.nip.trim() === '') submissionData.nip = '-';
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify(submissionData)
            });
            const result = await response.json();
            
            if (!response.ok) {
                // Langsung tampilkan notifikasi error tanpa throw
                setNotification({ isOpen: true, type: 'error', message: result.message || `Gagal ${isEditing ? 'memperbarui' : 'menyimpan'} data.` });
                return; // Hentikan eksekusi
            }
            
            setNotification({ isOpen: true, type: 'success', message: result.message || `Data pegawai berhasil ${isEditing ? 'diperbarui' : 'disimpan'}.` });
            handleCloseModal();
            fetchData();
        } catch (error) {
            // Catch ini hanya untuk network error, bukan validasi server
            setNotification({ isOpen: true, type: 'error', message: 'Tidak dapat terhubung ke server. Mohon coba lagi.' });
        }
    };

    const handleDelete = (pegawai) => {
        setSelectedPegawai(pegawai);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPegawai) return;
        try {
            const response = await fetch(`${backendUrl}/api/pegawai/${selectedPegawai.id_pegawai}`, {
                method: 'DELETE',
                headers: { 'x-access-token': token }
            });
            
            const result = await response.json();
            if (!response.ok) {
                setNotification({ isOpen: true, type: 'error', message: result.message || 'Gagal menghapus data.' });
                return;
            }
            
            setNotification({ isOpen: true, type: 'success', message: 'Data pegawai berhasil dihapus.' });
            fetchData();
        } catch (error) {
            setNotification({ isOpen: true, type: 'error', message: 'Tidak dapat terhubung ke server.' });
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedPegawai(null);
        }
    };
    
    return (
        <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-screen">
            <NotificationModal isOpen={notification.isOpen} type={notification.type} message={notification.message} onClose={() => setNotification({ isOpen: false, type: '', message: '' })} />
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
                <div className="text-center p-4">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100"><AlertTriangleIcon className="h-10 w-10 text-red-600" /></div>
                    <Dialog.Title as="h3" className="mt-5 text-xl font-semibold text-gray-900">Konfirmasi Hapus</Dialog.Title>
                    <p className="mt-2 text-sm text-gray-600">Anda yakin ingin menghapus data <strong>{selectedPegawai?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                    <div className="flex justify-center gap-4 mt-6">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                        <button onClick={handleDeleteConfirm} className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700">Ya, Hapus</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="2xl">
                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-1">{modalMode === 'edit' ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}</Dialog.Title>
                <p className="text-sm text-gray-500 mb-6">Lengkapi semua informasi yang diperlukan di bawah ini.</p>
                <form onSubmit={handleFormSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                             <input type="text" name="nama" value={formData.nama} onChange={handleFormChange} className={baseInputClasses} required />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700">NIP</label>
                             <input type="text" name="nip" value={formData.nip} onChange={handleFormChange} placeholder="Ketik - jika tidak ada" className={baseInputClasses} required />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                             <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleFormChange} className={selectClasses} required>
                                 <option value="" disabled>Pilih Jenis Kelamin</option>
                                 <option value="Putra">Putra</option>
                                 <option value="Putri">Putri</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700">No. Telepon</label>
                             <input type="tel" name="no_telp" value={formData.no_telp} onChange={handleFormChange} className={baseInputClasses} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Tempat Lahir</label>
                             <input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleFormChange} className={baseInputClasses} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                             <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleFormChange} className={baseInputClasses} />
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700">Alamat</label>
                             <textarea name="alamat" value={formData.alamat} onChange={handleFormChange} rows="2" className={baseInputClasses}></textarea>
                         </div>
                     </div>
                     <div className="space-y-6 pt-6 border-t border-gray-200">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Jabatan</label>
                                 <select name="id_jabatan" value={formData.id_jabatan} onChange={handleFormChange} className={selectClasses} required>
                                     <option value="">Pilih Jabatan</option>
                                     {jabatanList.map(j => <option key={j.id_jabatan} value={j.id_jabatan}>{j.nama_jabatan}</option>)}
                                     <option value="lainnya">Lainnya (Jabatan Baru)</option>
                                 </select>
                             </div>
                             {formData.id_jabatan === 'lainnya' && ( <div><label className="block text-sm font-medium text-gray-700">Nama Jabatan Baru</label><input type="text" name="jabatan_baru" value={formData.jabatan_baru} onChange={handleFormChange} className={baseInputClasses} required /></div>)}
                              <div>
                                 <label className="block text-sm font-medium text-gray-700">Tahun Masuk</label>
                                 <input type="number" name="tahun_masuk" value={formData.tahun_masuk} onChange={handleFormChange} className={baseInputClasses} />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Username</label>
                                 <input type="text" name="username" value={formData.username} onChange={handleFormChange} className={`${baseInputClasses} ${modalMode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}`} required disabled={modalMode === 'edit'} autoComplete="off" />                             
                            </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700">{modalMode === 'edit' ? 'Password Baru (Opsional)' : 'Password'}</label>
                                 <input type="password" name="password" value={formData.password} onChange={handleFormChange} className={baseInputClasses} required={modalMode === 'add'} placeholder={modalMode === 'edit' ? 'Kosongkan jika tidak diubah' : ''} autoComplete="new-password" />                             
                            </div>
                         </div>
                     </div>
                     <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                         <button type="button" onClick={handleCloseModal} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Batal</button>
                         <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Simpan Perubahan</button>
                     </div>
                </form>
            </Modal>

            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900">Manajemen Pegawai</h1>
                    </div>
                    <button onClick={() => handleOpenModal('add')} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm w-full md:w-auto order-first md:order-last">
                        <PlusIcon /><span>Tambah Pegawai</span>
                    </button>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative sm:col-span-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="text" placeholder="Cari nama, NIP, atau username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${baseInputClasses} pl-10`}/>
                    </div>
                    <div>
                        <select value={selectedJabatan} onChange={(e) => setSelectedJabatan(e.target.value)} className={selectClasses}>
                            <option value="all">Semua Jabatan</option>
                            {jabatanList.map(j => <option key={j.id_jabatan} value={j.id_jabatan}>{j.nama_jabatan}</option>)}
                        </select>
                    </div>
                </div>
            </header>
            
            <main>
            {isLoading ? (
                <div className="text-center py-20"><LoaderIcon /> <p className="mt-2 text-gray-600">Memuat data...</p></div>
            ) : (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 hidden md:table-header-group">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button onClick={() => requestSort('nama')} className="flex items-center gap-2 hover:text-gray-700">Nama {getSortIcon('nama')}</button></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIP</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><button onClick={() => requestSort('jabatan')} className="flex items-center gap-2 hover:text-gray-700">Jabatan {getSortIcon('jabatan')}</button></th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 md:divide-y-0">
                                {processedData.length > 0 ? (
                                    processedData.map((pegawai, index) => (
                                        <tr key={pegawai.id_pegawai} className="md:table-row">
                                            <td className="px-6 py-4 md:whitespace-nowrap text-sm text-gray-500" data-label="No.">{index + 1}</td>
                                            <td className="px-6 py-4 md:whitespace-nowrap" data-label="Nama">
                                                <div className="text-sm font-medium text-gray-900">{pegawai.nama}</div>
                                                <div className="text-sm text-gray-500">{pegawai.username}</div>
                                            </td>
                                            <td className="px-6 py-4 md:whitespace-nowrap text-sm text-gray-700" data-label="NIP">{pegawai.nip}</td>
                                            <td className="px-6 py-4 md:whitespace-nowrap text-sm text-gray-700" data-label="Jabatan">{pegawai.jabatan}</td>
                                            <td className="px-6 py-4 md:whitespace-nowrap text-sm text-gray-700" data-label="Kontak">{pegawai.no_telp || '-'}</td>
                                            <td className="px-6 py-4 md:whitespace-nowrap text-right text-sm font-medium" data-label="Aksi">
                                                <div className="flex justify-end items-center gap-4">
                                                    <button onClick={() => handleOpenModal('edit', pegawai)} className="text-indigo-600 hover:text-indigo-900 transition-colors"><EditIcon /></button>
                                                    <button onClick={() => handleDelete(pegawai)} className="text-red-600 hover:text-red-900 transition-colors"><TrashIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="md:table-row">
                                        <td colSpan="6" className="text-center py-12 px-6 text-gray-500">
                                            <p className="font-semibold">Tidak Ada Data</p>
                                            <p className="text-sm mt-1">Tidak ada pegawai yang cocok dengan kriteria Anda.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            </main>
            
            <style jsx>{`
                @media (max-width: 767px) {
                    tbody tr { display: block; border: 1px solid #e5e7eb; border-radius: 0.5rem; margin-bottom: 1rem; padding: 1rem; }
                    tbody td { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; text-align: right; border-bottom: 1px solid #f3f4f6; }
                    tbody tr td:last-child { border-bottom: none; }
                    tbody td:before { content: attr(data-label); font-weight: 600; text-align: left; padding-right: 1rem; color: #111827; }
                }
            `}</style>

        </div>
    );
}
