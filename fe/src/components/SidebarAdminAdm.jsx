"use client";

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Menu, Transition } from '@headlessui/react';
import {
  FiHome,
  FiDollarSign,
  FiLogOut
} from 'react-icons/fi';

// Menu item khusus untuk Admin Administrasi
const menuItems = [
  {
    group: 'Main Menu',
    items: [
      { name: 'Dashboard', icon: FiHome, href: '/adminAdm' },
      { name: 'SPP', icon: FiDollarSign, href: '/adminAdm/spp' },
    ],
  },
];


export default function SidebarAdminAdm({ setSidebarOpen }) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className="bg-white w-64 min-h-screen flex flex-col shadow-md"> {/* Menambahkan shadow-md di sidebar */}
      {/* Header Sidebar dengan Profil Pengguna */}
      <div className="p-4"> {/* Menghilangkan border-b */}
        <Menu as="div" className="relative">
          <Menu.Button className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <img
              src="https://images.unsplash.com/photo-163333275S5192-727a05c4013d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80"
              alt="User avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-800">Sutomo Prayitno</p>
              <p className="text-xs text-gray-500">Admin Administrasi</p>
            </div>
          </Menu.Button>
          <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
            <Menu.Items className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"> {/* Menambahkan shadow-lg di dropdown */}
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    // <button onClick={() => console.log('Logout clicked!')} className={clsx('w-full text-left flex items-center gap-3 px-4 py-2 text-sm', active ? 'bg-red-100 text-red-700' : 'text-red-600' )}>
                    //   <FiLogOut /> Logout
                    // </button>
                    <a href="/" className={clsx('w-full text-left flex items-center gap-3 px-4 py-2 text-sm', active ? 'bg-red-100 text-red-700' : 'text-red-600' )}>
                      <FiLogOut /> Logout
                    </a>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {menuItems.map((menuGroup) => (
          <div key={menuGroup.group}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{menuGroup.group}</h2>
            <ul className="space-y-1">
              {menuGroup.items.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} onClick={handleLinkClick} className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg transition-colors', { 'bg-indigo-100 text-indigo-700 font-semibold': pathname === item.href, 'text-gray-600 hover:bg-gray-100 hover:text-gray-900': pathname !== item.href })}>
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