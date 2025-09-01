"use client";

import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../AuthContext'; // Pastikan path ini benar
import { Dialog, Transition } from '@headlessui/react';
import { FiPlus, FiX, FiEdit, FiTrash2, FiAlertTriangle, FiLoader, FiHome, FiUsers, FiUserCheck, FiPlusCircle, FiTag, FiShuffle, FiUserPlus } from 'react-icons/fi';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen Modal Universal (Tidak diubah)
const Modal = ({ isOpen, onClose, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className={`w-full ${maxWidth} transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Komponen dropdown dengan fitur pencarian (Tidak diubah)
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
            <input type="text" placeholder={placeholder} value={value} onChange={handleInputChange} onFocus={() => setIsOpen(true)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" />
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

export default function ManageKamarPage() {
    const [asramaData, setAsramaData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [waliKamarList, setWaliKamarList] = useState([]);
    const [modalState, setModalState] = useState({ type: null, data: null, onConfirm: null });
    const [notification, setNotification] = useState({ isOpen: false, message: '', isError: false });
    const [newAsrama, setNewAsrama] = useState({ nama_gedung: '', jumlah_kamar: '' });
    const [santriInKamar, setSantriInKamar] = useState([]);
    const [santriTanpaKamar, setSantriTanpaKamar] = useState([]);
    const [santriToAdd, setSantriToAdd] = useState('');
    const [newlyAddedSantriId, setNewlyAddedSantriId] = useState(null);
    const [santriSearch, setSantriSearch] = useState('');
    const [keteranganKelas, setKeteranganKelas] = useState('');
    const [customKelas, setCustomKelas] = useState('');
    const kelasOptions = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Lainnya'];

    // MODIFIKASI: Gunakan hook untuk autentikasi dan routing
    const { user, token, isCheckingAuth } = useAuth();
    const router = useRouter();

    const showNotification = (message, isError = false) => {
        setNotification({ isOpen: true, message, isError });
    };

    // Fungsi untuk membuat header autentikasi
    const getAuthHeaders = () => {
        if (!token) return {};
        return { 'x-access-token': token };
    };

    // MODIFIKASI: useEffect untuk memeriksa autentikasi dan mengambil data awal
    useEffect(() => {
        // Jangan lakukan apa-apa jika masih memeriksa auth
        if (isCheckingAuth) return;

        // Jika tidak ada user setelah pemeriksaan, redirect ke halaman login
        if (!user) {
            router.push('/');
        } else {
            // Jika user ada, ambil data yang diperlukan
            fetchData();
            fetchWaliKamar();
        }
    }, [isCheckingAuth, user, token, router]);


    const fetchData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${backendUrl}/api/kamar/asrama`, {
                headers: getAuthHeaders()
            });
            if (response.status === 401) {
                showNotification("Sesi Anda telah berakhir, silakan login kembali.", true);
                // logout(); // Opsional: panggil fungsi logout dari context
                return;
            }
            if (!response.ok) throw new Error('Gagal mengambil data asrama');
            const data = await response.json();
            setAsramaData(data);
        } catch (error) {
            showNotification(error.message, true);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWaliKamar = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${backendUrl}/api/kamar/wali-kamar-list`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Gagal mengambil data wali kamar');
            const data = await response.json();
            setWaliKamarList(data);
        } catch (error) { console.error(error); }
    };

    const openModal = (type, data = null, onConfirm = null) => setModalState({ type, data, onConfirm });
    const closeModal = () => setModalState({ type: null, data: null, onConfirm: null });

    const openKamarEditModal = (kamar, event) => {
        event.stopPropagation();
        const isCustom = !kelasOptions.includes(kamar.keterangan_kelas) && kamar.keterangan_kelas;
        setKeteranganKelas(isCustom ? 'Lainnya' : kamar.keterangan_kelas || '');
        setCustomKelas(isCustom ? kamar.keterangan_kelas : '');
        openModal('kamar', kamar);
    };

    const openSantriModal = async (kamar) => {
        if (!token) return;
        setNewlyAddedSantriId(null);
        setSantriSearch('');
        openModal('santri', kamar);
        try {
            const resSantri = await fetch(`${backendUrl}/api/kamar/kamar/${kamar.id_kamar}/santri`, { headers: getAuthHeaders() });
            const dataSantri = await resSantri.json();
            setSantriInKamar(dataSantri);

            const keteranganKelasParam = kamar.keterangan_kelas ? `?keterangan_kelas=${encodeURIComponent(kamar.keterangan_kelas)}` : '';
            const resUnassigned = await fetch(`${backendUrl}/api/kamar/kamar/${kamar.id_kamar}/santri-available${keteranganKelasParam}`, { headers: getAuthHeaders() });
            const dataUnassigned = await resUnassigned.json();
            setSantriTanpaKamar(dataUnassigned);
        } catch (error) {
            showNotification("Gagal memuat data santri.", true);
        }
    };

    const handleAcakOtomatis = async (asrama) => {
        if (!token) return;
        try {
            const response = await fetch(`${backendUrl}/api/kamar/asrama/${asrama.id_asrama}/acak-otomatis`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showNotification(result.messages.join('\n'));
            await fetchData();
        } catch (error) {
            showNotification(error.message, true);
        }
    };

    const handleCreateAsrama = async (e) => {
        e.preventDefault();
        if (!token) return;
        try {
            const response = await fetch(`${backendUrl}/api/kamar/asrama`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ ...newAsrama, jumlah_kamar: parseInt(newAsrama.jumlah_kamar, 10) }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            await fetchData();
            closeModal();
            setNewAsrama({ nama_gedung: '', jumlah_kamar: '' });
            showNotification("Asrama baru berhasil dibuat.");
        } catch (error) { showNotification(error.message, true); }
    };

    const handleAddKamar = async (id_asrama) => {
        if (!token) return;
        try {
            const response = await fetch(`${backendUrl}/api/kamar/asrama/${id_asrama}/kamar`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            await fetchData();
            showNotification("Kamar baru berhasil ditambahkan.");
        } catch (error) { showNotification(error.message, true); }
    };

    const handleUpdateKamar = async (e) => {
        e.preventDefault();
        if (!token) return;
        const finalKeterangan = keteranganKelas === 'Lainnya' ? customKelas : keteranganKelas;
        try {
            const response = await fetch(`${backendUrl}/api/kamar/kamar/${modalState.data.id_kamar}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ ...modalState.data, keterangan_kelas: finalKeterangan }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            await fetchData();
            closeModal();
            showNotification("Detail kamar berhasil diperbarui.");
        } catch (error) { showNotification(error.message, true); }
    };

    const handleConfirm = async () => {
        if (modalState.onConfirm) {
            await modalState.onConfirm();
        }
        closeModal();
    };

    const confirmDelete = (type, data) => {
        const onConfirm = async () => {
            if (!token) return;
            const url = type === 'asrama' ? `${backendUrl}/api/kamar/asrama/${data.id_asrama}` : `${backendUrl}/api/kamar/kamar/${data.id_kamar}`;
            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                await fetchData();
                showNotification(`${type === 'asrama' ? 'Asrama' : 'Kamar'} berhasil dihapus.`);
            } catch (error) {
                showNotification(error.message, true);
            }
        };
        openModal('delete', { type, data }, onConfirm);
    };

    const confirmAcak = (asrama) => {
        openModal('confirmAcak', { asrama }, () => handleAcakOtomatis(asrama));
    };

    const handleAddSantriManual = async (e) => {
        e.preventDefault();
        if (!santriToAdd || !token) return;
        try {
            const response = await fetch(`${backendUrl}/api/kamar/kamar/${modalState.data.id_kamar}/santri`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ id_santri: santriToAdd }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            setNewlyAddedSantriId(parseInt(santriToAdd, 10));
            setSantriToAdd('');
            setSantriSearch('');
            await openSantriModal(modalState.data);
            await fetchData();
            setTimeout(() => setNewlyAddedSantriId(null), 3000);
        } catch (error) { showNotification(error.message, true); }
    };

    const handleRemoveSantriManual = async (id_santri) => {
        if (!token) return;
        try {
            const response = await fetch(`${backendUrl}/api/kamar/kamar/${modalState.data.id_kamar}/santri/${id_santri}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            await openSantriModal(modalState.data);
            await fetchData();
        } catch (error) { showNotification(error.message, true); }
    };

    // MODIFIKASI: Tampilkan loading spinner saat memeriksa autentikasi atau jika user belum ada
    if (isCheckingAuth || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <FiLoader className="animate-spin text-4xl text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-start mb-6">
                <button onClick={() => openModal('asrama')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    <FiPlus size={20} /><span>Tambah Asrama</span>
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-10"><FiLoader className="animate-spin inline-block text-4xl text-blue-600" /></div>
            ) : (
                <div className="space-y-8">
                    {asramaData.map(asrama => (
                        <div key={asrama.id_asrama} className="bg-white p-6 rounded-2xl shadow-md">
                            <div className="flex justify-between items-center mb-4 border-b pb-4">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><FiHome className="text-blue-500"/>{asrama.nama_gedung}</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => confirmAcak(asrama)} title="Acak Santri Otomatis" className="p-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"><FiShuffle/></button>
                                    <button onClick={() => handleAddKamar(asrama.id_asrama)} title="Tambah Kamar" className="p-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"><FiPlusCircle/></button>
                                    <button onClick={() => confirmDelete('asrama', asrama)} title="Hapus Asrama" className="p-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"><FiTrash2/></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {asrama.Kamars.map(kamar => (
                                    <div key={kamar.id_kamar} className="border border-gray-200 rounded-lg p-4 space-y-2 bg-gray-50 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer" onClick={() => openSantriModal(kamar)}>
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-gray-700">{kamar.nomor_kamar}</p>
                                            <div className="flex items-center text-gray-500 text-sm font-medium"><FiUsers className="mr-1"/><span>{kamar.jumlah_penghuni}/{kamar.kapasitas}</span></div>
                                        </div>
                                        <div className="text-sm space-y-1 text-gray-600">
                                            <p className="flex items-center gap-2"><FiUserCheck className="text-green-500"/> {kamar.WaliKamar ? kamar.WaliKamar.nama : <span className="text-gray-400">Belum diatur</span>}</p>
                                            <p className="flex items-center gap-2"><FiTag className="text-purple-500"/> {kamar.keterangan_kelas || <span className="text-gray-400">Belum diatur</span>}</p>
                                        </div>
                                        <div className="flex justify-end gap-1 mt-2">
                                            <button onClick={(e) => openKamarEditModal(kamar, e)} className="p-1 text-gray-500 hover:text-blue-600 transition-colors"><FiEdit size={16}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); confirmDelete('kamar', kamar) }} className="p-1 text-gray-500 hover:text-red-600 transition-colors"><FiTrash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={modalState.type === 'asrama'} onClose={closeModal}><div className="flex justify-between items-center mb-4"><Dialog.Title as="h3" className="flex items-center gap-3 text-xl font-semibold leading-6 text-gray-900"><FiPlusCircle className="text-blue-500"/>Tambah Asrama Baru</Dialog.Title><button onClick={closeModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><FiX size={24} /></button></div><form onSubmit={handleCreateAsrama} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">Nama Gedung Asrama</label><input type="text" value={newAsrama.nama_gedung} onChange={e => setNewAsrama({...newAsrama, nama_gedung: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" required /></div><div><label className="block text-sm font-medium text-gray-700">Jumlah Kamar Awal</label><input type="number" value={newAsrama.jumlah_kamar} onChange={e => setNewAsrama({...newAsrama, jumlah_kamar: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" min="1" required /></div><div className="flex justify-end gap-3 pt-4 border-t mt-6"><button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button></div></form></Modal>
            
            {modalState.type === 'kamar' && (<Modal isOpen={true} onClose={closeModal}><div className="flex justify-between items-center mb-4"><Dialog.Title as="h3" className="flex items-center gap-3 text-xl font-semibold leading-6 text-gray-900"><FiEdit className="text-yellow-500"/>Edit Detail {modalState.data.nomor_kamar}</Dialog.Title><button onClick={closeModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><FiX size={24} /></button></div><form onSubmit={handleUpdateKamar} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">Nama Kamar</label><input type="text" value={modalState.data.nomor_kamar} onChange={e => setModalState({...modalState, data: {...modalState.data, nomor_kamar: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" required /></div><div><label className="block text-sm font-medium text-gray-700">Kapasitas Santri</label><input type="number" value={modalState.data.kapasitas} onChange={e => setModalState({...modalState, data: {...modalState.data, kapasitas: e.target.value}})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" min="1" required /></div><div><label className="block text-sm font-medium text-gray-700">Wali Kamar</label><select value={modalState.data.id_wali_kamar || ''} onChange={e => setModalState({...modalState, data: {...modalState.data, id_wali_kamar: e.target.value}})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900"><option value="">-- Tidak ada --</option>{waliKamarList.map(wali => (<option key={wali.id_wali_kamar} value={wali.id_wali_kamar}>{wali.nama}</option>))}</select></div><div><label className="block text-sm font-medium text-gray-700">Penghuni Kamar</label><select value={keteranganKelas} onChange={e => setKeteranganKelas(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900"><option value="">-- Pilih Kelas --</option>{kelasOptions.map(kelas => (<option key={kelas} value={kelas}>{kelas}</option>))}</select></div>{keteranganKelas === 'Lainnya' && (<div><label className="block text-sm font-medium text-gray-700">Keterangan Lainnya</label><input type="text" value={customKelas} onChange={e => setCustomKelas(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900" placeholder="Contoh: Khusus Tahfidz" required /></div>)}<div className="flex justify-end gap-3 pt-4 border-t mt-6"><button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button></div></form></Modal>)}
            
            {modalState.type === 'santri' && (<Modal isOpen={true} onClose={closeModal} maxWidth="max-w-lg"><div className="flex justify-between items-center mb-4"><Dialog.Title as="h3" className="flex items-center gap-3 text-xl font-semibold leading-6 text-gray-900"><FiUsers className="text-green-500"/>Penghuni {modalState.data.nomor_kamar}</Dialog.Title><button onClick={closeModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100"><FiX size={24} /></button></div><div className="mt-4 max-h-60 overflow-y-auto pr-2"><div className="flex items-center px-2 py-2 text-sm font-semibold text-gray-500 bg-gray-50 rounded-t-md"><div className="w-1/12 text-center">No.</div><div className="w-8/12">Nama Santri</div><div className="w-3/12 text-center">Aksi</div></div><div className="divide-y divide-gray-100">{santriInKamar.length > 0 ? santriInKamar.map((santri, index) => (<div key={santri.id_santri} className="flex items-center p-2 hover:bg-gray-100"><div className="w-1/12 text-center text-gray-500">{index + 1}</div><div className="w-8/12 flex items-center"><span className="text-gray-800">{santri.nama}</span>{newlyAddedSantriId === santri.id_santri && (<span className="ml-2 px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Baru</span>)}</div><div className="w-3/12 flex justify-center"><button onClick={() => handleRemoveSantriManual(santri.id_santri)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><FiX size={16}/></button></div></div>)) : <p className="text-center text-gray-500 py-4">Belum ada penghuni.</p>}</div></div><form onSubmit={handleAddSantriManual} className="mt-6 pt-4 border-t"><label className="block text-sm font-medium text-gray-700 mb-2">Tambah Santri Manual</label><div className="flex gap-2"><SearchableSelect options={santriTanpaKamar} onSelect={setSantriToAdd} value={santriSearch} onChange={setSantriSearch} placeholder="Ketik untuk mencari santri..."/><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><FiUserPlus size={16}/></button></div></form></Modal>)}

            {(modalState.type === 'delete' || modalState.type === 'confirmAcak') && (<Modal isOpen={true} onClose={closeModal}><div className="relative"><button onClick={closeModal} className="absolute -top-3 -right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100"><FiX size={24} /></button><div className="text-center"><div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${modalState.type === 'delete' ? 'bg-red-100' : 'bg-purple-100'}`}><FiAlertTriangle className={`h-6 w-6 ${modalState.type === 'delete' ? 'text-red-600' : 'text-purple-600'}`} /></div><p className="mt-4 text-gray-700">{modalState.type === 'delete' ? `Apakah Anda yakin ingin menghapus ${modalState.data.data.nama_gedung || modalState.data.data.nomor_kamar}?` : `Anda yakin ingin mengacak santri di asrama ${modalState.data.asrama.nama_gedung}?`}</p><p className="text-sm text-gray-500 mt-1">{modalState.type === 'delete' ? 'Tindakan ini tidak dapat dibatalkan.' : 'Santri akan diacak berdasarkan kelas yang diatur di kamar.'}</p><div className="flex justify-center gap-4 mt-6"><button onClick={closeModal} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button><button onClick={handleConfirm} className={`px-6 py-2 text-white rounded-lg ${modalState.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}>{modalState.type === 'delete' ? 'Hapus' : 'Ya, Acak'}</button></div></div></div></Modal>)}

            <Modal isOpen={notification.isOpen} onClose={() => setNotification({ isOpen: false, message: '', isError: false })}>
                <div className="relative">
                    <button onClick={() => setNotification({ isOpen: false, message: '', isError: false })} className="absolute -top-3 -right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100"><FiX size={24} /></button>
                    <div className="text-center">
                        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${notification.isError ? 'bg-red-100' : 'bg-green-100'}`}>
                            <FiAlertTriangle className={`h-6 w-6 ${notification.isError ? 'text-red-600' : 'text-green-600'}`} />
                        </div>
                        <Dialog.Title as="h3" className="mt-4 text-lg font-semibold text-gray-900">{notification.isError ? 'Terjadi Kesalahan' : 'Informasi'}</Dialog.Title>
                        <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{notification.message}</p>
                        <div className="mt-6"><button onClick={() => setNotification({ isOpen: false, message: '', isError: false })} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Mengerti</button></div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
