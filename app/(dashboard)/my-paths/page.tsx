'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { pathsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface StartedPath {
  path: {
    _id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    totalCourses: number;
  };
  startedAt: string;
  progress: number;
  coursesCompleted: number;
}

export default function MyPathsPage() {
  const [paths, setPaths] = useState<StartedPath[]>([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchMyPaths = async () => {
      if (!accessToken) return;
      
      try {
        const data = await pathsApi.myPaths(accessToken);
        setPaths(data.paths);
      } catch (err) {
        console.error('Failed to fetch my paths:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPaths();
  }, [accessToken]);

  if (loading) {
    return <div className="text-center py-12">Loading your paths...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">My Paths</h1>

      {paths.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't started any paths yet</p>
          <Link href="/paths" className="text-blue-600 hover:underline">
            Browse Paths
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map(({ path, progress, coursesCompleted }) => (
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
                <p className="text-sm text-gray-500 mt-1">
                  {coursesCompleted}/{path.totalCourses} courses completed
                </p>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black rounded-full h-2 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}