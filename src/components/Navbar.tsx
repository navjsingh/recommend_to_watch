"use client";
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [dropdown, setDropdown] = useState(false);

  return (
    <nav className="bg-gray-900 shadow mb-8 p-4 flex gap-6 items-center">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-white font-bold text-lg tracking-wide">🎬 RecoWatch</span>
      </Link>
      
      <div className="flex gap-4 items-center">
        <Link href="/search" className="text-gray-300 hover:text-white transition-colors">
          Search
        </Link>
        {session && (
          <Link href="/recommendations" className="text-gray-300 hover:text-white transition-colors">
            Recommendations
          </Link>
        )}
      </div>
      
      <div className="ml-auto relative">
        {session ? (
          <div className="relative inline-block">
            <button
              className="inline-flex w-10 h-10 rounded-full bg-gray-800 items-center justify-center text-2xl text-white hover:bg-gray-700 transition focus:outline-none"
              onClick={() => setDropdown(v => !v)}
              aria-label="User menu"
            >
              {session.user?.name ? session.user.name[0].toUpperCase() : "👤"}
            </button>
            {dropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border">
                <div className="px-4 py-3 text-gray-700 border-b bg-gray-50 rounded-t-lg">
                  <div className="font-medium">{session.user?.name || 'User'}</div>
                  <div className="text-sm text-gray-500">{session.user?.email}</div>
                </div>
                <Link
                  href="/profile"
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => setDropdown(false)}
                >
                  Profile
                </Link>
                <button
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition"
                  onClick={() => { setDropdown(false); signOut(); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="inline-flex w-10 h-10 rounded-full bg-gray-800 items-center justify-center text-2xl text-white hover:bg-gray-700 transition"
            onClick={() => signIn()}
            aria-label="Sign in"
          >
            👤
          </button>
        )}
      </div>
    </nav>
  );
} 