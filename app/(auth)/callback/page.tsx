'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForToken } from '@/lib/auth';
import { useAuthStore } from '@/lib/auth-store';
import { usersApi } from '@/lib/api';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(errorParam);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        const tokens = await exchangeCodeForToken(code);
        
        // Fetch user from backend (creates if not exists)
        const { user } = await usersApi.me(tokens.access_token);

        setAuth(user, tokens.access_token);

        // If no role set, redirect to role selection
        if (!user.role) {
          router.replace('/select-role');
        } else {
          router.replace('/courses');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, setAuth, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-black rounded-full mx-auto" />
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-black rounded-full mx-auto" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
