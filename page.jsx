"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiEdit3, FiX, FiSearch, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const StatusBadge = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full";
  const specificClasses = status ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";
  return <span className={`${baseClasses} ${specificClasses}`}>{status ? 'Aktif' : 'Tidak Aktif'}</span>;
};

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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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

const filterButtons = [ 
    { id: 'all', label: 'Semua' }, 
    { id: 1, label: '1' }, 
    { id: 2, label: '2' }, 
    { id: 3, label: '3' }, 
    { id: 4, label: '4' }, 
    { id: 5, label: '5' }, 
    { id: 6, label: '6' }, 
]; 

export default function SantriPage() {
    const { token } = useAuth();
    const [allSantri, setAllSantri] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSantri, setEditingSantri] = useState(null);
    const [kelasOptions, setKelasOptions] = useState([]);
    const [asramaOptions, setAsramaOptions] = useState([]);

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

    const fetchOptions = async () => {
        if (!token) return;
        try {
            const resKelas = await fetch(`${backendUrl}/api/santri/kelas`, { headers: { 'x-access-token': token } });
            const dataKelas = await resKelas.json();
            setKelasOptions(dataKelas);

            const resAsrama = await fetch(`${backendUrl}/api/kamar/asrama`, { headers: { 'x-access-token': token } });
            const dataAsrama = await resAsrama.json();
            setAsramaOptions(dataAsrama);
        } catch (error) {
            console.error("Gagal mengambil data options:", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSantri();
            fetchOptions();
        }
    }, [token]);

    const filteredSantri = useMemo(() => {
        return allSantri.filter(santri => {
            const matchesFilter = activeFilter === 'all' 
                ? true 
                : santri.Kela?.nama_kelas === `Kelas ${activeFilter}`;
            
            const matchesSearch = santri.nama.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesFilter && matchesSearch;
        });
    }, [allSantri, searchTerm, activeFilter]);

    const openEditModal = (santri) => {
        setEditingSantri({
            ...santri,
            status_aktif: santri.status_aktif ? 'Aktif' : 'Tidak Aktif',
            id_asrama: santri.Kamar?.Asrama?.id_asrama || '',
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingSantri(null);
    };

    const handleUpdate = async (updatedSantri) => {
        try {
            const response = await fetch(`${backendUrl}/api/santri/${updatedSantri.id_santri}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-access-token': token
                },
                body: JSON.stringify(updatedSantri)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Gagal memperbarui data');
            }
            await fetchSantri();
            closeEditModal();
        } catch (error) {
            console.error("Error updating santri:", error);
            alert(error.message);
        }
    };

    const kamarInSelectedAsrama = useMemo(() => {
        if (!editingSantri || !editingSantri.id_asrama) return [];
        const selectedAsrama = asramaOptions.find(a => a.id_asrama === parseInt(editingSantri.id_asrama));
        return selectedAsrama ? selectedAsrama.Kamars : [];
    }, [editingSantri, asramaOptions]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="relative w-full sm:max-w-xs">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Cari nama santri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                </div>
                
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
                    {filterButtons.map((filter) => (
                        <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeFilter === filter.id ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-600 hover:bg-white/60'}`}>
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="p-4 font-medium w-12 text-center">NO</th>
                            <th className="p-4 font-medium">NAMA</th>
                            <th className="p-4 font-medium">ASRAMA</th>
                            <th className="p-4 font-medium">KAMAR</th>
                            <th className="p-4 font-medium">KELAS</th>
                            <th className="p-4 font-medium">STATUS</th>
                            <th className="p-4 font-medium">AKSI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr><td colSpan="7" className="text-center p-10"><FiLoader className="animate-spin inline-block mr-2" /> Memuat data...</td></tr>
                        ) : filteredSantri.length > 0 ? (
                            filteredSantri.map((santri, index) => (
                                <tr key={santri.id_santri} className="hover:bg-gray-50">
                                    <td className="p-4 text-center text-gray-500">{index + 1}</td>
                                    <td className="p-4 font-semibold text-gray-800">{santri.nama}</td>
                                    <td className="p-4 text-gray-600">{santri.Kamar?.Asrama?.nama_gedung || '-'}</td>
                                    <td className="p-4 text-gray-600">{santri.Kamar?.nomor_kamar || '-'}</td>
                                    <td className="p-4 text-gray-600">{santri.Kela?.nama_kelas || '-'}</td>
                                    <td className="p-4"><StatusBadge status={santri.status_aktif} /></td>
                                    <td className="p-4">
                                        <button onClick={() => openEditModal(santri)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                                            <FiEdit3 size={14} /><span>Edit</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="text-center p-10 text-gray-500">Tidak ada data santri yang cocok.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingSantri && (
                <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`Edit Data: ${editingSantri.nama}`}>
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingSantri); }} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama</label>
                                <input type="text" value={editingSantri.nama} onChange={(e) => setEditingSantri({...editingSantri, nama: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Kelas</label>
                                <select value={editingSantri.id_kelas || ''} onChange={(e) => setEditingSantri({...editingSantri, id_kelas: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                                    <option value="">-- Pilih Kelas --</option>
                                    {kelasOptions.map(k => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Asrama</label>
                                <select value={editingSantri.id_asrama || ''} onChange={(e) => setEditingSantri({...editingSantri, id_asrama: e.target.value, id_kamar: ''})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                                    <option value="">-- Tanpa Asrama --</option>
                                    {asramaOptions.map(a => <option key={a.id_asrama} value={a.id_asrama}>{a.nama_gedung}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Kamar</label>
                                <select value={editingSantri.id_kamar || ''} onChange={(e) => setEditingSantri({...editingSantri, id_kamar: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" disabled={!editingSantri.id_asrama}>
                                    <option value="">-- Tanpa Kamar --</option>
                                    {kamarInSelectedAsrama.map(k => <option key={k.id_kamar} value={k.id_kamar}>{k.nomor_kamar}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select value={editingSantri.status_aktif} onChange={(e) => setEditingSantri({...editingSantri, status_aktif: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                                    <option>Aktif</option>
                                    <option>Tidak Aktif</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                            <button type="button" onClick={closeEditModal} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan Perubahan</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
