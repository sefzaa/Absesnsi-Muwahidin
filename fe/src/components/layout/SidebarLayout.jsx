"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, Transition } from "@headlessui/react";
import { FiLogOut } from "react-icons/fi";

// Ini adalah komponen Sidebar yang bisa dipakai ulang
// Ia menerima `userData` dan `menuItems` sebagai props
export default function Sidebar({ userData, menuItems, setSidebarOpen }) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className="bg-white w-64 min-h-screen flex flex-col shadow-md">
      {/* Bagian Profil Pengguna (datanya dari props) */}
      <div className="p-4">
        <Menu as="div" className="relative">
          <Menu.Button className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <img
              src={userData.avatar || "https://via.placeholder.com/150"}
              alt="User avatar"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-800">
                {userData.name}
              </p>
              <p className="text-xs text-gray-500">{userData.role}</p>
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
            <Menu.Items className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/"
                      className={clsx(
                        "w-full text-left flex items-center gap-3 px-4 py-2 text-sm",
                        active ? "bg-red-100 text-red-700" : "text-red-600"
                      )}
                    >
                      <FiLogOut /> Logout
                    </a>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Navigasi Menu (datanya dari props) */}
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
