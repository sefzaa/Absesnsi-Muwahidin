"use client";

import { useState } from 'react';
import { FiFilter, FiChevronLeft, FiChevronRight, FiEye, FiArrowUpCircle, FiArrowDownCircle, FiPlus } from 'react-icons/fi';
import Link from 'next/link';

// Data dummy
const simsisData = [
    { id: 1, name: 'Christine Brooks', kelasTahunAjaran: 'VII A / 2024-2025', tahunMasuk: '2022', saldo: 'Rp. 1.250.000' },
    { id: 2, name: 'Rosie Pearson', kelasTahunAjaran: 'VIII B / 2024-2025', tahunMasuk: '2021', saldo: 'Rp. 780.000' },
    { id: 3, name: 'Darrell Caldwell', kelasTahunAjaran: 'IX C / 2024-2025', tahunMasuk: '2020', saldo: 'Rp. 2.100.000' },
    { id: 4, name: 'Gilbert Johnston', kelasTahunAjaran: 'VII B / 2024-2025', tahunMasuk: '2022', saldo: 'Rp. 500.000' },
    { id: 5, name: 'Alan Cain', kelasTahunAjaran: 'VIII A / 2024-2025', tahunMasuk: '2021', saldo: 'Rp. 1.950.000' },
];

const filterButtons = [1, 2, 3, 4, 5, 6];

export default function SimsisPage() {
  const [activeFilter, setActiveFilter] = useState(1);

  return (
    <div>
        {/* ▼▼▼ TOMBOL DAFTAR SIMSIS DITAMBAHKAN DI SINI ▼▼▼ */}
        <div className="flex justify-start mb-6">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FiPlus size={20} />
            <span>Daftar Simsis</span>
            </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
            {/* Filter Section */}
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
                    <th className="p-4 font-medium">Saldo</th>
                    <th className="p-4 font-medium">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {simsisData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-4 font-semibold text-gray-800">{item.name}</td>
                        <td className="p-4 text-gray-600">{item.kelasTahunAjaran}</td>
                        <td className="p-4 text-gray-600">{item.tahunMasuk}</td>
                        <td className="p-4 font-medium text-gray-800">{item.saldo}</td>
                        <td className="p-4">
                        <div className="flex items-center gap-2">
                            <Link href="/staffAdm/simsis/detail" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors">
                                <FiEye size={12} />
                                <span>Detail</span>
                            </Link>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors">
                                <FiArrowUpCircle size={12} />
                                <span>Deposit</span>
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors">
                                <FiArrowDownCircle size={12} />
                                <span>Kredit</span>
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* Pagination Section */}
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
    </div>
  );
}