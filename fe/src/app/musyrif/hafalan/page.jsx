// file: src/app/wali-kamar/hafalan/page.jsx
"use client";

import { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiEdit, FiEye, FiLoader, FiX, FiSearch, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen Modal
const Modal = ({ isOpen, onClose, children, size = 'max-w-lg' }) => {
    if (!isOpen) return null;
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className={`relative w-full ${size} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}>
                                <button onClick={onClose} className="absolute top-4 right-4 z-10 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                    <FiX size={20} />
                                </button>
                                {children}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default function HafalanPage() {
    const [groupedRecords, setGroupedRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [filters, setFilters] = useState({ search: '' });
    const [selectedTab, setSelectedTab] = useState(0);
    const { token } = useAuth();

    const [showNotif, setShowNotif] = useState(false);
    const [notifContent, setNotifContent] = useState({ message: '', type: 'success' });

    const fetchData = useCallback(debounce(async (currentFilters, authToken) => {
        if (!authToken) return;
        setIsLoading(true);
        const params = new URLSearchParams(currentFilters);
        try {
            const response = await fetch(`${backendUrl}/api/hafalan?${params.toString()}`, {
                headers: { 'x-access-token': authToken }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Gagal mengambil data');
            }
            const data = await response.json();
            setGroupedRecords(data);
            if (data.length > 0 && selectedTab >= data.length) {
                setSelectedTab(0);
            }
        } catch (err) {
            setNotifContent({ message: err.message, type: 'error' });
            setShowNotif(true);
            setTimeout(() => setShowNotif(false), 3000);
        } finally {
            setIsLoading(false);
        }
    }, 300), [selectedTab]);

    useEffect(() => {
        fetchData(filters, token);
    }, [filters, token, fetchData]);

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const closeModal = () => setModalState({ type: null, data: null });

    const currentRoom = groupedRecords[selectedTab];

    return (
        <div className="space-y-6">
            <TemporaryNotification show={showNotif} content={notifContent} />
            <Header filters={filters} onFilterChange={handleFilterChange} />
            
            {isLoading ? (
                <div className="text-center py-10"><FiLoader className="animate-spin inline mr-2" /> Memuat...</div>
            ) : groupedRecords.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border">
                    <TabBar tabs={groupedRecords} selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
                    {currentRoom && (
                        <div className="p-6">
                            <HafalanTable 
                                records={currentRoom.santri} 
                                onUpdate={(data) => setModalState({ type: 'update', data: {...data, kamar: currentRoom.nomor_kamar} })} 
                                onView={(data) => setModalState({ type: 'view', data: {...data, kamar: currentRoom.nomor_kamar} })}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm border">Tidak ada santri yang diasuh.</div>
            )}

            <UpdateModal isOpen={modalState.type === 'update'} data={modalState.data} onClose={closeModal} onSuccess={() => fetchData(filters, token)} token={token} setNotif={setNotifContent} setShowNotif={setShowNotif} />
            <HistoryModal isOpen={modalState.type === 'view'} data={modalState.data} onClose={closeModal} token={token} />
        </div>
    );
}

// --- Sub-Komponen Halaman ---

const Header = ({ filters, onFilterChange }) => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Setoran Hafalan Santri</h1>
        <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" name="search" value={filters.search} onChange={onFilterChange} placeholder="Cari nama santri..." className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500" />
        </div>
    </div>
);

const TabBar = ({ tabs, selectedTab, setSelectedTab }) => (
    <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
            {tabs.map((room, index) => (
                <button
                    key={room.id_kamar}
                    onClick={() => setSelectedTab(index)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        selectedTab === index
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    {room.nomor_kamar}
                    <span className={`ml-2 text-xs font-semibold py-0.5 px-2 rounded-full ${
                        selectedTab === index ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {room.santri.length}
                    </span>
                </button>
            ))}
        </nav>
    </div>
);

