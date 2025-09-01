"use client";

import { FiChevronLeft, FiChevronRight, FiEdit, FiPlus } from 'react-icons/fi';

// Komponen untuk badge status
const StatusBadge = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block";
  let specificClasses = "";

  switch (status.toLowerCase()) {
    case 'completed':
      specificClasses = "bg-green-100 text-green-700";
      break;
    case 'processing':
      specificClasses = "bg-purple-100 text-purple-700";
      break;
    case 'rejected':
      specificClasses = "bg-red-100 text-red-700";
      break;
    default:
      specificClasses = "bg-gray-100 text-gray-700";
  }
  return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

// Data dummy (bisa Anda sesuaikan nanti)
const kegiatanData = [
    { id: '0001', name: 'Christine Brooks', kelas: '089 Kutch Green Apt. 448', tanggalIzin: '04 Sep 2019', tanggalKembali: '05 Sep 2019', status: 'Completed' },
];

export default function KegiatanPage() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      {/* Tombol Tambah */}
      <div className="flex justify-start mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <FiPlus size={20} />
          <span>Tambah Izin Kegiatan</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500">
            <tr>
              <th className="p-4 font-medium">NAME</th>
              <th className="p-4 font-medium">Kelas</th>
              <th className="p-4 font-medium">Tanggal Izin</th>
              <th className="p-4 font-medium">Tanggal Kembali</th>
              <th className="p-4 font-medium">Aksi</th>
              <th className="p-4 font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {kegiatanData.map((izin) => (
              <tr key={izin.id} className="hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-800">{izin.name}</td>
                <td className="p-4 text-gray-600">{izin.kelas}</td>
                <td className="p-4 text-gray-600">{izin.tanggalIzin}</td>
                <td className="p-4 text-gray-600">{izin.tanggalKembali}</td>
                <td className="p-4">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-white text-xs rounded-md hover:bg-yellow-500 transition-colors">
                    <FiEdit size={12} />
                    <span>Edit</span>
                  </button>
                </td>
                <td className="p-4">
                  <StatusBadge status={izin.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex items-center justify-between pt-4 text-sm text-gray-500">
        <p>Showing 1-01 of 10</p>
        <div className="flex items-center gap-2">
          <button className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50" disabled>
            <FiChevronLeft size={16} />
          </button>
          <button className="p-2 border rounded-lg hover:bg-gray-100">
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}