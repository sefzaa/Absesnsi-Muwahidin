"use client";

import { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { FiPlus, FiEdit, FiTrash2, FiLoader, FiX, FiSearch, FiChevronUp, FiChevronDown, FiAlertTriangle, FiFilter } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen Modal
const Modal = ({ isOpen, onClose, children, size = 'max-w-lg' }) => {
    if (!isOpen) return null;
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30 backdrop-blur-sm" /></Transition.Child>
                <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center"><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"><Dialog.Panel className={`w-full ${size} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}>{children}</Dialog.Panel></Transition.Child></div></div>
            </Dialog>
        </Transition>
    );
};

export default function PelanggaranWaliKamarPage() {
    const [santriAsuhan, setSantriAsuhan] = useState([]);
    const [santriLain, setSantriLain] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [filters, setFilters] = useState({ search: '', jenis: '', startDate: '', endDate: '', kelas: '' });
    const [activeTab, setActiveTab] = useState('asuhan');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [jenisOptions, setJenisOptions] = useState([]);
    const [kelasOptions, setKelasOptions] = useState([]);
    const [sort, setSort] = useState({ key: 'tanggal', order: 'DESC' });
    const { token } = useAuth();

    const fetchData = useCallback(debounce(async (currentFilters, currentSort, authToken) => {
        if (!authToken) {
            setError("Sesi tidak valid.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const activeFilters = Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v));
        const params = new URLSearchParams({
            ...activeFilters,
            sortKey: currentSort.key,
            sortOrder: currentSort.order,
        });
        
        try {
            const response = await fetch(`${backendUrl}/api/pelanggaran-wk/records?${params.toString()}`, {
                headers: { 'x-access-token': authToken }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengambil data');
            }
            const { santriAsuhan, santriLain } = await response.json();
            setSantriAsuhan(santriAsuhan);
            setSantriLain(santriLain);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, 500), []);

    useEffect(() => {
        if (token) {
            fetchData(filters, sort, token);
            const fetchOptions = async () => {
                try {
                    const [resJenis, resKelas] = await Promise.all([
                        fetch(`${backendUrl}/api/pelanggaran-wk/options/jenis-pelanggaran`, { headers: { 'x-access-token': token }}),
                        fetch(`${backendUrl}/api/pelanggaran-wk/options/kelas`, { headers: { 'x-access-token': token }})
                    ]);
                    setJenisOptions(await resJenis.json());
                    setKelasOptions(await resKelas.json());
                } catch {
                    setError("Gagal memuat opsi filter.");
                }
            };
            fetchOptions();
        }
    }, [filters, sort, token, fetchData]);

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleResetFilters = () => setFilters({ search: '', jenis: '', startDate: '', endDate: '', kelas: '' });
    const handleSort = (key) => setSort(prev => ({ key, order: prev.key === key && prev.order === 'ASC' ? 'DESC' : 'ASC' }));
    const closeModal = () => setModalState({ type: null, data: null });

    const recordsToShow = activeTab === 'asuhan' ? santriAsuhan : santriLain;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <Header onAdd={() => setModalState({ type: 'add' })} onToggleFilter={() => setIsFilterVisible(!isFilterVisible)} />
            
            {isFilterVisible && (
                <Filters 
                    filters={filters} 
                    onFilterChange={handleFilterChange} 
                    onResetFilters={handleResetFilters}
                    jenisOptions={jenisOptions}
                    kelasOptions={kelasOptions}
                />
            )}

            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} countAsuhan={santriAsuhan.length} countLain={santriLain.length} />
            <PelanggaranTable records={recordsToShow} isLoading={isLoading} error={error} onEdit={(data) => setModalState({ type: 'edit', data })} onDelete={(data) => setModalState({ type: 'delete', data })} sort={sort} onSort={handleSort} />
            
            <FormModal isOpen={modalState.type === 'add' || modalState.type === 'edit'} data={modalState.data} onClose={closeModal} onSuccess={() => fetchData(filters, sort, token)} token={token} jenisOptions={jenisOptions} kelasOptions={kelasOptions} />
            <DeleteModal isOpen={modalState.type === 'delete'} data={modalState.data} onClose={closeModal} onSuccess={() => fetchData(filters, sort, token)} token={token} />
        </div>
    );
}

const Header = ({ onAdd, onToggleFilter }) => (
    <div className="flex items-center justify-between">
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
            <FiPlus size={20} /><span>Input Pelanggaran</span>
        </button>
        <button onClick={onToggleFilter} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <FiFilter size={16} /><span>Filter</span>
        </button>
    </div>
);

const Filters = ({ filters, onFilterChange, onResetFilters, jenisOptions, kelasOptions }) => (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="relative md:col-span-6">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" name="search" value={filters.search} onChange={onFilterChange} placeholder="Cari nama santri..." className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
        </div>
        <select name="kelas" value={filters.kelas} onChange={onFilterChange} className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900">
            <option value="">Semua Kelas</option>
            {kelasOptions.map(k => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>)}
        </select>
        <select name="jenis" value={filters.jenis} onChange={onFilterChange} className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900">
            <option value="">Semua Jenis Pelanggaran</option>
            {jenisOptions.map(j => <option key={j.id_pelanggaran} value={j.id_pelanggaran}>{j.nama}</option>)}
        </select>
        <input type="date" name="startDate" value={filters.startDate} onChange={onFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
        <input type="date" name="endDate" value={filters.endDate} onChange={onFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
        <button onClick={onResetFilters} className="md:col-span-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Reset Filter</button>
    </div>
);

const Tabs = ({ activeTab, setActiveTab, countAsuhan, countLain }) => (
    <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setActiveTab('asuhan')} className={`${activeTab === 'asuhan' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Santri Asuhan <span className="bg-blue-100 text-blue-600 ml-2 px-2 py-0.5 rounded-full text-xs">{countAsuhan}</span></button>
            <button onClick={() => setActiveTab('lain')} className={`${activeTab === 'lain' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Santri Lain <span className="bg-gray-200 text-gray-600 ml-2 px-2 py-0.5 rounded-full text-xs">{countLain}</span></button>
        </nav>
    </div>
);

const PelanggaranTable = ({ records, isLoading, error, onEdit, onDelete, sort, onSort }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
                <tr>
                    <th className="p-4 font-medium text-left">NO</th>
                    <th className="p-4 font-medium text-left">NAMA SANTRI</th>
                    <th className="p-4 font-medium text-left">KELAS</th>
                    <th className="p-4 font-medium text-left">KAMAR</th>
                    <th className="p-4 font-medium text-left">PELANGGARAN</th>
                    <th className="p-4 font-medium cursor-pointer text-left" onClick={() => onSort('tanggal')}>
                        <div className="flex items-center gap-1">TANGGAL {sort.key === 'tanggal' && (sort.order === 'ASC' ? <FiChevronUp /> : <FiChevronDown />)}</div>
                    </th>
                    <th className="p-4 font-medium text-left">AKSI</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {isLoading ? (<tr><td colSpan="7" className="text-center p-10"><FiLoader className="animate-spin inline mr-2" /> Memuat...</td></tr>)
                : error ? (<tr><td colSpan="7" className="text-center p-10 text-red-500">{error}</td></tr>)
                : records.map((item, index) => (
                    <tr key={item.id_detail_pelanggaran} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-600">{index + 1}</td>
                        <td className="p-4 font-semibold text-gray-800">{item.Santri.nama}</td>
                        <td className="p-4 text-gray-600">{item.Santri.Kela?.nama_kelas || '-'}</td>
                        <td className="p-4 text-gray-600">{item.Santri.Kamar?.nomor_kamar || '-'}</td>
                        <td className="p-4 text-gray-600">{item.PelanggaranAsrama.nama}</td>
                        <td className="p-4 text-gray-600">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <button onClick={() => onEdit(item)} className="text-yellow-500 hover:text-yellow-600"><FiEdit size={16} /></button>
                                <button onClick={() => onDelete(item)} className="text-red-500 hover:text-red-600"><FiTrash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const FormModal = ({ isOpen, data, onClose, onSuccess, token, jenisOptions, kelasOptions }) => {
    const isEdit = !!data;
    const [formData, setFormData] = useState({ id_santri: '', id_pelanggaran: '', pembinaan: '', keterangan: '' });
    const [selectedKelas, setSelectedKelas] = useState('');
    const [santriOptions, setSantriOptions] = useState([]);
    const [santriQuery, setSantriQuery] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const resetForm = () => {
            setFormData({ id_santri: '', id_pelanggaran: '', pembinaan: '', keterangan: '' });
            setSelectedKelas('');
            setSantriOptions([]);
            setSantriQuery('');
        };

        if (isOpen) {
            if (isEdit && data) {
                setFormData({
                    id_santri: data.Santri?.id_santri || '',
                    id_pelanggaran: data.PelanggaranAsrama?.id_pelanggaran || '',
                    pembinaan: data.pembinaan || '',
                    keterangan: data.keterangan || ''
                });
                setSantriQuery(data.Santri?.nama || '');
            } else {
                resetForm();
            }
        }
    }, [data, isOpen, isEdit]);

    useEffect(() => {
        if (selectedKelas && token) {
            fetch(`${backendUrl}/api/pelanggaran-wk/options/santri/${selectedKelas}`, { headers: { 'x-access-token': token } })
                .then(res => res.json())
                .then(setSantriOptions)
                .catch(err => setErrors({ form: "Gagal memuat data santri." }));
        } else {
            setSantriOptions([]);
        }
        setFormData(prev => ({ ...prev, id_santri: '' }));
    }, [selectedKelas, token]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isEdit ? `${backendUrl}/api/pelanggaran-wk/records/${data.id_detail_pelanggaran}` : `${backendUrl}/api/pelanggaran-wk/records`;
        const method = isEdit ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal menyimpan data');
            }
            onSuccess();
            onClose();
        } catch (error) {
            setErrors({ form: error.message });
        }
    };

    const filteredSantri = santriQuery === '' ? santriOptions : santriOptions.filter(s => s.nama.toLowerCase().includes(santriQuery.toLowerCase()));

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Dialog.Title as="h3" className="text-xl font-bold text-gray-800 mb-4">{isEdit ? 'Edit' : 'Tambah'} Pelanggaran</Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
                {!isEdit && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" required>
                            <option value="">-- Pilih Kelas --</option>
                            {kelasOptions.map(k => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>)}
                        </select>
                    </div>
                )}
                <Combobox name="id_santri" value={formData.id_santri} onChange={(val) => setFormData(p => ({...p, id_santri: val}))} disabled={isEdit || !selectedKelas}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Santri</label>
                    <div className="relative">
                        <Combobox.Input className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 disabled:bg-gray-100" onChange={(e) => setSantriQuery(e.target.value)} displayValue={(id) => santriOptions.find(s => s.id_santri === id)?.nama || santriQuery} placeholder="Pilih kelas terlebih dahulu..."/>
                        <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md bg-white py-1 shadow-lg">{filteredSantri.map((santri) => (<Combobox.Option key={santri.id_santri} value={santri.id_santri} className={({ active }) => `cursor-pointer select-none relative py-2 pl-4 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>{santri.nama}</Combobox.Option>))}</Combobox.Options>
                    </div>
                </Combobox>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Pelanggaran</label>
                    <select name="id_pelanggaran" value={formData.id_pelanggaran} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" required>
                        <option value="">-- Pilih Jenis --</option>
                        {jenisOptions.map(j => <option key={j.id_pelanggaran} value={j.id_pelanggaran}>{j.nama}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bentuk Pembinaan</label>
                    <textarea name="pembinaan" value={formData.pembinaan} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" required></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (Opsional)</label>
                    <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"></textarea>
                </div>
                {errors.form && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.form}</p>}
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                </div>
            </form>
        </Modal>
    );
};

const DeleteModal = ({ isOpen, data, onClose, onSuccess, token }) => {
    const handleDelete = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/pelanggaran-wk/records/${data.id_detail_pelanggaran}`, {
                method: 'DELETE',
                headers: { 'x-access-token': token }
            });
            if (!response.ok) throw new Error('Gagal menghapus data');
            onSuccess();
            onClose();
        } catch (error) {
            alert(error.message);
        }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="max-w-md">
            <div className="text-center">
                <FiAlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <Dialog.Title as="h3" className="text-lg font-bold text-gray-800 mt-4">Hapus Data Pelanggaran</Dialog.Title>
                <p className="text-sm text-gray-500 mt-2">Anda yakin ingin menghapus catatan ini?</p>
                <div className="flex justify-center gap-4 mt-6">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button>
                    <button type="button" onClick={handleDelete} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
                </div>
            </div>
        </Modal>
    );
};
