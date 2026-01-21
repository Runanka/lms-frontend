'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { usersApi } from '@/lib/api';
import type { Role } from '@/types';

export default function SelectRolePage() {
  const router = useRouter();
  const { accessToken, user, setAuth } = useAuthStore();

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const handleSelect = async (role: Role) => {
    try {
      await usersApi.setRole(role, accessToken);

      // Update local user state
      if (user) {
        setAuth({ ...user, role }, accessToken);
      }

      router.replace('/courses');
    } catch (err) {
      console.error('Failed to set role:', err);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">Choose Your Role</h1>
        <p className="text-gray-600">How do you want to use LMS?</p>

        <div className="space-y-4 pt-8">
          <button
            onClick={() => handleSelect('student')}
            className="block w-full py-4 px-4 border-2 border-gray-200 rounded-lg hover:border-black transition-colors"
          >
            <div className="font-semibold">Student</div>
            <div className="text-sm text-gray-500">Learn from courses and paths</div>
          </button>

          <button
            onClick={() => handleSelect('coach')}
            className="block w-full py-4 px-4 border-2 border-gray-200 rounded-lg hover:border-black transition-colors"
          >
            <div className="font-semibold">Coach</div>
            <div className="text-sm text-gray-500">Create and sell courses</div>
          </button>
        </div>
      </div>
    </main>
  );
}
