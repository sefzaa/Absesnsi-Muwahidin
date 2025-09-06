"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, Transition } from "@headlessui/react";
import {
  FiHome,
  FiUserCheck,
  FiLogOut,
  FiSettings, // <-- 1. IMPORT IKON BARU
} from "react-icons/fi";
import { useAuth } from "@/app/AuthContext";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const menuItems = [
  {
    group: "Main Menu",
    items: [
      { name: "Dashboard", icon: FiHome, href: "/ortu" },
      { name: "Absensi Anak", icon: FiUserCheck, href: "/ortu/absensi-santri" },
    ],
  },
];

export default function SidebarOrtu({ setSidebarOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLinkClick = () => {
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };
  
  let displayTitle = '...';
  if (user) {
    if (user.slug === 'orang-tua') {
      displayTitle = 'Wali Santri';
    } else {
      displayTitle = user.role_name || user.role;
    }
  }

  const avatarUrl = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80";

  const handleLogout = () => {
    logout(() => router.push('/'));
  };

  return (
    <aside className="bg-white w-full h-full flex flex-col">
      <div className="p-4 shadow-sm">
        <Menu as="div" className="relative">
          <Menu.Button className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <img
              src={avatarUrl}
              alt="User avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-800">
                {user ? user.nama : 'Memuat...'}
              </p>
              <p className="text-xs text-gray-500">
                {displayTitle}
              </p>
            </div>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg focus:outline-none">
              <div className="py-1">
                {/* --- ▼▼▼ 2. TAMBAHKAN MENU ITEM BARU DI SINI ▼▼▼ --- */}
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/ortu/pengaturan"
                      className={clsx(
                        'w-full text-left flex items-center gap-3 px-4 py-2 text-sm',
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      )}
                    >
                      <FiSettings /> Pengaturan Akun
                    </Link>
                  )}
                </Menu.Item>
                {/* --- ▲▲▲ AKHIR TAMBAHAN --- */}

                <Menu.Item>
                  {({ active }) => (
                    <button 
                      onClick={handleLogout} 
                      className={clsx(
                        'w-full text-left flex items-center gap-3 px-4 py-2 text-sm', 
                        active ? 'bg-red-100 text-red-700' : 'text-red-600' 
                      )}
                    >
                      <FiLogOut /> Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {menuItems.map((menuGroup) => (
          <div key={menuGroup.group}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {menuGroup.group}
            </h2>
            <ul className="space-y-1">
              {menuGroup.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      {
                        "bg-indigo-100 text-indigo-700 font-semibold": pathname === item.href,
                        "text-gray-600 hover:bg-gray-100 hover:text-gray-900": pathname !== item.href,
                      }
                    )}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
