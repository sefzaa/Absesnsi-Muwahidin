// file: src/app/disgiatAsrama/mingguan/page.jsx

"use client";

import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiPlus, FiX, FiEdit, FiEye, FiSearch, FiLoader, FiPrinter, FiFilter } from 'react-icons/fi';
import moment from 'moment';
import 'moment/locale/id';
// PENAMBAHAN: Import hook useAuth untuk otentikasi
import { useAuth } from '../../AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen Surat Izin Print
const SuratIzinPrintMingguan = ({ data }) => {
    if (!data) return null;

    const RandomQRCode = () => {
        const size = 25;
        const pixels = Array.from({ length: size * size }, () => Math.random() > 0.5);
        return (
            <svg width="80" height="80" viewBox={`0 0 ${size} ${size}`} className="mx-auto">
                {pixels.map((p, i) => p ? (<rect key={i} width="1" height="1" x={i % size} y={Math.floor(i / size)} fill="black"/>) : null)}
            </svg>
        );
    };

    return (
        <div className="print-only font-sans text-black">
            <style jsx global>{`
                @media print {
                    @page { size: A5 landscape; margin: 1cm; }
                    .no-print { display: none; }
                    body * { visibility: hidden; }
                    .print-only, .print-only * { visibility: visible; }
                    .print-only { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
            <div className="w-full">
                <div className="flex items-center space-x-4 border-b-2 border-black pb-2">
                    <img src="https://placehold.co/80x80/000000/FFFFFF?text=LOGO" alt="Logo Pesantren" className="h-16 w-16"/>
                    <div className="text-center flex-grow">
                        <h1 className="text-lg font-bold uppercase">YAYASAN PENDIDIKAN ISLAM XYZ</h1>
                        <h2 className="text-xl font-extrabold uppercase">PONDOK PESANTREN MODERN</h2>
                        <p className="text-[8px]">Jl. Pendidikan No. 1, Kota Santri, Kode Pos 12345, Telp: (021) 123-4567</p>
                    </div>
                </div>
                <div className="text-center mt-4">
                    <h3 className="text-base font-bold underline">SURAT IZIN MINGGUAN</h3>
                    <p className="text-xs">Nomor: {String(data.id_detail_izin_asrama).padStart(4, '0')}/IZN-ASR/VIII/{moment(data.tanggal_awal).format('YYYY')}</p>
                </div>
                <div className="mt-4 text-xs">
                    <p>Dengan ini, Pengasuhan Asrama memberikan izin kepada santri tersebut di bawah ini:</p>
                    <table className="my-2 text-left w-full border-collapse border border-black">
                        <tbody>
                            <tr><td className="py-1 px-2 border border-black w-1/3 bg-gray-100 font-bold">Nama</td><td className="py-1 px-2 border border-black w-2/3">{data.Santri?.nama}</td></tr>
                            <tr><td className="py-1 px-2 border border-black bg-gray-100 font-bold">Kelas / Kamar</td><td className="py-1 px-2 border border-black">{data.Santri?.Kela?.nama_kelas || '-'} / {data.Santri?.Kamar?.nomor_kamar || '-'}</td></tr>
                            <tr><td className="py-1 px-2 border border-black bg-gray-100 font-bold">Keperluan</td><td className="py-1 px-2 border border-black">{data.keterangan || '-'}</td></tr>
                            <tr><td className="py-1 px-2 border border-black bg-gray-100 font-bold">Tanggal Izin</td><td className="py-1 px-2 border border-black">{moment(data.tanggal_awal).format('dddd, DD MMMM YYYY')}</td></tr>
                            <tr><td className="py-1 px-2 border border-black bg-gray-100 font-bold">Jam Keluar / Batas Kembali</td><td className="py-1 px-2 border border-black">{data.jam_keluar} WIB / {data.jam_masuk} WIB</td></tr>
                            <tr><td className="py-1 px-2 border border-black bg-gray-100 font-bold">Pamong</td><td className="py-1 px-2 border border-black">{data.pamong} ({data.nama_pamong || 'Ybs'})</td></tr>
                        </tbody>
                    </table>
                    <p className="mt-2 text-[10px] italic">* Surat ini harap dibawa dan ditunjukkan kepada petugas keamanan saat keluar dan masuk gerbang.</p>
                </div>
                <div className="mt-4 flex justify-between items-end">
                    <div className="text-center">
                        <RandomQRCode />
                        <p className="text-[8px] font-mono">{data.id_detail_izin_asrama}-{moment().unix()}</p>
                    </div>
                    <div className="text-center text-xs">
                        <p>Kota Santri, {moment().format('DD MMMM YYYY')}</p>
                        <p>Pengasuhan Asrama,</p>
                        <div className="h-12"></div>
                        <p className="font-bold underline">(.........................)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Modal = ({ isOpen, onClose, children, maxWidth = 'max-w-lg' }) => {
    if (!isOpen) return null;
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-40" /></Transition.Child>
                <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center"><Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"><Dialog.Panel className={`w-full ${maxWidth} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}>{children}</Dialog.Panel></Transition.Child></div></div>
            </Dialog>
        </Transition>
    );
};
const StatusBadge = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block";
    let specificClasses = "bg-gray-100 text-gray-700";
    switch (status?.toLowerCase()) {
        case 'selesai': specificClasses = "bg-green-100 text-green-700"; break;
        case 'pulang': specificClasses = "bg-blue-100 text-blue-700"; break;
        case 'terlambat': specificClasses = "bg-red-100 text-red-700"; break;
        case 'disetujui disgiat': specificClasses = "bg-teal-100 text-teal-700"; break;
        case 'disetujui wk': specificClasses = "bg-purple-100 text-purple-700"; break;
        case 'diajukan': specificClasses = "bg-yellow-100 text-yellow-700"; break;
    }
    return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};
