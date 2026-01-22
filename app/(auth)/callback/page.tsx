'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForToken } from '@/lib/auth';
import { useAuthStore } from '@/lib/auth-store';
import { usersApi } from '@/lib/api';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);
  
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // Prevent running twice (OAuth codes are single-use)
    if (hasRun.current) return;
    hasRun.current = true;

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
        console.log('Starting token exchange...');
        const tokens = await exchangeCodeForToken(code);
        console.log('Token exchange successful, fetching user...');
        
        const { user } = await usersApi.me(tokens.access_token);
        console.log('User fetched:', user);

        setAuth(user, tokens.access_token);

        if (!user.role) {
          router.replace('/select-role');
        } else {
          router.replace('/courses');
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        const errorMessage = err?.message || err?.toString() || 'Unknown error';
        const errorDetails = err?.cause ? ` (Cause: ${err.cause})` : '';
        setError(`${errorMessage}${errorDetails}`);
      }
    };

    handleCallback();
  }, [searchParams, setAuth, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="text-gray-600 mt-2 break-words">{error}</p>
          <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs text-gray-500 overflow-auto max-h-40">
            <p><strong>Debug Info:</strong></p>
            <p>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p>Code present: {searchParams.get('code') ? 'Yes' : 'No'}</p>
          </div>
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
