"use client";

import { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { FiPlus, FiEdit, FiTrash2, FiLoader, FiX, FiSearch, FiChevronUp, FiChevronDown, FiAlertTriangle, FiEye } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

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

export default function PrestasiPage() {
    const [santriAsuhan, setSantriAsuhan] = useState([]);
    const [santriLainnya, setSantriLainnya] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [filters, setFilters] = useState({ search: '' });
    const [sort, setSort] = useState({ key: 'tanggal', order: 'DESC' });
    const [activeTab, setActiveTab] = useState('asuhan');
    const { token } = useAuth();

    const fetchData = useCallback(debounce(async (currentFilters, currentSort, authToken) => {
        if (!authToken) {
            setError("Sesi tidak valid.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const params = new URLSearchParams({ sortKey: currentSort.key, sortOrder: currentSort.order, ...currentFilters });
        try {
            const response = await fetch(`${backendUrl}/api/prestasi-wk?${params.toString()}`, { headers: { 'x-access-token': authToken } });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Gagal mengambil data');
            }
            const { santriAsuhan, santriLainnya } = await response.json();
            setSantriAsuhan(santriAsuhan);
            setSantriLainnya(santriLainnya);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, 300), []);

    useEffect(() => {
        if (token) {
            fetchData(filters, sort, token);
        }
    }, [filters, sort, token, fetchData]);

    const handleSort = (key) => setSort(prev => ({ key, order: prev.key === key && prev.order === 'ASC' ? 'DESC' : 'ASC' }));
    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const closeModal = () => setModalState({ type: null, data: null });

    const recordsToShow = activeTab === 'asuhan' ? santriAsuhan : santriLainnya;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <Header onAdd={() => setModalState({ type: 'add' })} filters={filters} onFilterChange={handleFilterChange} />
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} countAsuhan={santriAsuhan.length} countLain={santriLainnya.length} />
            <PrestasiTable 
                records={recordsToShow} 
                isLoading={isLoading} 
                error={error} 
                sort={sort} 
                onSort={handleSort} 
                onView={(data) => setModalState({ type: 'view', data })}
                onEdit={(data) => setModalState({ type: 'edit', data })} 
                onDelete={(data) => setModalState({ type: 'delete', data })}
                isAsuhanTab={activeTab === 'asuhan'}
            />
            <FormModal isOpen={modalState.type === 'add' || modalState.type === 'edit'} data={modalState.data} onClose={closeModal} onSuccess={() => fetchData(filters, sort, token)} token={token} />
            <DeleteModal isOpen={modalState.type === 'delete'} data={modalState.data} onClose={closeModal} onSuccess={() => fetchData(filters, sort, token)} token={token} />
            <ViewModal isOpen={modalState.type === 'view'} data={modalState.data} onClose={closeModal} />
        </div>
    );
}

const Header = ({ onAdd, filters, onFilterChange }) => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Prestasi Santri</h1>
            <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
                <FiPlus size={20} />
                <span>Tambah Prestasi</span>
            </button>
        </div>
        <div className="relative w-full md:w-auto">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" name="search" value={filters.search} onChange={onFilterChange} placeholder="Cari nama santri..." className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-gray-900" />
        </div>
    </div>
);

const Tabs = ({ activeTab, setActiveTab, countAsuhan, countLain }) => (
    <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setActiveTab('asuhan')} className={`${activeTab === 'asuhan' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Santri Asuhan <span className="bg-blue-100 text-blue-600 ml-2 px-2 py-0.5 rounded-full text-xs">{countAsuhan}</span></button>
            <button onClick={() => setActiveTab('lainnya')} className={`${activeTab === 'lainnya' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Santri Lainnya <span className="bg-gray-200 text-gray-600 ml-2 px-2 py-0.5 rounded-full text-xs">{countLain}</span></button>
        </nav>
    </div>
);

const PrestasiTable = ({ records, isLoading, error, sort, onSort, onView, onEdit, onDelete, isAsuhanTab }) => {
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                    <tr>
                        <th className="p-4 font-medium text-left">NO</th>
                        <th className="p-4 font-medium cursor-pointer text-left" onClick={() => onSort('name')}><div className="flex items-center gap-1">NAMA {sort.key === 'name' && (sort.order === 'ASC' ? <FiChevronUp /> : <FiChevronDown />)}</div></th>
                        <th className="p-4 font-medium text-left">KELAS</th>
                        <th className="p-4 font-medium text-left">KAMAR</th>
                        <th className="p-4 font-medium text-left">PRESTASI</th>
                        <th className="p-4 font-medium cursor-pointer text-left" onClick={() => onSort('tanggal')}><div className="flex items-center gap-1">TANGGAL {sort.key === 'tanggal' && (sort.order === 'ASC' ? <FiChevronUp /> : <FiChevronDown />)}</div></th>
                        <th className="p-4 font-medium text-center">AKSI</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {isLoading ? (<tr><td colSpan="7" className="text-center p-10"><FiLoader className="animate-spin inline mr-2" /> Memuat...</td></tr>) 
                    : error ? (<tr><td colSpan="7" className="text-center p-10 text-red-500">{error}</td></tr>) 
                    : records.map((item, index) => (
                        <tr key={item.id_prestasi} className="hover:bg-gray-50">
                            <td className="p-4 text-gray-600">{index + 1}</td>
                            <td className="p-4 font-semibold text-gray-800">{item.Santri.nama}</td>
                            <td className="p-4 text-gray-600">{item.Santri.Kela?.nama_kelas || '-'}</td>
                            <td className="p-4 text-gray-600">{item.Santri.Kamar?.nomor_kamar || '-'}</td>
                            <td className="p-4 text-gray-600">{item.prestasi}</td>
                            <td className="p-4 text-gray-600">{formatDate(item.tanggal)}</td>
                            <td className="p-4">
                                <div className="flex items-center justify-center gap-3">
                                    <button onClick={() => onView(item)} className="text-blue-500 hover:text-blue-600" title="Lihat Detail"><FiEye size={16} /></button>
                                    {isAsuhanTab && (
                                        <>
                                            <button onClick={() => onEdit(item)} className="text-yellow-500 hover:text-yellow-600" title="Edit"><FiEdit size={16} /></button>
                                            <button onClick={() => onDelete(item)} className="text-red-500 hover:text-red-600" title="Hapus"><FiTrash2 size={16} /></button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const FormModal = ({ isOpen, data, onClose, onSuccess, token }) => {
    const isEdit = !!data;
    const [formData, setFormData] = useState({ id_santri: '', prestasi: '', keterangan: '', tanggal: '' });
    const [santriOptions, setSantriOptions] = useState([]);
    const [santriQuery, setSantriQuery] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && token) {
            setErrors({});
            fetch(`${backendUrl}/api/prestasi-wk/options/santri`, { headers: { 'x-access-token': token } })
            .then(res => res.json()).then(setSantriOptions).catch(err => setErrors({ form: "Gagal memuat data santri." }));
            
            if (isEdit && data) {
                setFormData({
                    id_santri: data.Santri.id_santri,
                    prestasi: data.prestasi,
                    keterangan: data.keterangan || '',
                    tanggal: new Date(data.tanggal).toISOString().split('T')[0]
                });
                setSantriQuery(data.Santri.nama);
            } else {
                const today = new Date().toISOString().split('T')[0];
                setFormData({ id_santri: '', prestasi: '', keterangan: '', tanggal: today });
                setSantriQuery('');
            }
        }
    }, [data, isOpen, isEdit, token]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const validateForm = () => {
        const newErrors = {};
        if (!formData.id_santri) newErrors.id_santri = "Nama santri wajib diisi.";
        if (!formData.prestasi.trim()) newErrors.prestasi = "Prestasi wajib diisi.";
        if (!formData.tanggal) newErrors.tanggal = "Tanggal wajib diisi.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const url = isEdit ? `${backendUrl}/api/prestasi-wk/${data.id_prestasi}` : `${backendUrl}/api/prestasi-wk`;
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
            <Dialog.Title as="h3" className="text-xl font-bold text-gray-800 mb-4">{isEdit ? 'Edit' : 'Tambah'} Prestasi</Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Santri</label>
                    <Combobox name="id_santri" value={formData.id_santri} onChange={(val) => setFormData(p => ({...p, id_santri: val}))} disabled={isEdit}>
                        <div className="relative">
                            <Combobox.Input className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 disabled:bg-gray-100" onChange={(e) => setSantriQuery(e.target.value)} displayValue={(id) => santriOptions.find(s => s.id_santri === id)?.nama || ''} placeholder="Cari santri asuhan..."/>
                            <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md bg-white py-1 shadow-lg">{filteredSantri.map((santri) => (<Combobox.Option key={santri.id_santri} value={santri.id_santri} className={({ active }) => `cursor-pointer select-none relative py-2 pl-4 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>{santri.nama}</Combobox.Option>))}</Combobox.Options>
                        </div>
                    </Combobox>
                    {errors.id_santri && <p className="text-xs text-red-500 mt-1">{errors.id_santri}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prestasi</label>
                    <input type="text" name="prestasi" value={formData.prestasi} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    {errors.prestasi && <p className="text-xs text-red-500 mt-1">{errors.prestasi}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                    <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                    <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" />
                    {errors.tanggal && <p className="text-xs text-red-500 mt-1">{errors.tanggal}</p>}
                </div>
                {errors.form && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.form}</p>}
                <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button></div>
            </form>
        </Modal>
    );
};

const DeleteModal = ({ isOpen, data, onClose, onSuccess, token }) => {
    const handleDelete = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/prestasi-wk/${data.id_prestasi}`, { method: 'DELETE', headers: { 'x-access-token': token } });
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
                <Dialog.Title as="h3" className="text-lg font-bold text-gray-800 mt-4">Hapus Data Prestasi</Dialog.Title>
                <p className="text-sm text-gray-500 mt-2">Anda yakin ingin menghapus prestasi <strong>{data?.prestasi}</strong> oleh <strong>{data?.Santri?.nama}</strong>?</p>
                <div className="flex justify-center gap-4 mt-6"><button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button><button type="button" onClick={handleDelete} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button></div>
            </div>
        </Modal>
    );
};

const ViewModal = ({ isOpen, data, onClose }) => {
    if (!data) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Dialog.Title as="h3" className="text-xl font-bold text-gray-800 mb-4">Detail Prestasi</Dialog.Title>
            <div className="space-y-3 text-sm text-gray-700">
                <p><strong>Nama:</strong> {data.Santri?.nama}</p>
                <p><strong>Kelas / Kamar:</strong> {data.Santri?.Kela?.nama_kelas || '-'} / {data.Santri?.Kamar?.nomor_kamar || '-'}</p>
                <p><strong>Prestasi:</strong> {data.prestasi}</p>
                <p><strong>Tanggal:</strong> {new Date(data.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p><strong>Keterangan:</strong> {data.keterangan || '-'}</p>
            </div>
            <div className="flex justify-end mt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Tutup</button></div>
        </Modal>
    );
};
