'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { usersApi } from '@/lib/api';
import { Briefcase, Lightbulb } from 'lucide-react';
import type { Role } from '@/types';

export default function SelectRolePage() {
  const router = useRouter();
  const { accessToken, user, setAuth } = useAuthStore();
  const [selecting, setSelecting] = useState<Role | null>(null);

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (!accessToken) {
      router.replace('/');
    } else if (user?.role) {
      router.replace('/courses');
    }
  }, [accessToken, user?.role, router]);

  // Show nothing while redirecting
  if (!accessToken || user?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  const handleSelect = async (role: Role) => {
    setSelecting(role);
    try {
      await usersApi.setRole(role, accessToken);

      // Update local user state
      if (user) {
        setAuth({ ...user, role }, accessToken);
      }

      router.replace('/courses');
    } catch (err) {
      console.error('Failed to set role:', err);
      setSelecting(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-2xl font-bold">
            <span className="text-violet-600">●</span> Skillwise
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          How do you want to use Skillwise?
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          Choose your role to get started.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Student Option */}
          <button
            onClick={() => handleSelect('student')}
            disabled={selecting !== null}
            className={`group relative p-6 bg-white border-2 rounded-2xl text-left transition-all duration-200 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 ${selecting === 'student'
                ? 'border-violet-500 shadow-lg shadow-violet-500/10'
                : 'border-gray-100'
              } ${selecting !== null && selecting !== 'student' ? 'opacity-50' : ''}`}
          >
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-500 group-hover:text-white transition-colors">
              <Briefcase className="w-6 h-6 text-violet-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Employee</h3>
            <p className="text-gray-500 text-sm">
              Learn from expert-created courses and paths. Track your professional growth and achieve your goals.
            </p>
            {selecting === 'student' && (
              <div className="absolute top-4 right-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600" />
              </div>
            )}
          </button>

          {/* Coach Option */}
          <button
            onClick={() => handleSelect('coach')}
            disabled={selecting !== null}
            className={`group relative p-6 bg-white border-2 rounded-2xl text-left transition-all duration-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 ${selecting === 'coach'
                ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                : 'border-gray-100'
              } ${selecting !== null && selecting !== 'coach' ? 'opacity-50' : ''}`}
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Lightbulb className="w-6 h-6 text-indigo-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Coach</h3>
            <p className="text-gray-500 text-sm">
              Create and publish courses. Build learning paths and help employees grow.
            </p>
            {selecting === 'coach' && (
              <div className="absolute top-4 right-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
              </div>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}
