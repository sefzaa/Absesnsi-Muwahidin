"use client";

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// ▼▼▼ 1. KOMPONEN BADGE DIUBAH UNTUK STATUS BARU ▼▼▼
const StatusBadge = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full inline-block";
  let specificClasses = "";

  switch (status.toLowerCase()) {
    case 'complete':
      specificClasses = "bg-green-100 text-green-700";
      break;
    case 'processing':
      specificClasses = "bg-purple-100 text-purple-700";
      break;
    default:
      specificClasses = "bg-gray-100 text-gray-700";
  }
  return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

// ▼▼▼ 2. DATA DUMMY DISESUAIKAN DENGAN KOLOM BARU ▼▼▼
const riwayatSppData = [
    { id: 1, name: 'Sefza Auma Tiang Alam', tagihan: 'Oktober 2025 - Uang Makan', tanggalBayar: '05 Okt 2025', via: 'Cash', status: 'Complete' },
    { id: 2, name: 'Sefza Auma Tiang Alam', tagihan: 'Oktober 2025 - Uang Pembangunan', tanggalBayar: '05 Okt 2025', via: 'BNI', status: 'Complete' },
    { id: 3, name: 'Sefza Auma Tiang Alam', tagihan: 'September 2025 - Uang Makan', tanggalBayar: '04 Sep 2025', via: 'Mandiri', status: 'Complete' },
    { id: 4, name: 'Sefza Auma Tiang Alam', tagihan: 'November 2025 - Uang Makan', tanggalBayar: '-', via: '-', status: 'Processing' },
    { id: 5, name: 'Sefza Auma Tiang Alam', tagihan: 'November 2025 - Uang Sarana Prasarana', tanggalBayar: '-', via: '-', status: 'Processing' },
];


export default function SppDetailPage() {
  return (
    <div>
        {/* Header Halaman / Breadcrumb */}
        <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700">
            SPP &gt; <span className="text-gray-900 font-bold">Sefza Auma Tiang Alam</span>
            </h2>
        </div>

        {/* Tabel Riwayat Transaksi */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 text-gray-500">
                        {/* ▼▼▼ 3. HEADER TABEL DIPERBARUI ▼▼▼ */}
                        <tr>
                            <th className="p-4 font-medium">NAME</th>
                            <th className="p-4 font-medium">Tagihan</th>
                            <th className="p-4 font-medium">Tanggal Bayar</th>
                            <th className="p-4 font-medium">Via</th>
                            <th className="p-4 font-medium">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {riwayatSppData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-4 font-semibold text-gray-800">{item.name}</td>
                            <td className="p-4 text-gray-600">{item.tagihan}</td>
                            <td className="p-4 text-gray-600">{item.tanggalBayar}</td>
                            {/* Kolom "Via" sekarang menampilkan teks biasa */}
                            <td className="p-4 text-gray-600 font-medium">{item.via}</td>
                            {/* Kolom "STATUS" baru dengan badge */}
                            <td className="p-4">
                                <StatusBadge status={item.status} />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Section */}
            <div className="flex items-center justify-between pt-4 text-sm text-gray-500">
                <p>Showing 1-05 of 24</p>
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