import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold">
              Samadhan_AI
            </Link>

            <div className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="hover:text-blue-200 transition">
                Dashboard
              </Link>
              <Link href="/troubleshooting" className="hover:text-blue-200 transition">
                Troubleshooting
              </Link>
              <Link href="/documents" className="hover:text-blue-200 transition">
                Documents
              </Link>
              <Link href="/learning" className="hover:text-blue-200 transition">
                Learning
              </Link>
              <Link href="/signals" className="hover:text-blue-200 transition">
                Signals
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
              >
                Logout
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden"
            >
              ☰
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden mt-4 space-y-2">
              <Link href="/dashboard" className="block hover:text-blue-200 transition">
                Dashboard
              </Link>
              <Link href="/troubleshooting" className="block hover:text-blue-200 transition">
                Troubleshooting
              </Link>
              <Link href="/documents" className="block hover:text-blue-200 transition">
                Documents
              </Link>
              <Link href="/learning" className="block hover:text-blue-200 transition">
                Learning
              </Link>
              <Link href="/signals" className="block hover:text-blue-200 transition">
                Signals
              </Link>
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition text-left"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-6 py-4 text-center">
          <p>&copy; 2026 Samadhan_AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
