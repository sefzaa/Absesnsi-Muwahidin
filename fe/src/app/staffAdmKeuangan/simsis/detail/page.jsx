"use client";

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Data dummy untuk riwayat transaksi Simsis
// Logika: Jika saldoMasuk ada, saldoKeluar kosong, dan sebaliknya.
const riwayatSimsisData = [
    { id: 1, name: 'Sefza Auma Tiang Alam', saldoMasuk: 'Rp. 500.000', saldoKeluar: '-', tanggal: '05 Agu 2025', via: 'BNI' },
    { id: 2, name: 'Sefza Auma Tiang Alam', saldoMasuk: '-', saldoKeluar: 'Rp. 50.000', tanggal: '04 Agu 2025', via: 'Kantin' },
    { id: 3, name: 'Sefza Auma Tiang Alam', saldoMasuk: '-', saldoKeluar: 'Rp. 25.000', tanggal: '02 Agu 2025', via: 'Koperasi' },
    { id: 4, name: 'Sefza Auma Tiang Alam', saldoMasuk: 'Rp. 500.000', saldoKeluar: '-', tanggal: '01 Agu 2025', via: 'Cash' },
    { id: 5, name: 'Sefza Auma Tiang Alam', saldoMasuk: '-', saldoKeluar: 'Rp. 15.000', tanggal: '31 Jul 2025', via: 'Kantin' },
];


export default function SimsisDetailPage() {
  return (
    <div>
        {/* Header Halaman / Breadcrumb */}
        <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700">
            SIMSIS &gt; <span className="text-gray-900 font-bold">Sefza Auma Tiang Alam</span>
            </h2>
        </div>

        {/* Tabel Riwayat Transaksi */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 text-gray-500">
                        <tr>
                            <th className="p-4 font-medium">NAME</th>
                            <th className="p-4 font-medium">Saldo Masuk</th>
                            <th className="p-4 font-medium">Saldo Keluar</th>
                            <th className="p-4 font-medium">Tanggal</th>
                            <th className="p-4 font-medium">Via</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {riwayatSimsisData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-4 font-semibold text-gray-800">{item.name}</td>
                            <td className="p-4 text-green-600">{item.saldoMasuk}</td>
                            <td className="p-4 text-red-600">{item.saldoKeluar}</td>
                            <td className="p-4 text-gray-600">{item.tanggal}</td>
                            <td className="p-4 text-gray-600 font-medium">{item.via}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Section */}
            <div className="flex items-center justify-between pt-4 text-sm text-gray-500">
                <p>Showing 1-05 of 30</p>
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