const SearchableSelect = ({ options, onSelect, placeholder, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const filteredOptions = useMemo(() => {
        if (!value) return options;
        return options.filter(option => option.nama.toLowerCase().includes(value.toLowerCase()));
    }, [value, options]);
    const handleSelect = (option) => {
        onChange(option.nama);
        onSelect(option.id_santri);
        setIsOpen(false);
    };
    const handleInputChange = (e) => {
        onChange(e.target.value);
        onSelect('');
    };
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input type="text" placeholder={placeholder} value={value} onChange={handleInputChange} onFocus={() => setIsOpen(true)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
            {isOpen && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (<li key={option.id_santri} onClick={() => handleSelect(option)} className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-900">{option.nama}</li>))
                    ) : (<li className="px-3 py-2 text-gray-500">Tidak ada hasil</li>)}
                </ul>
            )}
        </div>
    );
};


export default function MingguanPage() {
    const [izinList, setIzinList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [formData, setFormData] = useState({});
    const [santriList, setSantriList] = useState([]);
    const [santriSearch, setSantriSearch] = useState('');
    const [dataToPrint, setDataToPrint] = useState(null);
    const [activeTab, setActiveTab] = useState('aktif');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [filters, setFilters] = useState({ search: '', startDate: '', endDate: '' });

    // PENAMBAHAN: Ambil token dari context
    const { token } = useAuth();

    const pamongOptions = ['Orang Tua', 'Kerabat', 'Sendiri', 'Wali Kamar', 'Lainnya'];
    
    const fetchData = async () => {
        // PENAMBAHAN: Tambahkan guard clause
        if (!token) return;
        setIsLoading(true);
        try {
            const query = new URLSearchParams(filters).toString();
            // PERBAIKAN: Tambahkan header otentikasi
            const response = await fetch(`${backendUrl}/api/perizinan-dga/mingguan?${query}`, {
                headers: { 'x-access-token': token }
            });
            if (!response.ok) throw new Error('Gagal mengambil data');
            const data = await response.json();
            setIzinList(data);
        } catch (error) { console.error(error); } 
        finally { setIsLoading(false); }
    };

    const fetchSantriList = async () => {
        // PENAMBAHAN: Tambahkan guard clause
        if (!token) return;
        try {
            // PERBAIKAN: Tambahkan header otentikasi
            const response = await fetch(`${backendUrl}/api/perizinan-dga/santri-list`, {
                headers: { 'x-access-token': token }
            });
            const data = await response.json();
            setSantriList(data);
        } catch (error) { console.error("Gagal mengambil daftar santri:", error); }
    };

    // PERBAIKAN: Buat useEffect bergantung pada token
    useEffect(() => {
        moment.locale('id');
        if(token) {
            fetchSantriList();
        }
    }, [token]);
    
    useEffect(() => {
        if (token) {
            const delayDebounceFn = setTimeout(() => {
                fetchData();
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [filters, token]); // Tambahkan token sebagai dependency
    
    useEffect(() => {
        if (dataToPrint) {
            setTimeout(() => { window.print(); setDataToPrint(null); }, 100);
        }
    }, [dataToPrint]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ search: '', startDate: '', endDate: '' });
    };

    const { izinAktif, riwayatIzin } = useMemo(() => {
        const aktif = izinList.filter(izin => !['Selesai', 'Terlambat'].includes(izin.status));
        const riwayat = izinList.filter(izin => ['Selesai', 'Terlambat'].includes(izin.status));
        return { izinAktif: aktif, riwayatIzin: riwayat };
    }, [izinList]);

    const IzinTable = ({ data }) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500">
                    <tr>
                        <th className="p-4 font-medium">NAMA</th>
                        <th className="p-4 font-medium">KELAS</th>
                        <th className="p-4 font-medium">TANGGAL IZIN</th>
                        <th className="p-4 font-medium">JAM KELUAR/MASUK</th>
                        <th className="p-4 font-medium">STATUS</th>
                        <th className="p-4 font-medium text-center">AKSI</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {isLoading ? (<tr><td colSpan="6" className="text-center p-10"><FiLoader className="animate-spin inline-block mr-2" /> Memuat...</td></tr>) 
                    : data.length === 0 ? (<tr><td colSpan="6" className="text-center p-10 text-gray-500">Tidak ada data.</td></tr>)
                    : data.map((izin) => (
                        <tr key={izin.id_detail_izin_asrama} className="hover:bg-gray-50">
                            <td className="p-4 font-semibold text-gray-800">{izin.Santri?.nama}</td>
                            <td className="p-4 text-gray-600">{izin.Santri?.Kela?.nama_kelas || '-'}</td>
                            <td className="p-4 text-gray-600">{moment(izin.tanggal_awal).format('DD MMM YYYY')}</td>
                            <td className="p-4 text-gray-600">{izin.jam_keluar} / {izin.jam_masuk}</td>
                            <td className="p-4"><StatusBadge status={izin.status} /></td>
                            <td className="p-4">
                                <div className="flex justify-center items-center gap-2">
                                    <button onClick={() => openModal('view', izin)} className="p-2 text-gray-500 hover:text-blue-600 transition-colors" title="Lihat Detail"><FiEye size={16} /></button>
                                    <button onClick={() => openModal('edit', izin)} className="p-2 text-gray-500 hover:text-yellow-600 transition-colors" title="Edit Izin"><FiEdit size={16} /></button>
                                    <button onClick={() => handlePrint(izin)} className="p-2 text-gray-500 hover:text-red-600 transition-colors" title="Cetak Surat"><FiPrinter size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const handlePrint = (izin) => setDataToPrint(izin);

    const openModal = (type, data = null) => {
        setModalState({ type, data });
        if (type === 'add') {
            moment.locale('id');
            let today = moment();
            let kamis = today.clone().day(4);
            if (today.day() > 4) kamis.add(1, 'week');
            setFormData({
                id_izin_asrama: 3,
                id_santri: '', 
                tanggal_awal: kamis.format('YYYY-MM-DD'), 
                tanggal_akhir: kamis.format('YYYY-MM-DD'),
                jam_keluar: '09:00',
                jam_masuk: '17:00',
                keterangan: '', 
                pamong: '', 
                pamong_lainnya: '', 
                nama_pamong: '',
            });
            setSantriSearch('');
        } else if (type === 'edit' || type === 'view') {
            const isLainnya = !pamongOptions.includes(data.pamong);
            setFormData({
                ...data,
                tanggal_awal: moment(data.tanggal_awal).format('YYYY-MM-DD'),
                tanggal_akhir: moment(data.tanggal_akhir).format('YYYY-MM-DD'),
                pamong: isLainnya ? 'Lainnya' : data.pamong,
                pamong_lainnya: isLainnya ? data.pamong : '',
                nama_pamong: data.nama_pamong || '',
            });
        }
    };

    const closeModal = () => setModalState({ type: null, data: null });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // PENAMBAHAN: Tambahkan guard clause
        if (!token) return alert('Sesi tidak valid, silakan login ulang.');
        
        const isEdit = modalState.type === 'edit';
                // --- ▼▼▼ PERUBAHAN URL ▼▼▼ ---
        const url = isEdit ? `${backendUrl}/api/perizinan-dga/${formData.id_detail_izin_asrama}` : `${backendUrl}/api/perizinan-dga`;
        // --- ▲▲▲ AKHIR PERUBAHAN ---
        const method = isEdit ? 'PUT' : 'POST';
        try {
            // PERBAIKAN: Tambahkan header otentikasi
            const response = await fetch(url, { 
                method, 
                headers: { 
                    'Content-Type': 'application/json',
                    'x-access-token': token 
                }, 
                body: JSON.stringify(formData) 
            });
            if (!response.ok) throw new Error('Gagal menyimpan data');
            await fetchData();
            closeModal();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    return (
        <>
            <div className="no-print bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => openModal('add')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <FiPlus size={20} />
                        <span>Tambah Izin Mingguan</span>
                    </button>
                    <button onClick={() => setIsFilterVisible(!isFilterVisible)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <FiFilter size={16} />
                        <span>Filter</span>
                    </button>
                </div>

                {isFilterVisible && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium text-gray-700">Cari Nama</label>
                            <input type="text" name="search" placeholder="Cari nama santri..." value={filters.search} onChange={handleFilterChange} className="mt-1 pl-4 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Dari Tanggal</label>
                            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Sampai Tanggal</label>
                            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleClearFilters} className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Hapus Filter</button>
                        </div>
                    </div>
                )}
                
                <div>
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('aktif')} className={`${activeTab === 'aktif' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Izin Aktif <span className="bg-blue-100 text-blue-600 ml-2 px-2 py-0.5 rounded-full text-xs">{izinAktif.length}</span>
                            </button>
                            <button onClick={() => setActiveTab('riwayat')} className={`${activeTab === 'riwayat' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Riwayat Izin <span className="bg-gray-200 text-gray-600 ml-2 px-2 py-0.5 rounded-full text-xs">{riwayatIzin.length}</span>
                            </button>
                        </nav>
                    </div>
                    <div className="mt-4">
                        {activeTab === 'aktif' ? <IzinTable data={izinAktif} /> : <IzinTable data={riwayatIzin} />}
                    </div>
                </div>

                <Modal isOpen={modalState.type !== null} onClose={closeModal}>
                    {modalState.type && (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <Dialog.Title as="h3" className="text-xl font-bold text-gray-800">
                                    {modalState.type === 'view' ? 'Detail Izin Mingguan' : modalState.type === 'edit' ? 'Edit Izin Mingguan' : 'Tambah Izin Mingguan'}
                                </Dialog.Title>
                                <button onClick={closeModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><FiX size={24} /></button>
                            </div>
                            {modalState.type === 'view' ? (
                                <div className="space-y-3 text-gray-700">
                                    <p><strong>Nama:</strong> {formData.Santri?.nama}</p>
                                    <p><strong>Kelas / Kamar:</strong> {formData.Santri?.Kela?.nama_kelas || '-'} / {formData.Santri?.Kamar?.nomor_kamar || '-'}</p>
                                    <p><strong>Tanggal Izin:</strong> {moment(formData.tanggal_awal).format('DD MMMM YYYY')}</p>
                                    <p><strong>Jam Keluar (Rencana):</strong> {formData.jam_keluar}</p>
                                    <p><strong>Jam Masuk (Rencana):</strong> {formData.jam_masuk}</p>
                                    <p><strong>Jam Kembali (Aktual):</strong> {formData.jam_kembali_aktual || 'Belum kembali'}</p>
                                    <p><strong>Persetujuan Wali Kamar:</strong> {formData.isApprove_wk ? 'Ya' : 'Tidak'}</p>
                                    <p><strong>Pamong:</strong> {formData.pamong}</p>
                                    {formData.nama_pamong && <p><strong>Nama Pamong:</strong> {formData.nama_pamong}</p>}
                                    <p><strong>Keterangan:</strong> {formData.keterangan || '-'}</p>
                                    <p><strong>Status:</strong> <StatusBadge status={formData.status} /></p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {modalState.type === 'add' && (<div><label className="block text-sm font-medium text-gray-700">Santri</label><SearchableSelect options={santriList} onSelect={(id) => handleFormChange({ target: { name: 'id_santri', value: id } })} placeholder="Cari nama santri..." value={santriSearch} onChange={setSantriSearch} /></div>)}
                                    <div><label className="block text-sm font-medium text-gray-700">Tanggal Izin</label><input type="text" value={moment(formData.tanggal_awal).format('dddd, DD MMM YYYY')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500" readOnly /></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700">Jam Keluar</label><input type="time" name="jam_keluar" value={formData.jam_keluar || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" required /></div>
                                        <div><label className="block text-sm font-medium text-gray-700">Jam Kembali</label><input type="time" name="jam_masuk" value={formData.jam_masuk || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" required /></div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-700">Pamong</label><select name="pamong" value={formData.pamong || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" required><option value="" disabled>-- Pilih Pamong --</option>{pamongOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                                    {formData.pamong === 'Lainnya' && (<div><label className="block text-sm font-medium text-gray-700">Sebutkan Hubungan Lainnya</label><input type="text" name="pamong_lainnya" value={formData.pamong_lainnya || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" placeholder="Contoh: Wali Kelas" required /></div>)}
                                    {['Kerabat', 'Lainnya'].includes(formData.pamong) && (<div><label className="block text-sm font-medium text-gray-700">Nama Pamong</label><input type="text" name="nama_pamong" value={formData.nama_pamong || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" placeholder="Masukkan nama lengkap pamong" required /></div>)}
                                    <div><label className="block text-sm font-medium text-gray-700">Keterangan</label><textarea name="keterangan" value={formData.keterangan || ''} onChange={handleFormChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"></textarea></div>
                                    {modalState.type === 'edit' && (<div><label className="block text-sm font-medium text-gray-700">Status</label><select name="status" value={formData.status || ''} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"><option>Disetujui WK</option><option>Disetujui Disgiat</option><option>Selesai</option><option>Terlambat</option></select></div>)}
                                    <div className="flex justify-end gap-3 pt-4 border-t mt-6"><button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Batal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button></div>
                                </form>
                            )}
                        </>
                    )}
                </Modal>
            </div>
            <SuratIzinPrintMingguan data={dataToPrint} />
        </>
    );
}