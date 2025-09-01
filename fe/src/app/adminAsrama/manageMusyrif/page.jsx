"use client";

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../AuthContext.js';

// --- Komponen Ikon ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const LoaderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const Modal = ({ isOpen, onClose, children, size = 'md' }) => {
  const sizeClasses = { md: 'max-w-md', lg: 'max-w-lg', '2xl': 'max-w-2xl' };
  if (!isOpen) return null;
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default function MusyrifPage() {
  const { token } = useAuth();
  const [kelasData, setKelasData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Modal List Santri
  const [isSantriModalOpen, setIsSantriModalOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [isLoadingSantri, setIsLoadingSantri] = useState(false);

  // State Modal Assign Musyrif
  const [isMusyrifModalOpen, setIsMusyrifModalOpen] = useState(false);
  const [availableMusyrifs, setAvailableMusyrifs] = useState([]);
  const [selectedMusyrifIds, setSelectedMusyrifIds] = useState([]);
  const [isLoadingMusyrif, setIsLoadingMusyrif] = useState(false);

  // ✅ refactor: taruh di luar useEffect
  const fetchKelasData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/kelas-musyrif`, { headers: { 'x-access-token': token } });
      if (!res.ok) throw new Error('Gagal memuat data kelas');
      const data = await res.json();
      setKelasData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKelasData();
  }, [token]);

  const handleOpenSantriModal = async (kelas) => {
    setSelectedKelas(kelas);
    setIsSantriModalOpen(true);
    setIsLoadingSantri(true);
    try {
      const res = await fetch(`${backendUrl}/api/kelas-musyrif/${kelas.id_kelas}/santri`, { headers: { 'x-access-token': token } });
      if (!res.ok) throw new Error('Gagal memuat data santri');
      const data = await res.json();
      setSantriList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSantri(false);
    }
  };

  const handleOpenMusyrifModal = async (kelas) => {
    setSelectedKelas(kelas);
    setIsMusyrifModalOpen(true);
    setIsLoadingMusyrif(true);
    try {
      setSelectedMusyrifIds(kelas.musyrifs.map(m => m.id_pegawai));
      const res = await fetch(`${backendUrl}/api/musyrif/available`, { headers: { 'x-access-token': token } });
      if (!res.ok) throw new Error('Gagal memuat data musyrif');
      const data = await res.json();
      setAvailableMusyrifs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMusyrif(false);
    }
  };

  const handleMusyrifSelection = (id_pegawai) => {
    setSelectedMusyrifIds(prev =>
      prev.includes(id_pegawai)
        ? prev.filter(id => id !== id_pegawai)
        : [...prev, id_pegawai]
    );
  };

  const handleAssignMusyrif = async () => {
    setIsLoadingMusyrif(true);
    try {
      const res = await fetch(`${backendUrl}/api/kelas-musyrif/${selectedKelas.id_kelas}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': token },
        body: JSON.stringify({ musyrifIds: selectedMusyrifIds })
      });
      if (!res.ok) throw new Error('Gagal menyimpan perubahan');
      // ✅ sekarang bisa dipanggil
      await fetchKelasData();
      setIsMusyrifModalOpen(false);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsLoadingMusyrif(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoaderIcon /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Penugasan Musyrif per Kelas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kelasData.map(kelas => (
          <div key={kelas.id_kelas} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="p-5 cursor-pointer hover:bg-gray-50 flex-grow" onClick={() => handleOpenSantriModal(kelas)}>
              <h2 className="text-xl font-bold text-gray-900">{kelas.nama_kelas}</h2>
              <div className="flex items-center text-gray-600 mt-2">
                <UserIcon />
                <span className="ml-2">{kelas.jumlah_santri} Santri Aktif</span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-500">Musyrif:</h3>
                <ul className="mt-1 space-y-1">
                  {kelas.musyrifs.length > 0 ? (
                    kelas.musyrifs.map(m => <li key={m.id_pegawai} className="text-sm text-gray-800">- {m.nama}</li>)
                  ) : (
                    <li className="text-sm text-gray-400 italic">Belum ada musyrif</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="bg-gray-50 p-3">
              <button onClick={() => handleOpenMusyrifModal(kelas)} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                <EditIcon />
                Atur Musyrif
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal List Santri */}
      <Modal isOpen={isSantriModalOpen} onClose={() => setIsSantriModalOpen(false)} size="lg">
        <Dialog.Title className="text-lg font-bold text-gray-900">Daftar Santri {selectedKelas?.nama_kelas}</Dialog.Title>
        <div className="mt-4 max-h-96 overflow-y-auto">
          {isLoadingSantri ? <div className="text-center"><LoaderIcon/></div> : (
            santriList.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">No.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Santri</th>
                </tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {santriList.map((santri, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{santri.nama}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500 italic">Belum ada santri aktif</p>
            )
          )}
        </div>
      </Modal>

      {/* Modal Assign Musyrif */}
    <Modal isOpen={isMusyrifModalOpen} onClose={() => setIsMusyrifModalOpen(false)} size="lg">
    <Dialog.Title className="text-lg font-bold text-gray-900">
        Atur Musyrif untuk {selectedKelas?.nama_kelas}
    </Dialog.Title>

    <div className="mt-4">
        {isLoadingMusyrif ? (
        <div className="text-center"><LoaderIcon /></div>
        ) : (
        <select
            multiple
            value={selectedMusyrifIds}
            onChange={(e) =>
            setSelectedMusyrifIds(
                Array.from(e.target.selectedOptions, (option) => option.value)
            )
            }
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring focus:ring-blue-200"
        >
            {availableMusyrifs.map((musyrif) => (
            <option key={musyrif.id_pegawai} value={musyrif.id_pegawai}>
                {musyrif.nama}
            </option>
            ))}
        </select>
        )}
    </div>

    <div className="mt-6 flex justify-end gap-3">
        <button
        onClick={() => setIsMusyrifModalOpen(false)}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
        Batal
        </button>
        <button
        onClick={handleAssignMusyrif}
        disabled={isLoadingMusyrif}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
        {isLoadingMusyrif ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
    </div>
    </Modal>


    </div>
  );
}