const HafalanTable = ({ records, onUpdate, onView }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="bg-gray-50/50 text-gray-500">
                <tr>
                    <th className="p-4 font-medium text-left w-16">NO</th>
                    <th className="p-4 font-medium text-left">NAMA</th>
                    <th className="p-4 font-medium text-left">AKSI</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {records.length === 0 ? (
                    <tr><td colSpan="3" className="text-center p-10 text-gray-500">Tidak ada santri di kamar ini atau sesuai filter.</td></tr>
                ) : records.map((item, index) => (
                    <tr key={item.id_santri} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-600">{index + 1}</td>
                        <td className="p-4 font-semibold text-gray-800">{item.nama}</td>
                        <td className="p-4">
                            <div className="flex items-center gap-4">
                                <button onClick={() => onUpdate(item)} className="text-yellow-500 hover:text-yellow-600 transition-colors" title="Update Setoran"><FiEdit size={18} /></button>
                                <button onClick={() => onView(item)} className="text-blue-500 hover:text-blue-600 transition-colors" title="Lihat Riwayat"><FiEye size={18} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const UpdateModal = ({ isOpen, data, onClose, onSuccess, token, setNotif, setShowNotif }) => {
    const [formData, setFormData] = useState({ nama: '', keterangan: '', tanggal: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({ nama: '', keterangan: '', tanggal: new Date().toISOString().split('T')[0] });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = { ...formData, id_santri: data.id_santri };
        try {
            const response = await fetch(`${backendUrl}/api/hafalan/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Gagal menyimpan data');
            }
            setNotif({ message: 'Setoran berhasil disimpan!', type: 'success' });
            setShowNotif(true);
            setTimeout(() => setShowNotif(false), 3000);
            onSuccess();
            onClose();
        } catch (error) {
            setNotif({ message: error.message, type: 'error' });
            setShowNotif(true);
            setTimeout(() => setShowNotif(false), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Dialog.Title as="h3" className="text-xl font-bold text-gray-800 mb-2">Update Setoran Hafalan</Dialog.Title>
            <p className="text-sm text-gray-500 mb-4">Santri: <strong>{data?.nama}</strong> ({data?.kamar})</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Hafalan</label>
                    <input type="text" name="nama" value={formData.nama} onChange={(e) => setFormData(p => ({...p, nama: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500" required placeholder="Contoh: Doa Harian, Hadist Arbain" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Progress</label>
                    <textarea name="keterangan" value={formData.keterangan} onChange={(e) => setFormData(p => ({...p, keterangan: e.target.value}))} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500" required placeholder="Contoh: Doa sebelum tidur, lancar"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                    <input type="date" name="tanggal" value={formData.tanggal} onChange={(e) => setFormData(p => ({...p, tanggal: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {isSubmitting && <FiLoader className="animate-spin" />}
                        Simpan
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const HistoryModal = ({ isOpen, data, onClose, token }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    useEffect(() => {
        if (isOpen && data && token) {
            setIsLoading(true);
            fetch(`${backendUrl}/api/hafalan/history/${data.id_santri}`, { headers: { 'x-access-token': token }})
                .then(res => res.json())
                .then(setHistory)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, data, token]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="max-w-2xl">
            <Dialog.Title as="h3" className="text-xl font-bold text-gray-800 mb-2">Riwayat Setoran Hafalan</Dialog.Title>
            <p className="text-sm text-gray-500 mb-4">Santri: <strong>{data?.nama}</strong> ({data?.kamar})</p>
            <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                        <tr>
                            <th className="p-3 font-medium text-left">Tanggal</th>
                            <th className="p-3 font-medium text-left">Jenis Hafalan</th>
                            <th className="p-3 font-medium text-left">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr><td colSpan="3" className="text-center p-10"><FiLoader className="animate-spin inline mr-2" /></td></tr>
                        ) : history.length === 0 ? (
                            <tr><td colSpan="3" className="text-center p-10 text-gray-500">Belum ada riwayat.</td></tr>
                        ) : (
                            history.map(item => (
                                <tr key={item.id_hafalan}>
                                    <td className="p-3 text-gray-600">{formatDate(item.tanggal)}</td>
                                    <td className="p-3 font-semibold text-gray-800">{item.nama}</td>
                                    <td className="p-3 text-gray-600">{item.keterangan}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
};

const TemporaryNotification = ({ show, content }) => (
    <Transition
        show={show}
        as={Fragment}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
    >
        <div className="fixed top-5 right-5 bg-white rounded-lg p-4 flex items-center gap-4 shadow-lg z-50 border-l-4" style={{ borderColor: content.type === 'success' ? '#22c55e' : '#ef4444' }}>
            {content.type === 'success' ? (
                <FiCheckCircle className="h-6 w-6 text-green-500" />
            ) : (
                <FiXCircle className="h-6 w-6 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-800">{content.message}</span>
        </div>
    </Transition>
);
