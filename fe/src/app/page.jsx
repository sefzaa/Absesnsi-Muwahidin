// file: src/app/page.jsx
// Halaman login utama
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';
import { useAuth } from './AuthContext';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login gagal.');
            }
            
            login(data.accessToken, data);

            // --- ▼▼▼ MODIFIKASI: Arahkan berdasarkan role dan jabatan baru ▼▼▼ ---
            if (data.slug === 'pegawai' && data.jabatan === 'musyrif') {
                router.push('/musyrif');
            } else if (data.slug === 'pegawai' && data.jabatan === 'tu') {
                router.push('/tu'); // <-- Arahkan ke dasbor TU
            } 
            else if (data.slug === 'pegawai' && data.jabatan === 'guru') {
                router.push('/guru'); // <-- Arahkan ke dasbor TU
            }
            else if (data.slug === 'pegawai' && data.jabatan === 'direktur') {
                router.push('/direktur'); // <-- Arahkan ke dasbor TU
            }
            else if (data.slug === 'admin-asrama') {
                router.push('/adminAsrama');
            } 
                        // --- ▼▼▼ TAMBAHAN: Redirect untuk Orang Tua ▼▼▼ ---
            else if (data.slug === 'orang-tua') {
                router.push('/ortu'); 
            }
            // --- ▲▲▲ Akhir Tambahan ---
            else {
                // Redirect default jika ada role lain yang tidak dikenal
                router.push('/');
            }
            // --- ▲▲▲ Akhir Modifikasi ---

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
                <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">
                    Masuk ke SIM Pesantren
                </h2>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-800"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-800"
                        />
                    </div>
                    
                    {error && (
                        <div className="text-center text-sm font-medium text-red-600">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading && <FiLoader className="mr-2 animate-spin" />}
                            Masuk
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}