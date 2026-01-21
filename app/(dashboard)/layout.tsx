'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { logout } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null; // Will redirect
  }

  const isCoach = user.role === 'coach';

  const navItems = isCoach
    ? [
      { href: '/courses', label: 'My Courses' },
      { href: '/paths', label: 'My Paths' },
      { href: '/create-course', label: '+ Course' },
      { href: '/create-path', label: '+ Path' },
    ]
    : [
      { href: '/courses', label: 'Browse Courses' },
      { href: '/paths', label: 'Browse Paths' },
      { href: '/my-courses', label: 'My Learning' },
      { href: '/my-paths', label: 'My Paths' },
    ];

  const handleLogout = () => {
    useAuthStore.getState().logout();
    logout();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/courses" className="font-bold text-xl">
              LMS
            </Link>
            <nav className="flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm ${pathname === item.href
                      ? 'bg-gray-100 font-medium'
                      : 'text-gray-600 hover:text-black'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name || user.email} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-black"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}