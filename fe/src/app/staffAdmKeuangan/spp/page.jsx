"use client";

import { useState } from 'react';
import { FiFilter, FiChevronLeft, FiChevronRight, FiEye, FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';


// ▼▼▼ REVISI 2: WARNA LABEL 'TAGIHAN' DIUBAH MENJADI MERAH ▼▼▼
const StatusBadge = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block";
  let specificClasses = "";

  switch (status.toLowerCase()) {
    case 'selesai':
      specificClasses = "bg-green-100 text-green-700";
      break;
    case 'tagihan':
      specificClasses = "bg-red-100 text-red-700"; // Diubah dari kuning ke merah
      break;
    default:
      specificClasses = "bg-gray-100 text-gray-700";
  }
  return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

// Data dummy (tidak ada perubahan)
const sppData = [
    { id: 1, name: 'Christine Brooks', kelasTahunAjaran: 'VII A / 2024-2025', tahunMasuk: '2022', status: 'Selesai' },
    { id: 2, name: 'Rosie Pearson', kelasTahunAjaran: 'VIII B / 2024-2025', tahunMasuk: '2021', status: 'Tagihan' },
    { id: 3, name: 'Darrell Caldwell', kelasTahunAjaran: 'IX C / 2024-2025', tahunMasuk: '2020', status: 'Selesai' },
    { id: 4, name: 'Gilbert Johnston', kelasTahunAjaran: 'VII B / 2024-2025', tahunMasuk: '2022', status: 'Tagihan' },
    { id: 5, name: 'Alan Cain', kelasTahunAjaran: 'VIII A / 2024-2025', tahunMasuk: '2021', status: 'Selesai' },
];

const filterButtons = [1, 2, 3, 4, 5, 6];

export default function SppStaffPage() {
  const [activeFilter, setActiveFilter] = useState(1);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Filter Section (tidak ada perubahan) */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
        <button className="p-2.5 text-sm border rounded-lg hover:bg-gray-50">
          <FiFilter size={16} />
        </button>
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
          {filterButtons.map((number) => (
            <button
              key={number}
              onClick={() => setActiveFilter(number)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeFilter === number 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'bg-transparent text-gray-600 hover:bg-white/60'
              }`}
            >
              {number}
            </button>
          ))}
        </div>
        <button className="text-sm text-red-500 hover:underline ml-auto">
          Reset Filter
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500">
            <tr>
              <th className="p-4 font-medium">NAME</th>
              <th className="p-4 font-medium">Kelas/Tahun Ajaran</th>
              <th className="p-4 font-medium">Tahun Masuk</th>
              <th className="p-4 font-medium">Action</th>
              <th className="p-4 font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sppData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-600">{item.kelasTahunAjaran}</td>
                <td className="p-4 text-gray-600">{item.tahunMasuk}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {/* ▼▼▼ REVISI 1: WARNA TOMBOL 'DETAIL' DIUBAH MENJADI BIRU ▼▼▼ */}
                    <Link href="/staffAdm/spp/detail" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors">
                        <FiEye size={12} />
                        <span>Detail</span>
                    </Link>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors">
                      <FiDollarSign size={12} />
                      <span>Bayar</span>
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Section (tidak ada perubahan) */}
      <div className="flex items-center justify-between pt-4 text-sm text-gray-500">
        <p>Showing 1-05 of 78</p>
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