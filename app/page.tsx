'use client';

import { initiateAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const companies = [
  { name: 'GitLab', className: 'font-bold' },
  { name: 'BBC', className: 'font-serif' },
  { name: 'ERICSSON', className: 'font-bold' },
  { name: 'IBM', className: 'font-bold' },
  { name: 'cansaas', className: '' },
  { name: 'Penn', className: 'font-serif' },
  { name: 'Google', className: 'tracking-tight' },
  { name: 'Microsoft', className: 'font-bold' },
  { name: 'Spotify', className: 'font-semibold' },
  { name: 'NETFLIX', className: 'font-bold tracking-wide' },
  { name: 'Airbnb', className: 'font-semibold' },
  { name: 'Meta', className: 'font-bold' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold">● Skillwise</span>
            <nav className="hidden md:flex gap-6 text-sm text-gray-600">
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => initiateAuth('login')}>
              Sign in
            </Button>
            <Button
              onClick={() => initiateAuth('signup')}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Sign up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 min-h-[calc(100vh-64px)] flex flex-col">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 text-violet-700 rounded-full text-sm mb-6">
            <Star className="w-4 h-4" />
            Curated by Experts for smart learners
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Expert-Led classes for unlocking
            <br />
            your creative <span className="text-violet-600">✦</span> potential.
          </h1>

          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Learn from top industry professionals through interactive lessons designed to elevate
            your skills, inspire innovation, and fast-track your creative journey.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => initiateAuth('signup')}
              className="px-8"
            >
              Join for free
            </Button>
          </div>
        </div>

        {/* Spacer to push logos down */}
        <div className="flex-grow" />

        {/* Trust logos - Infinite Marquee */}
        <div className="mt-12 pt-10">
          <p className="text-center text-sm text-gray-500 mb-4 border-b pb-4">
            Trusted by learners at leading companies
          </p>

          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

            <motion.div
              className="flex gap-12 items-center"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 20,
                  ease: 'linear',
                },
              }}
            >
              {/* Duplicate the list for seamless loop */}
              {[...companies, ...companies].map((company, index) => (
                <span
                  key={index}
                  className={`text-lg text-gray-400 whitespace-nowrap ${company.className}`}
                >
                  {company.name}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}