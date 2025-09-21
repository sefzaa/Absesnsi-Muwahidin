"use client";

import { useAuth } from '../AuthContext';

export default function DashboardDirekturPage() {
    const { user } = useAuth();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800">Selamat Datang, {user?.nama || 'Direktur'}!</h2>
            <p className="text-gray-600 mt-2">
                Anda telah berhasil masuk ke dasbor Direktur. Silakan gunakan menu di samping untuk melihat rekapitulasi absensi santri secara keseluruhan.
            </p>
        </div>
    );
}
