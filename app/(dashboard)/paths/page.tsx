'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { pathsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Path } from '@/types';

export default function PathsPage() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [loading, setLoading] = useState(true);
  const { accessToken, user } = useAuthStore();
  const isCoach = user?.role === 'coach';

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const data = await pathsApi.list(accessToken || undefined);
        setPaths(data.paths);
      } catch (err) {
        console.error('Failed to fetch paths:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, [accessToken]);

  if (loading) {
    return <div className="text-center py-12">Loading paths...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">
          {isCoach ? 'My Paths' : 'Browse Paths'}
        </h1>
        {isCoach && (
          <Link
            href="/create-path"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Create Path
          </Link>
        )}
      </div>

      {paths.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No paths found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((path) => (
            <Link
              key={path._id}
              href={`/paths/${path._id}`}
              className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {path.thumbnailUrl && (
                <img
                  src={path.thumbnailUrl}
                  alt={path.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="font-semibold">{path.title}</h2>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {path.description}
                </p>
                <div className="text-xs text-gray-400 mt-2">
                  {path.courses?.length || 0} courses
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}