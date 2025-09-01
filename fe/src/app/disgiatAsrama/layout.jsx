// file: src/app/disgiatAsrama/layout.jsx
"use client";

import { useState, Fragment, useMemo, useEffect } from 'react'; // <-- PENAMBAHAN: useEffect
import { usePathname, useRouter } from 'next/navigation'; // <-- PENAMBAHAN: useRouter
import { Dialog, Transition } from '@headlessui/react';
import { FiMenu, FiX, FiSearch, FiFilter, FiLoader } from 'react-icons/fi';
import SidebarDisgiatAsrama from '@/components/SidebarDisgiatAsrama'; // Ganti nama komponen sidebar
import { useAuth } from '../AuthContext'; // <-- PENAMBAHAN: Import useAuth

export default function DisgiatAsramaLayout({ children }) { // Ganti nama layout
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  // --- ▼▼▼ PENAMBAHAN: Logika Proteksi Halaman ▼▼▼ ---
  const { user, isCheckingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isCheckingAuth) {
      if (!user || user.slug !== 'disgiat-asrama') {
        router.push('/'); // Redirect jika bukan Disgiat atau belum login
      }
    }
  }, [user, isCheckingAuth, router]);

  const pageTitle = useMemo(() => {
    if (pathname === '/disgiatAsrama') {
      return 'Dashboard';
    }
    const lastSegment = pathname.split('/').pop();
    return lastSegment.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }, [pathname]);

  // Tampilkan loading saat pengecekan otentikasi
  if (isCheckingAuth || !user || user.slug !== 'disgiat-asrama') {
    return (
      <div className="flex h-screen items-center justify-center">
        <FiLoader className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }
  // --- ▲▲▲ AKHIR PENAMBAHAN ---

  return (
    <div className="min-h-screen bg-gray-50">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        {/* ... (Sidebar Mobile tidak berubah) ... */}
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
            {/* ... */}
            <SidebarDisgiatAsrama setSidebarOpen={setSidebarOpen} />
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 shadow-md">
        <SidebarDisgiatAsrama />
      </div>

      <div className="lg:pl-64 flex flex-col flex-1">
        {/* ... (Header dan Main tidak berubah, pastikan children di-render) ... */}
        <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-sm items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* ... */}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {/* ... */}
            {children}
        </main>
      </div>
    </div>
  );
}