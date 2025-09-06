// file: src/app/ortu/layout.jsx
"use client";

import { useState, Fragment, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../AuthContext';
import SidebarOrtu from '@/components/SidebarOrtu'; // <-- 1. IMPORT DARI KOMPONEN BARU

// Hapus definisi const SidebarOrtu yang lama dari sini

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isCheckingAuth, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const pageTitle = useMemo(() => {
    const basePath = "/ortu";
    if (pathname === basePath) {
      return "Dashboard";
    }
    const relativePath = pathname.startsWith(`${basePath}/`)
      ? pathname.substring(basePath.length + 1)
      : pathname.split("/").pop();
    return relativePath.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, [pathname]);

  useEffect(() => {
    if (!isCheckingAuth) {
      if (!token || (user && user.slug !== 'orang-tua')) {
        router.push('/');
      }
    }
  }, [isCheckingAuth, token, user, router]);

  if (isCheckingAuth || !token || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-600">Memuat dan memverifikasi sesi...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
            {/* ... (kode transisi tidak berubah) ... */}
            <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </Transition.Child>
            <div className="fixed inset-0 flex z-40">
                <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                    <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                        <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setSidebarOpen(false)}>
                                    <span className="sr-only">Tutup sidebar</span>
                                    <FiX className="h-6 w-6 text-black" aria-hidden="true" />
                                </button>
                            </div>
                        </Transition.Child>
                        {/* --- ▼▼▼ 2. PERBARUI PEMANGGILAN KOMPONEN ▼▼▼ --- */}
                        <SidebarOrtu setSidebarOpen={setSidebarOpen} />
                    </Dialog.Panel>
                </Transition.Child>
                <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
            </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
         {/* --- ▼▼▼ 2. PERBARUI PEMANGGILAN KOMPONEN ▼▼▼ --- */}
        <SidebarOrtu />
      </div>

      <div className="lg:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-sm items-center justify-between px-4 sm:px-6 lg:px-8">
          <button type="button" className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Buka sidebar</span>
            <FiMenu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 flex justify-between items-center ml-4 lg:ml-0">
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}