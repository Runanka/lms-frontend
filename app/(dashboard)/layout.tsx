'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, X, LogOut, User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace('/');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Close sheet on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
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

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm transition-colors ${pathname === href
        ? 'bg-violet-100 text-violet-700 font-medium'
        : 'text-gray-600 hover:text-violet-600 hover:bg-gray-50'
        }`}
    >
      {label}
    </Link>
  );

  const MobileNavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={`block px-4 py-3 rounded-lg text-base transition-colors ${pathname === href
        ? 'bg-violet-100 text-violet-700 font-medium'
        : 'text-gray-600 hover:text-violet-600 hover:bg-gray-50'
        }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo + Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/courses" className="font-bold text-xl flex items-center gap-2">
              <span className="text-violet-600">●</span> Skillwise
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>

          {/* Desktop User Section - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-violet-600" />
              </div>
              <span className="hidden lg:inline">{user.name || user.email}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {user.role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center gap-2">
                  <span className="text-violet-600">●</span> Skillwise
                </SheetTitle>
              </SheetHeader>

              {/* Mobile User Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => (
                  <MobileNavLink key={item.href} {...item} />
                ))}
              </nav>

              {/* Mobile Logout */}
              <div className="mt-auto pt-6 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}