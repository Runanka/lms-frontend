'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { pathsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import {
  Route,
  Play,
  CheckCircle,
  BookOpen,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import type { Path } from '@/types';

export default function PathDetailPage() {
  const params = useParams();
  const pathId = params.id as string;

  const [path, setPath] = useState<Path | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    const fetchPath = async () => {
      try {
        const data = await pathsApi.get(pathId, accessToken || undefined);
        setPath(data.path);

        // Check if student has started this path
        if (user?.role === 'student' && accessToken) {
          try {
            await pathsApi.progress(pathId, accessToken);
            setIsStarted(true);
          } catch {
            setIsStarted(false);
          }
        }
      } catch (err) {
        console.error('Failed to fetch path:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPath();
  }, [pathId, accessToken, user]);

  const handleStart = async () => {
    if (!accessToken) return;

    setStarting(true);
    try {
      await pathsApi.start(pathId, accessToken);
      setIsStarted(true);
    } catch (err) {
      console.error('Failed to start path:', err);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-6" />
        <div className="aspect-video bg-gray-200 rounded-2xl mb-6" />
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Route className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Path not found</h3>
        <p className="text-gray-500 mb-6">This path may have been removed or doesn't exist.</p>
        <Link href="/paths">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Paths
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/paths"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Paths
      </Link>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="aspect-video relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl overflow-hidden mb-6">
          {path.thumbnailUrl ? (
            <img
              src={path.thumbnailUrl}
              alt={path.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Route className="w-20 h-20 text-white/30" />
            </div>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          {path.title}
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          {path.description || 'No description available'}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{path.courses?.length || 0} courses</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {user?.role === 'student' && !isStarted && (
            <Button
              onClick={handleStart}
              disabled={starting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {starting ? (
                'Starting...'
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Path
                </>
              )}
            </Button>
          )}

          {isStarted && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Started
            </div>
          )}
        </div>
      </div>

      {/* Courses in Path */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Courses in this Path
        </h2>

        {path.courses && path.courses.length > 0 ? (
          <div className="space-y-3">
            {path.courses.map((course, idx) => (
              <Link
                key={course._id}
                href={`/courses/${course._id}`}
                className="group block"
              >
                <div className="bg-white border border-gray-100 rounded-xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {course.modules?.length || 0} modules
                      </p>
                    </div>
                    <span className="text-sm text-gray-400 group-hover:text-indigo-600 transition-colors">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No courses in this path yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
