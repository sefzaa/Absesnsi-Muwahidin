// file: src/app/page.jsx
// Halaman login utama
"use client";

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { FiLoader, FiUser, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from './AuthContext';
import Image from 'next/image';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// REVISI: Komponen Modal Notifikasi ditambahkan
const NotificationModal = ({ isOpen, message, onClose }) => (
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
                <div className="fixed inset-0 bg-black/30" />
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
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                            <div className="flex flex-col items-center text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                    <FiAlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                </div>
                                <Dialog.Title as="h3" className="mt-4 text-lg font-semibold leading-6 text-gray-900">
                                    Login Gagal
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">{message}</p>
                                </div>
                                <div className="mt-5 w-full">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        Coba Lagi
                                    </button>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
    </Transition>
);


export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // REVISI: State 'error' diubah menjadi 'notification'
    const [notification, setNotification] = useState({ isOpen: false, message: '' });
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setNotification({ isOpen: false, message: '' }); // Reset notifikasi

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

            if (data.slug === 'pegawai' && data.jabatan === 'musyrif') {
                router.push('/musyrif');
            } else if (data.slug === 'pegawai' && data.jabatan === 'tu') {
                router.push('/tu');
            } else if (data.slug === 'pegawai' && data.jabatan === 'guru') {
                router.push('/guru');
            } else if (data.slug === 'pegawai' && data.jabatan === 'direktur') {
                router.push('/direktur');
            } else if (data.slug === 'admin-asrama') {
                router.push('/adminAsrama');
            } else if (data.slug === 'orang-tua') {
                router.push('/ortu'); 
            } else {
                router.push('/');
            }

        } catch (err) {
            // REVISI: Menampilkan modal notifikasi saat error
            setNotification({ isOpen: true, message: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <NotificationModal 
                isOpen={notification.isOpen}
                message={notification.message}
                onClose={() => setNotification({ isOpen: false, message: '' })}
            />
            <div className="flex min-h-screen bg-white">
                {/* Kolom Kiri - Form Login */}
                <div className="flex flex-1 flex-col justify-center pb-45 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold tracking-tight text-green-600">
                                myDM
                            </h1>
                            <Image
                                className="mx-auto mt-4"
                                src="/images/logo.jpg"
                                alt="myDM Logo"
                                width={80} // Coba nilai ini untuk sekitar 80px lebar/tinggi
                                height={80} // Coba nilai ini untuk sekitar 80px lebar/tinggi
                                layout="intrinsic"
                                priority
                            />
                            <h2 className="mt-6 text-2xl font-semibold leading-9 tracking-tight text-gray-900">
                                Masuk ke akun Anda
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Selamat datang kembali! Silakan masukkan detail Anda.
                            </p>
                        </div>

                        <div className="mt-8">
                            <form className="space-y-6" onSubmit={handleLogin}>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                                        Username
                                    </label>
                                    <div className="relative mt-2">
                                        <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="username"
                                            type="text"
                                            autoComplete="username"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password"className="block text-sm font-medium leading-6 text-gray-900">
                                        Password
                                    </label>
                                    <div className="relative mt-2">
                                        <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                                        />
                                    </div>
                                </div>
                                
                                {/* REVISI: Tampilan error teks dihilangkan, diganti modal */}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex w-full items-center justify-center rounded-md bg-green-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isLoading && <FiLoader className="mr-2 h-5 w-5 animate-spin" />}
                                        Masuk
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan - Gambar */}
                <div className="relative hidden w-0 flex-1 lg:block">
                    <Image
                        className="absolute inset-0 h-full w-full object-cover"
                        src="/images/dm.png"
                        alt="Ilustrasi Pesantren"
                        layout="fill"
                        objectFit="cover"
                        priority
                    />
                </div>
            </div>
        </>
    );
}