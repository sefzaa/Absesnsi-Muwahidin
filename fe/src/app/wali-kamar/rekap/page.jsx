"use client";

import { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiEye, FiPrinter, FiLoader, FiX, FiSearch, FiAward, FiAlertOctagon, FiCheckCircle, FiBookOpen, FiFileText, FiUserCheck, FiUser } from 'react-icons/fi';
import debounce from 'lodash/debounce';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Komponen Modal
const Modal = ({ isOpen, onClose, children, size = 'max-w-4xl' }) => {
    if (!isOpen) return null;
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm print:hidden" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto print:static print:overflow-visible">
                    <div className="flex min-h-full items-center justify-center p-4 print:p-0">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className={`relative w-full ${size} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all print:shadow-none print:rounded-none print:p-0`}>
                                <button onClick={onClose} className="absolute top-4 right-4 z-10 p-1 rounded-full text-gray-400 hover:bg-gray-100 print:hidden"><FiX size={20} /></button>
                                {children}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default function RekapPage() {
    const [santriList, setSantriList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSantri, setSelectedSantri] = useState(null);

    useEffect(() => {
        fetch(`${backendUrl}/api/rekap-wk/santri-list`)
            .then(res => res.json())
            .then(setSantriList)
            .finally(() => setIsLoading(false));
    }, []);

    const filteredSantri = santriList.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        // --- PERUBAHAN 1: Menambahkan class `non-printable` ---
        <div className="space-y-6 non-printable">
            <Header searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} />
            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="p-4 font-medium text-left">NAMA</th>
                            <th className="p-4 font-medium text-left">AKSI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr><td colSpan="2" className="text-center p-10"><FiLoader className="animate-spin inline mr-2" /></td></tr>
                        ) : filteredSantri.map((santri) => (
                            <tr key={santri.id_santri} className="hover:bg-gray-50">
                                <td className="p-4 font-semibold text-gray-800">{santri.nama}</td>
                                <td className="p-4">
                                    <button onClick={() => setSelectedSantri(santri)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700">
                                        <FiEye size={14} />
                                        <span>Lihat Rekap</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <RekapModal isOpen={!!selectedSantri} onClose={() => setSelectedSantri(null)} santri={selectedSantri} />
        </div>
    );
}

const Header = ({ searchTerm, onSearchChange }) => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Rekapitulasi Santri</h1>
        <div className="relative w-full md:w-auto">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchTerm} onChange={onSearchChange} placeholder="Cari nama santri..." className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-gray-900" />
        </div>
    </div>
);

const RekapModal = ({ isOpen, onClose, santri }) => {
    const [rekapData, setRekapData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchData = useCallback(async () => {
        if (!santri || !isOpen) return;
        setIsLoading(true);
        
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        try {
            const response = await fetch(`${backendUrl}/api/rekap-wk/${santri.id_santri}?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) throw new Error('Gagal memuat data rekap');
            setRekapData(await response.json());
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [santri, isOpen, month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            {/* --- PERUBAHAN 2: Style cetak disederhanakan dan diperbaiki --- */}
            <style jsx global>{`
                @media print {
                    .non-printable {
                        display: none !important;
                    }
                    .printable-area {
                        display: block !important;
                        position: static !important;
                    }
                    .printable-area .overflow-y-auto {
                        overflow-y: visible !important;
                        max-height: none !important;
                    }
                }
            `}</style>
            <Modal isOpen={isOpen} onClose={onClose}>
                <div className="printable-area">
                    <Dialog.Title as="h3" className="text-2xl font-bold text-gray-800">Rekap Santri: {santri?.nama}</Dialog.Title>
                    <p className="text-sm text-gray-500 mb-4">Periode: {new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' })} {year}</p>
                    
                    <div className="flex items-center gap-4 my-4 print:hidden">
                        <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                            {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                        </select>
                        <select value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                            {Array.from({ length: 5 }, (_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
                        </select>
                        <button onClick={handlePrint} className="ml-auto flex items-center gap-2 px-3 py-2 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-800">
                            <FiPrinter size={14} /><span>Cetak</span>
                        </button>
                    </div>
                    
                    {isLoading ? <div className="text-center p-10"><FiLoader className="animate-spin inline-block"/></div> : (
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                            <RekapSection 
                                icon={FiUser} 
                                title="Data Diri"
                                data={rekapData?.santri}
                                isInfo
                            />
                            <RekapSection 
                                icon={FiUserCheck} 
                                title="Absensi" 
                                data={rekapData?.absensi?.list} 
                                performance={rekapData?.absensi?.performa}
                                renderItem={item => `${item.Kegiatan.nama} - ${item.status} (${new Date(item.tanggal).toLocaleDateString('id-ID')})`} 
                            />
                            <RekapSection icon={FiAward} title="Prestasi" data={rekapData?.prestasi} renderItem={item => `${item.prestasi} (${new Date(item.tanggal).toLocaleDateString('id-ID')})`} />
                            <RekapSection icon={FiAlertOctagon} title="Pelanggaran" data={rekapData?.pelanggaran} renderItem={item => `${item.PelanggaranAsrama.nama} (${new Date(item.tanggal).toLocaleDateString('id-ID')})`} />
                            <RekapSection icon={FiCheckCircle} title="Perizinan" data={rekapData?.perizinan} renderItem={item => `${item.IzinAsrama.jenis.toUpperCase()} - ${new Date(item.tanggal_awal).toLocaleDateString('id-ID')}`} />
                            <RekapSection icon={FiBookOpen} title="Tahfidz" data={rekapData?.tahfidz} renderItem={item => `${item.Surah.nama}: ${item.ayat}`} />
                            <RekapSection icon={FiFileText} title="Hafalan Lain" data={rekapData?.hafalan} renderItem={item => `${item.nama}: ${item.keterangan}`} />
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

const RekapSection = ({ icon: Icon, title, data, renderItem, performance, isInfo }) => {
    if (isInfo && data) {
        return (
            <div>
                <h4 className="flex items-center gap-2 font-bold text-lg text-gray-700 border-b pb-2 mb-2"><Icon /> {title}</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p className="text-gray-500">Nama Lengkap:</p><p className="font-medium text-gray-800">{data.nama}</p>
                    <p className="text-gray-500">Kelas:</p><p className="font-medium text-gray-800">{data.Kelas?.nama_kelas || '-'}</p>
                    <p className="text-gray-500">Asrama:</p><p className="font-medium text-gray-800">{data.Kamar?.Asrama?.nama_gedung || '-'}</p>
                    <p className="text-gray-500">Kamar:</p><p className="font-medium text-gray-800">{data.Kamar?.nomor_kamar || '-'}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center border-b pb-2 mb-2">
                <h4 className="flex items-center gap-2 font-bold text-lg text-gray-700"><Icon /> {title}</h4>
                {performance != null && (
                    <div className="text-right">
                        <p className="font-bold text-lg text-green-600">{performance}%</p>
                        <p className="text-xs text-gray-500">Performa</p>
                    </div>
                )}
            </div>
            {data && data.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                    {data.map((item, index) => <li key={index}>{renderItem(item)}</li>)}
                </ul>
            ) : <p className="text-sm text-gray-500">Tidak ada data untuk periode ini.</p>}
        </div>
    );
};
