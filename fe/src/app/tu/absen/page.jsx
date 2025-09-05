"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useAuth } from '../../AuthContext'; 
import { Dialog, Transition } from '@headlessui/react';
import { 
    FiPlusSquare, FiEdit, FiTrash2, FiEye, FiX,
    FiChevronUp, FiChevronDown, FiLoader, FiAlertCircle, 
    FiCheckCircle
} from 'react-icons/fi';
import moment from 'moment-timezone';
import 'moment/locale/id';

moment.locale('id');

// =================================================================
// BAGIAN 1: KOMPONEN UI YANG BISA DIGUNAKAN KEMBALI (REUSABLE)
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
                    <div className="fixed inset-0 bg-black bg-opacity-60" />
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
                    <div className="fixed inset-0 bg-black bg-opacity-60" />
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

const SortIcon = ({ direction }) => {
    if (!direction) return <FiChevronDown className="inline-block ml-1 text-gray-400" />
    return direction === 'asc' ? <FiChevronUp className="inline-block ml-1" /> : <FiChevronDown className="inline-block ml-1" />;
};


// =================================================================
// BAGIAN 2: KOMPONEN UTAMA HALAMAN
// =================================================================

export default function AbsenPegawaiPage() {
    const { token } = useAuth();
    const [absensiList, setAbsensiList] = useState([]);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [jabatanList, setJabatanList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [viewHistory, setViewHistory] = useState({ pegawai: null, history: [] });
    const [viewDate, setViewDate] = useState({ month: moment().month() + 1, year: moment().year() });
    const [formData, setFormData] = useState({ id_pegawai: '', tanggal: moment().format('YYYY-MM-DD'), status: 'Hadir', jam_masuk: '', jam_keluar: '', status_jam_masuk: 'On Time', keterangan: '' });
    const [filters, setFilters] = useState({ tanggal: moment().format('YYYY-MM-DD'), id_jabatan: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'asc' });
    const [notification, setNotification] = useState({ isOpen: false, type: '', title: '', message: '' });

    // --- URUTAN FUNGSI DIPERBAIKI ---

    const showNotification = useCallback((type, title, message) => {
        setNotification({ isOpen: true, type, title, message });
    }, []);
    
    const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absen-pegawai`;

    const apiFetch = useCallback(async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const headers = { 'Content-Type': 'application/json', 'x-access-token': token, ...options.headers };
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Error ${response.status}: ${response.statusText}` }));
            throw new Error(errorData.message || 'Terjadi kesalahan pada server');
        }
        return response.json();
    }, [token]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ sortKey: sortConfig.key, sortOrder: sortConfig.direction });
            if (filters.tanggal) params.append('tanggal', filters.tanggal);
            if (filters.id_jabatan) params.append('id_jabatan', filters.id_jabatan);
            const data = await apiFetch(`/?${params.toString()}`);
            setAbsensiList(data);
        } catch (error) {
            showNotification("error", "Gagal Memuat Data", error.message);
        } finally {
            setIsLoading(false);
        }
    }, [apiFetch, filters, sortConfig, showNotification]);

    const closeNotification = useCallback(() => {
        setNotification(prev => ({ ...prev, isOpen: false }));
        if (notification.type === 'success') {
            fetchData();
        }
    }, [notification.type, fetchData]); // fetchData sekarang sudah dikenali

    // --- AKHIR PERBAIKAN URUTAN ---
    
    useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [pegawaiRes, jabatanRes] = await Promise.all([apiFetch('/pegawai'), apiFetch('/jabatan')]);
                setPegawaiList(pegawaiRes);
                setJabatanList(jabatanRes);
            } catch (error) {
                showNotification("error", "Gagal Memuat Master Data", error.message);
            }
        };
        if (token) fetchMasterData();
    }, [token, apiFetch, showNotification]);

    const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const closeModal = () => setModalState({ type: null, data: null });
    
    const openModal = (type, data = null) => {
        setModalState({ type, data });
        if (type === 'add') {
            setFormData({ id_pegawai: '', tanggal: filters.tanggal, status: 'Hadir', jam_masuk: '', jam_keluar: '', status_jam_masuk: 'On Time', keterangan: '' });
        } else if (type === 'edit' && data) {
            setFormData({ id_pegawai: data.id_pegawai, tanggal: moment(data.tanggal).format('YYYY-MM-DD'), status: data.status, jam_masuk: data.jam_masuk || '', jam_keluar: data.jam_keluar || '', status_jam_masuk: data.status_jam_masuk || 'On Time', keterangan: data.keterangan || '' });
        } else if (type === 'view' && data) {
            const today = moment();
            const initialDate = { month: today.month() + 1, year: today.year() };
            setViewDate(initialDate);
            fetchHistory(data.Pegawai, initialDate);
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
                await apiFetch(`/${modalState.data.id_absensi}`, { method: 'PUT', body: JSON.stringify(formData) });
            }
            closeModal();
            showNotification('success', 'Berhasil', 'Data absensi telah berhasil disimpan.');
        } catch (error) {
            showNotification('error', 'Gagal Menyimpan', error.message);
        }
    };

    const handleDelete = async () => {
        showNotification('loading', 'Menghapus Data', 'Harap tunggu sebentar...');
        try {
            await apiFetch(`/${modalState.data.id_absensi}`, { method: 'DELETE' });
            closeModal();
            showNotification('success', 'Berhasil Dihapus', 'Data absensi telah berhasil dihapus.');
        } catch (error) {
            showNotification('error', 'Gagal Menghapus', error.message);
        }
    };
    
    const fetchHistory = useCallback(async (pegawai, date) => {
        if (!pegawai || !date.year || !date.month) return;
        try {
            const params = new URLSearchParams({ year: date.year, month: date.month });
            const data = await apiFetch(`/history/${pegawai.id_pegawai}?${params.toString()}`);
            setViewHistory(data);
        } catch (error) {
            showNotification('error', 'Gagal Memuat Riwayat', error.message);
        }
    }, [apiFetch, showNotification]);
    
    useEffect(() => {
        if (modalState.type === 'view' && modalState.data) {
            fetchHistory(modalState.data.Pegawai, viewDate);
        }
    }, [viewDate, modalState.type, modalState.data, fetchHistory]);

    const availablePegawaiToAdd = useMemo(() => {
        const attendedPegawaiIds = new Set(absensiList.map(item => item.id_pegawai));
        return pegawaiList.filter(p => !attendedPegawaiIds.has(p.id_pegawai));
    }, [absensiList, pegawaiList]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <NotificationModal notification={notification} onClose={closeNotification} />

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex gap-4 w-full sm:w-auto">
                    <input type="date" name="tanggal" value={filters.tanggal} onChange={handleFilterChange} className="block w-44 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" />
                    <select name="id_jabatan" value={filters.id_jabatan} onChange={handleFilterChange} className="block w-48 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900">
                        <option value="">Semua Jabatan</option>
                        {jabatanList.map(j => <option key={j.id_jabatan} value={j.id_jabatan}>{j.nama_jabatan}</option>)}
                    </select>
                </div>
                <button onClick={() => openModal('add')} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto">
                    <FiPlusSquare /> <span>Tambah Absen</span>
                </button>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Daftar Absensi Pegawai</h3>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>

                            {/* --- FITUR SORTING DIKEMBALIKAN --- */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nama')}>
                                Nama <SortIcon direction={sortConfig.key === 'nama' ? sortConfig.direction : null} />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('nama_jabatan')}>
                                Jabatan <SortIcon direction={sortConfig.key === 'nama_jabatan' ? sortConfig.direction : null} />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('jam_masuk')}>
                                Jam Masuk <SortIcon direction={sortConfig.key === 'jam_masuk' ? sortConfig.direction : null} />
                            </th>

                            {/* --- FITUR SORTING DITAMBAHKAN --- */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                                Status Hadir <SortIcon direction={sortConfig.key === 'status' ? sortConfig.direction : null} />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status_jam_masuk')}>
                                Keterangan <SortIcon direction={sortConfig.key === 'status_jam_masuk' ? sortConfig.direction : null} />
                            </th>

                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan="8" className="text-center py-4"><FiLoader className="animate-spin inline-block mr-2" /> Memuat data...</td></tr>
                        ) : absensiList.length > 0 ? (
                            absensiList.map((item, index) => (
                                <tr key={item.id_absensi} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.Pegawai.nama}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Pegawai.Jabatan.nama_jabatan}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(item.tanggal).format('LL')}</td>
                                    
                                    {/* DATA UNTUK KOLOM BARU DITAMBAHKAN */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam_masuk || '-'}</td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Hadir' ? 'bg-green-100 text-green-800' : item.status === 'Sakit' ? 'bg-yellow-100 text-yellow-800' : item.status === 'Izin' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{item.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.status === 'Hadir' ? (
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status_jam_masuk === 'On Time' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                {item.status_jam_masuk}
                                            </span>
                                        ) : '-'}
                                    </td>

                                    {/* Kolom untuk data 'item.keterangan' sudah dihapus */}

                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openModal('view', item)} className="text-gray-600 hover:text-gray-900"><FiEye size={18} /></button>
                                            <button onClick={() => openModal('edit', item)} className="text-blue-600 hover:text-blue-900"><FiEdit size={18} /></button>
                                            <button onClick={() => openModal('delete', item)} className="text-red-600 hover:text-red-900"><FiTrash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="8" className="text-center py-4">Tidak ada data absensi untuk tanggal ini.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={modalState.type === 'add' || modalState.type === 'edit'} onClose={closeModal} title={modalState.type === 'add' ? 'Tambah Absensi Baru' : 'Edit Absensi'} icon={modalState.type === 'add' ? <FiPlusSquare size={20} className="text-blue-500" /> : <FiEdit size={20} className="text-blue-500" />} maxWidth="max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pegawai</label>
                        <select name="id_pegawai" value={formData.id_pegawai} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" disabled={modalState.type === 'edit'}>
                            <option value="">Pilih Pegawai</option>
                            {modalState.type === 'edit' ? (
                                <option value={modalState.data?.id_pegawai}>{modalState.data?.Pegawai.nama}</option>
                            ) : (
                                availablePegawaiToAdd.map(p => <option key={p.id_pegawai} value={p.id_pegawai}>{p.nama}</option>)
                            )}
                        </select>
                         {modalState.type === 'add' && availablePegawaiToAdd.length === 0 && (
                            <p className="mt-2 text-xs text-gray-500">Semua pegawai sudah diabsen hari ini.</p>
                         )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input type="date" name="tanggal" value={formData.tanggal} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Kehadiran</label>
                        <select name="status" value={formData.status} onChange={handleFormChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900">
                            <option value="Hadir">Hadir</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Izin">Izin</option>
                            <option value="Alpa">Alpa</option>
                        </select>
                    </div>
                    {formData.status === 'Hadir' && (
                        <>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label><input type="time" name="jam_masuk" value={formData.jam_masuk} onChange={handleFormChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Keluar</label><input type="time" name="jam_keluar" value={formData.jam_keluar} onChange={handleFormChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" /></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Jam Masuk</label>
                                <select name="status_jam_masuk" value={formData.status_jam_masuk} onChange={handleFormChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900">
                                    <option value="On Time">On Time</option>
                                    <option value="Terlambat">Terlambat</option>
                                </select>
                            </div>
                        </>
                    )}
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Lainnya</label><textarea name="keterangan" value={formData.keterangan} onChange={handleFormChange} rows="3" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900"></textarea></div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={closeModal} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">Batal</button>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Simpan</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={modalState.type === 'delete'} onClose={closeModal} title="Konfirmasi Hapus" icon={<FiAlertCircle className="text-red-500" />}>
                <p className="text-sm text-gray-600">Anda yakin ingin menghapus data absensi untuk <strong>{modalState.data?.Pegawai?.nama}</strong> pada tanggal <strong>{moment(modalState.data?.tanggal).format('LL')}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="pt-5 flex justify-end gap-3">
                    <button type="button" onClick={closeModal} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">Batal</button>
                    <button type="button" onClick={handleDelete} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md shadow-sm font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">Ya, Hapus</button>
                </div>
            </Modal>

            <Modal isOpen={modalState.type === 'view'} onClose={closeModal} title={`Riwayat Absensi: ${viewHistory.pegawai?.nama}`} icon={<FiEye className="text-blue-500"/>} maxWidth="max-w-2xl">
                 <div className="mt-4 flex items-center gap-2">
                    <p className="text-sm text-gray-600">Menampilkan riwayat untuk:</p>
                    <input type="number" value={viewDate.month} onChange={(e) => setViewDate(d => ({ ...d, month: e.target.value }))} className="block w-28 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" placeholder="Bulan" min="1" max="12" />
                    <input type="number" value={viewDate.year} onChange={(e) => setViewDate(d => ({ ...d, year: e.target.value }))} className="block w-32 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-base px-4 py-2.5 text-gray-900" placeholder="Tahun" />
                </div>
                <div className="mt-4 max-h-80 overflow-y-auto pr-2">
                    <ul className="divide-y divide-gray-200">
                        {viewHistory.history?.length > 0 ? viewHistory.history.map(h => (
                            <li key={h.id_absensi} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{moment(h.tanggal).format('dddd, LL')}</p>
                                    <p className="text-sm text-gray-500">{h.keterangan || 'Tidak ada keterangan'}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${h.status === 'Hadir' ? 'bg-green-100 text-green-800' : h.status === 'Sakit' ? 'bg-yellow-100 text-yellow-800' : h.status === 'Izin' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{h.status}</span>
                            </li>
                        )) : <p className="text-center text-gray-500 py-4">Tidak ada riwayat absensi untuk periode ini.</p>}
                    </ul>
                </div>
                <div className="pt-5 flex justify-end">
                    <button type="button" onClick={closeModal} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Tutup</button>
                </div>
            </Modal>
        </div>
    );
}