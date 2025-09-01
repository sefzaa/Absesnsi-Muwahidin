// file: components/sidebar/SidebarAdminAsr.jsx
"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, Transition } from "@headlessui/react";
import { useAuth } from '@/app/AuthContext'; // Import useAuth
import { 
  FiHome, 
  FiCalendar, 
  FiAlertTriangle, 
  FiUsers, 
  FiGrid, 
  FiUserCheck, 
  FiBox, 
  FiBriefcase, 
  FiLogOut, 
} from "react-icons/fi";

const menuItems = [
  {
    group: "Main Menu",
    items: [
      { name: "Dashboard", icon: FiHome, href: "/adminAsrama" },
      {
        name: "Kegiatan Rutin",
        icon: FiCalendar,
        href: "/adminAsrama/kegiatan-rutin",
      },
      {
        name: "Kegiatan Tambahan",
        icon: FiCalendar,
        href: "/adminAsrama/kegiatan-tambahan",
      },
      {
        name: "Pelanggaran",
        icon: FiAlertTriangle,
        href: "/adminAsrama/pelanggaran",
      },
    ],
  },
  {
    group: "Manajemen Data",
    items: [
      { name: "Santri", icon: FiUsers, href: "/adminAsrama/santri" },
      { name: "Kamar", icon: FiGrid, href: "/adminAsrama/kamar" },
    ],
  },
  {
    group: "Manajemen Akun",
    items: [
      { name: "Wali Kamar", icon: FiUserCheck, href: "/adminAsrama/wali-kamar" },
      { name: "Disgiat Asrama", icon: FiBox, href: "/adminAsrama/disgiat-asrama" },
      {
        name: "Div. Inventaris",
        icon: FiBriefcase,
        href: "/adminAsrama/div-inventaris",
      },
      { name: "Direktur", icon: FiBriefcase, href: "/adminAsrama/direktur" },
    ],
  },
];

export default function SidebarAdminAsr({ setSidebarOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuth(); // Ambil user dan fungsi logout dari context

  const handleLinkClick = () => {
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className="bg-white w-full h-full flex flex-col">
      <div className="p-4 shadow-sm">
        <Menu as="div" className="relative">
          <Menu.Button className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <img
              src="[https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80](https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80)"
              alt="User avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-800">{user?.nama || 'Nama User'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
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
                <Menu.Item>
                  {({ active }) => (
                    <button 
                      onClick={logout} 
                      className={clsx(
                        "w-full text-left flex items-center gap-3 px-4 py-2 text-sm",
                        active ? "bg-red-100 text-red-700" : "text-red-600"
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
                        "bg-indigo-100 text-indigo-700 font-semibold":
                          pathname === item.href,
                        "text-gray-600 hover:bg-gray-100 hover:text-gray-900":
                          pathname !== item.href,
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
