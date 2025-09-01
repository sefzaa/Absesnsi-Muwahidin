// file: src/app/layout.js
// Menambahkan AuthProvider di layout root agar tersedia di semua halaman
import { GeistSans, GeistMono } from "geist/font";
import { AuthProvider } from './AuthContext';
import './globals.css';

export const metadata = {
  title: "SIM Pesantren",
  description: "Sistem Informasi Manajemen Pondok Pesantren",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}