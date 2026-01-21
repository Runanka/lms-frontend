'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { pathsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Route, Play, CheckCircle, BookOpen } from 'lucide-react';

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

  const inProgress = paths.filter((p) => p.progress > 0 && p.progress < 100);
  const notStarted = paths.filter((p) => p.progress === 0);
  const completed = paths.filter((p) => p.progress === 100);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">My Paths</h1>
        <p className="text-gray-500 mt-1">
          Your learning journeys and progress
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl aspect-video" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : paths.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Route className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No paths started</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            Start a learning path to track your progress across multiple courses.
          </p>
          <Link href="/paths">
            <Button className="bg-violet-600 hover:bg-violet-700">
              Browse Paths
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* In Progress Section */}
          {inProgress.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Play className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">In Progress</h2>
                <span className="text-sm text-gray-400 ml-2">
                  {inProgress.length} path{inProgress.length !== 1 && 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgress.map((item) => (
                  <PathCard key={item.path._id} {...item} />
                ))}
              </div>
            </section>
          )}

          {/* Not Started Section */}
          {notStarted.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Route className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-semibold">Not Started</h2>
                <span className="text-sm text-gray-400 ml-2">
                  {notStarted.length} path{notStarted.length !== 1 && 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notStarted.map((item) => (
                  <PathCard key={item.path._id} {...item} />
                ))}
              </div>
            </section>
          )}

          {/* Completed Section */}
          {completed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-semibold">Completed</h2>
                <span className="text-sm text-gray-400 ml-2">
                  {completed.length} path{completed.length !== 1 && 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completed.map((item) => (
                  <PathCard key={item.path._id} {...item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PathCard({ path, progress, coursesCompleted }: StartedPath) {
  const isCompleted = progress === 100;

  return (
    <Link href={`/paths/${path._id}`} className="group block">
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300">
        {/* Thumbnail */}
        <div className="aspect-video relative bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
          {path.thumbnailUrl ? (
            <img
              src={path.thumbnailUrl}
              alt={path.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Route className="w-12 h-12 text-white/50" />
            </div>
          )}
          {/* Status badge */}
          {isCompleted ? (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Completed
            </div>
          ) : (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {coursesCompleted}/{path.totalCourses} courses
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h2 className="font-semibold text-lg leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
            {path.title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {coursesCompleted} of {path.totalCourses} courses completed
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-indigo-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Action */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs font-medium text-indigo-600">
              {isCompleted ? 'Review path →' : progress > 0 ? 'Continue →' : 'Start path →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
