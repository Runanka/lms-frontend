'use client';

import { initiateAuth } from '@/lib/auth';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold">LMS Platform</h1>
        <p className="text-gray-600">Learn from the best. Teach what you know.</p>
        
        <div className="space-y-4 pt-8">
          <button 
            onClick={() => initiateAuth('signup')}
            className="block w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Sign Up
          </button>
          
          <button 
            onClick={() => initiateAuth('login')}
            className="block w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}