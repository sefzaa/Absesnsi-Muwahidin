// file: src/app/wali-kamar/perizinan/page.jsx
"use client";

import { useState, useEffect, Fragment, useCallback, useMemo } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { FiPlus, FiEdit, FiFileText, FiLoader, FiX, FiSearch, FiChevronUp, FiChevronDown, FiEye, FiFilter } from 'react-icons/fi';
import debounce from 'lodash/debounce';
import moment from 'moment';
import 'moment/locale/id';
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen-komponen UI
const StatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block capitalize";
    let specificClasses = "";
    switch (status) {
        case 'Disetujui WK': specificClasses = "bg-blue-100 text-blue-700"; break;
        case 'Pulang': specificClasses = "bg-yellow-100 text-yellow-700"; break;
        case 'Selesai': specificClasses = "bg-green-100 text-green-700"; break;
        case 'Terlambat': specificClasses = "bg-red-100 text-red-700"; break;
        default: specificClasses = "bg-gray-100 text-gray-700";
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

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

const FilterSection = ({ filters, onFilterChange, onClearFilters }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
        <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700">Cari Nama</label><input type="text" name="search" value={filters.search} onChange={onFilterChange} placeholder="Cari nama santri..." className="mt-1 pl-4 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900" /></div>
        <div><label className="text-sm font-medium text-gray-700">Dari Tanggal</label><input type="date" name="startDate" value={filters.startDate} onChange={onFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-900" /></div>
        <div><label className="text-sm font-medium text-gray-700">Sampai Tanggal</label><input type="date" name="endDate" value={filters.endDate} onChange={onFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-900" /></div>
        <div className="flex items-end"><button onClick={onClearFilters} className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Hapus Filter</button></div>
    </div>
);

const Tabs = ({ activeTab, setActiveTab, countAktif, countRiwayat }) => (
    <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setActiveTab('aktif')} className={`${activeTab === 'aktif' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Izin Aktif <span className="bg-blue-100 text-blue-600 ml-2 px-2 py-0.5 rounded-full text-xs">{countAktif}</span></button>
            <button onClick={() => setActiveTab('riwayat')} className={`${activeTab === 'riwayat' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Riwayat Izin <span className="bg-gray-200 text-gray-600 ml-2 px-2 py-0.5 rounded-full text-xs">{countRiwayat}</span></button>
        </nav>
    </div>
);

export default function PerizinanWaliKamarPage() {
    const [allRecords, setAllRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [filters, setFilters] = useState({ search: '', startDate: '', endDate: '' });
    const [sort, setSort] = useState({ key: 'tanggal_awal', order: 'DESC' });
    const [activeTab, setActiveTab] = useState('aktif');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const { token } = useAuth();

    const fetchData = useCallback(debounce(async (currentFilters, currentSort, authToken) => {
        if (!authToken) return;
        setIsLoading(true);
        const params = new URLSearchParams({ sortKey: currentSort.key, sortOrder: currentSort.order, ...currentFilters });
        try {
            const response = await fetch(`${backendUrl}/api/perizinan-wk?${params.toString()}`, {
                headers: { 'x-access-token': authToken }
            });
            if (!response.ok) throw new Error('Gagal mengambil data perizinan');
            setAllRecords(await response.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, 300), []);
    
    useEffect(() => {
        moment.locale('id');
        fetchData(filters, sort, token);
    }, [filters, sort, token, fetchData]);

    const { izinAktif, riwayatIzin } = useMemo(() => {
        const aktif = allRecords.filter(izin => !['Selesai', 'Terlambat'].includes(izin.status));
        const riwayat = allRecords.filter(izin => ['Selesai', 'Terlambat'].includes(izin.status));
        return { izinAktif: aktif, riwayatIzin: riwayat };
    }, [allRecords]);

    const handleSort = (key) => setSort(prev => ({ key, order: prev.key === key && prev.order === 'ASC' ? 'DESC' : 'ASC' }));
    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleClearFilters = () => setFilters({ search: '', startDate: '', endDate: '' });
    const closeModal = () => setModalState({ type: null, data: null });

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <div className="flex justify-between items-center">
                <button onClick={() => setModalState({ type: 'add', data: null })} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
                    <FiPlus size={20} /><span>Tambah Izin</span>
                </button>
                <button onClick={() => setIsFilterVisible(!isFilterVisible)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    <FiFilter size={16} /><span>Filter</span>
                </button>
            </div>

            {isFilterVisible && <FilterSection filters={filters} onFilterChange={handleFilterChange} onClearFilters={handleClearFilters} />}
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} countAktif={izinAktif.length} countRiwayat={riwayatIzin.length} />

            <PerizinanTable 
                records={activeTab === 'aktif' ? izinAktif : riwayatIzin} 
                isLoading={isLoading} 
                error={error} 
                sort={sort} 
                onSort={handleSort} 
                onEdit={(data) => setModalState({ type: 'edit', data })} 
                onLaporan={(data) => setModalState({ type: 'laporan', data })} 
                onView={(data) => setModalState({ type: 'view', data })}
                activeTab={activeTab}
            />

            <FormModal isOpen={modalState.type === 'add' || modalState.type === 'edit'} data={modalState.data} onClose={closeModal} onSuccess={() => fetchData(filters, sort, token)} token={token} />
            <LaporanModal isOpen={modalState.type === 'laporan'} data={modalState.data} onClose={closeModal} onSuccess={() => fetchData(filters, sort, token)} token={token} />
            <ViewModal isOpen={modalState.type === 'view'} data={modalState.data} onClose={closeModal} />
        </div>
    );
}

const PerizinanTable = ({ records, isLoading, error, sort, onSort, onEdit, onLaporan, onView, activeTab }) => {
    const formatDate = (dateString) => moment(dateString).format('DD MMM YYYY');
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                    <tr>
                        <th className="p-4 font-medium text-left w-16">NO</th>
                        <th className="p-4 font-medium cursor-pointer text-left" onClick={() => onSort('name')}><div className="flex items-center gap-1">NAMA {sort.key === 'name' && (sort.order === 'ASC' ? <FiChevronUp /> : <FiChevronDown />)}</div></th>
                        <th className="p-4 font-medium text-left">KAMAR</th>
                        <th className="p-4 font-medium text-left">JENIS IZIN</th>
                        <th className="p-4 font-medium cursor-pointer text-left" onClick={() => onSort('tanggal_awal')}><div className="flex items-center gap-1">TANGGAL IZIN {sort.key === 'tanggal_awal' && (sort.order === 'ASC' ? <FiChevronDown /> : <FiChevronUp />)}</div></th>
                        <th className="p-4 font-medium text-left">JAM KELUAR/MASUK</th>
                        <th className="p-4 font-medium text-left">STATUS</th>
                        <th className="p-4 font-medium text-center">AKSI</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {isLoading ? (<tr><td colSpan="8" className="text-center p-10"><FiLoader className="animate-spin inline mr-2" /> Memuat...</td></tr>) 
                    : error ? (<tr><td colSpan="8" className="text-center p-10 text-red-500">{error}</td></tr>) 
                    : records.map((item, index) => (
                        <tr key={item.id_detail_izin_asrama} className="hover:bg-gray-50">
                            <td className="p-4 text-gray-600">{index + 1}</td>
                            <td className="p-4 font-semibold text-gray-800">{item.Santri.nama}</td>
                            <td className="p-4 text-gray-600">{item.Santri.Kamar.nomor_kamar}</td>
                            <td className="p-4 text-gray-600 capitalize">{item.IzinAsrama.jenis}</td>
                            <td className="p-4 text-gray-600">{formatDate(item.tanggal_awal)}</td>
                            <td className="p-4 text-gray-600">{item.jam_keluar || '-'} / {item.jam_masuk || '-'}</td>
                            <td className="p-4"><StatusBadge status={item.status} /></td>
                            <td className="p-4">
                                <div className="flex items-center justify-center gap-3">
                                    <button onClick={() => onView(item)} className="text-blue-500 hover:text-blue-600" title="Lihat Detail"><FiEye size={16} /></button>
                                    {activeTab === 'aktif' && (
                                        <>
                                            <button onClick={() => onEdit(item)} className="text-yellow-500 hover:text-yellow-600" title="Edit"><FiEdit size={16} /></button>
                                            <button onClick={() => onLaporan(item)} className="text-green-500 hover:text-green-600" title="Laporan Kembali"><FiFileText size={16} /></button>
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
    const [formData, setFormData] = useState({ id_santri: '', id_izin_asrama: '', tanggal_awal: '', tanggal_akhir: '', keterangan: '', jam_keluar: '', jam_masuk: '' });
    const [santriOptions, setSantriOptions] = useState([]);
    const [jenisIzinOptions, setJenisIzinOptions] = useState([]);
    const [santriQuery, setSantriQuery] = useState('');
    const [errors, setErrors] = useState({});

    const selectedIzin = useMemo(() => jenisIzinOptions.find(j => j.id_izin_asrama == formData.id_izin_asrama), [formData.id_izin_asrama, jenisIzinOptions]);

    useEffect(() => {
        if (isOpen && token) {
            setErrors({});
            const fetchOptions = async () => {
                const [resSantri, resJenis] = await Promise.all([
                    fetch(`${backendUrl}/api/perizinan-wk/options/santri`, { headers: { 'x-access-token': token } }),
                    fetch(`${backendUrl}/api/perizinan-wk/options/jenis-izin`, { headers: { 'x-access-token': token } })
                ]);
                setSantriOptions(await resSantri.json());
                setJenisIzinOptions(await resJenis.json());
            };
            fetchOptions();
            
            if (isEdit && data) {
                setFormData({
                    id_santri: data.Santri.id_santri,
                    id_izin_asrama: data.IzinAsrama.id_izin_asrama,
                    tanggal_awal: moment(data.tanggal_awal).format('YYYY-MM-DD'),
                    tanggal_akhir: moment(data.tanggal_akhir).format('YYYY-MM-DD'),
                    keterangan: data.keterangan || '',
                    jam_keluar: data.jam_keluar || '',
                    jam_masuk: data.jam_masuk || ''
                });
                setSantriQuery(data.Santri.nama);
            } else {
                setFormData({ id_santri: '', id_izin_asrama: '', tanggal_awal: '', tanggal_akhir: '', keterangan: '', jam_keluar: '', jam_masuk: '' });
                setSantriQuery('');
            }
        }
    }, [data, isOpen, isEdit, token]);

    useEffect(() => {
        if (!selectedIzin || isEdit) return;

        const today = moment().format('YYYY-MM-DD');
        if (selectedIzin.jenis === 'harian') {
            setFormData(prev => ({ ...prev, tanggal_awal: today, tanggal_akhir: today }));
        } else if (selectedIzin.jenis === 'mingguan') {
            const currentDay = moment().day();
            let daysUntilThursday = 4 - currentDay;
            if (daysUntilThursday < 0) daysUntilThursday += 7;
            const nextThursday = moment().add(daysUntilThursday, 'days').format('YYYY-MM-DD');
            setFormData(prev => ({
                ...prev,
                tanggal_awal: nextThursday,
                tanggal_akhir: nextThursday,
                jam_keluar: '09:00',
                jam_masuk: '17:00'
            }));
        }
    }, [selectedIzin, isEdit]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const validateForm = () => {
        const newErrors = {};
        if (!formData.id_santri) newErrors.id_santri = "Santri harus dipilih.";
        if (!formData.id_izin_asrama) newErrors.id_izin_asrama = "Jenis izin harus dipilih.";
        if (!formData.tanggal_awal) newErrors.tanggal_awal = "Tanggal izin harus diisi.";
        if (!formData.tanggal_akhir) newErrors.tanggal_akhir = "Tanggal kembali harus diisi.";
        
        if (selectedIzin && (selectedIzin.jenis === 'harian' || selectedIzin.jenis === 'mingguan')) {
            if (!formData.jam_keluar) newErrors.jam_keluar = "Jam keluar harus diisi.";
            if (!formData.jam_masuk) newErrors.jam_masuk = "Jam masuk harus diisi.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setErrors(prev => ({ ...prev, form: "Harap lengkapi semua kolom yang wajib diisi." }));
            return;
        }
        setErrors({});
        const url = isEdit ? `${backendUrl}/api/perizinan-wk/${data.id_detail_izin_asrama}` : `${backendUrl}/api/perizinan-wk`;
        const method = isEdit ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify(formData)
            });
            const resData = await response.json();
            if (!response.ok) throw new Error(resData.message || 'Gagal menyimpan data');
            onSuccess();
            onClose();
        } catch (error) {
            setErrors({ form: error.message });
        }
    };

    const filteredSantri = santriQuery === '' ? santriOptions : santriOptions.filter(s => s.nama.toLowerCase().includes(santriQuery.toLowerCase()));

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Dialog.Title as="h3" className="text-xl font-bold text-gray-800 mb-4">{isEdit ? 'Edit' : 'Tambah'} Izin</Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Santri {errors.id_santri && <span className="text-red-500 text-xs italic">{errors.id_santri}</span>}</label>
                    <Combobox name="id_santri" value={formData.id_santri || ''} onChange={(val) => setFormData(p => ({...p, id_santri: val}))} disabled={isEdit}>
                        <div className="relative">
                            <Combobox.Input className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 disabled:bg-gray-100" onChange={(e) => setSantriQuery(e.target.value)} displayValue={(id) => santriOptions.find(s => s.id_santri === id)?.nama || santriQuery} placeholder="Cari santri..."/>
                            <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md bg-white py-1 shadow-lg">{filteredSantri.map((santri) => (<Combobox.Option key={santri.id_santri} value={santri.id_santri} className={({ active }) => `cursor-pointer select-none relative py-2 pl-4 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>{santri.nama}</Combobox.Option>))}</Combobox.Options>
                        </div>
                    </Combobox>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Izin {errors.id_izin_asrama && <span className="text-red-500 text-xs italic">{errors.id_izin_asrama}</span>}</label><select name="id_izin_asrama" value={formData.id_izin_asrama || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"><option value="">-- Pilih Jenis --</option>{jenisIzinOptions.map(j => <option key={j.id_izin_asrama} value={j.id_izin_asrama} className="capitalize">{j.jenis}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Izin {errors.tanggal_awal && <span className="text-red-500 text-xs italic">{errors.tanggal_awal}</span>}</label><input type="date" name="tanggal_awal" value={formData.tanggal_awal || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kembali {errors.tanggal_akhir && <span className="text-red-500 text-xs italic">{errors.tanggal_akhir}</span>}</label><input type="date" name="tanggal_akhir" value={formData.tanggal_akhir || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" /></div>
                </div>
                {(selectedIzin?.jenis === 'harian' || selectedIzin?.jenis === 'mingguan') && (<div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Keluar {errors.jam_keluar && <span className="text-red-500 text-xs italic">{errors.jam_keluar}</span>}</label><input type="time" name="jam_keluar" value={formData.jam_keluar || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk {errors.jam_masuk && <span className="text-red-500 text-xs italic">{errors.jam_masuk}</span>}</label><input type="time" name="jam_masuk" value={formData.jam_masuk || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" /></div></div>)}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label><textarea name="keterangan" value={formData.keterangan || ''} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"></textarea></div>
                {errors.form && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.form}</p>}
                <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button></div>
            </form>
        </Modal>
    );
};

const LaporanModal = ({ isOpen, data, onClose, onSuccess, token }) => {
    const [jamKembaliAktual, setJamKembaliAktual] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${backendUrl}/api/perizinan-wk/laporan-pulang/${data.id_detail_izin_asrama}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify({ jam_kembali_aktual: jamKembaliAktual })
            });
            if (!response.ok) throw new Error('Gagal menyimpan laporan');
            onSuccess();
            onClose();
        } catch (error) { alert(error.message); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="max-w-md">
            <Dialog.Title as="h3" className="text-xl font-bold text-gray-800 mb-2">Laporan Kembali</Dialog.Title>
            <p className="text-sm text-gray-500 mb-4">Santri: <strong>{data?.Santri?.nama}</strong></p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Kembali Aktual</label><input type="time" value={jamKembaliAktual} onChange={(e) => setJamKembaliAktual(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900" required/></div>
                <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan Laporan</button></div>
            </form>
        </Modal>
    );
};

const ViewModal = ({ isOpen, data, onClose }) => {
    if (!data) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Dialog.Title as="h3" className="text-xl font-bold text-gray-800 mb-4">Detail Perizinan</Dialog.Title>
            <div className="space-y-3 text-sm text-gray-700">
                <p><strong>Nama:</strong> {data.Santri?.nama}</p>
                <p><strong>Kelas / Kamar:</strong> {data.Santri?.Kela?.nama_kelas || '-'} / {data.Santri?.Kamar?.nomor_kamar || '-'}</p>
                <p><strong>Jenis Izin:</strong> <span className="capitalize">{data.IzinAsrama?.jenis}</span></p>
                <p><strong>Tanggal Izin:</strong> {moment(data.tanggal_awal).format('DD MMMM YYYY')}</p>
                <p><strong>Tanggal Kembali:</strong> {moment(data.tanggal_akhir).format('DD MMMM YYYY')}</p>
                <p><strong>Jam Keluar:</strong> {data.jam_keluar || '-'}</p>
                <p><strong>Jam Masuk:</strong> {data.jam_masuk || '-'}</p>
                <p><strong>Jam Kembali (Aktual):</strong> {data.jam_kembali_aktual || 'Belum kembali'}</p>
                <p><strong>Persetujuan Wali Kamar:</strong> {data.isApprove_wk ? 'Ya' : 'Tidak'}</p>
                <p><strong>Pamong:</strong> {data.pamong || '-'}</p>
                {data.nama_pamong && <p><strong>Nama Pamong:</strong> {data.nama_pamong}</p>}
                <p><strong>Keterangan:</strong> {data.keterangan || '-'}</p>
                <p><strong>Status:</strong> <StatusBadge status={data.status} /></p>
            </div>
            <div className="flex justify-end mt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Tutup</button></div>
        </Modal>
    );
};
