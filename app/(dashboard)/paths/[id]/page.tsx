'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { pathsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
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
    return <div className="text-center py-12">Loading path...</div>;
  }

  if (!path) {
    return <div className="text-center py-12">Path not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        {path.thumbnailUrl && (
          <img
            src={path.thumbnailUrl}
            alt={path.title}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}
        <h1 className="text-3xl font-bold">{path.title}</h1>
        <p className="text-gray-600 mt-2">{path.description}</p>
        
        {/* Actions */}
        <div className="mt-4 flex gap-4">
          {user?.role === 'student' && !isStarted && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {starting ? 'Starting...' : 'Start Path'}
            </button>
          )}
          
          {isStarted && (
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              ✓ Started
            </span>
          )}
        </div>
      </div>

      {/* Courses in Path */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Courses in this Path ({path.courses?.length || 0})
        </h2>
        
        {path.courses?.map((course, idx) => (
          <Link
            key={course._id}
            href={`/courses/${course._id}`}
            className="block border rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                {idx + 1}
              </div>
              <div>
                <h3 className="font-medium">{course.title}</h3>
                <p className="text-sm text-gray-500">{course.modules?.length || 0} modules</p>
              </div>
            </div>
          </Link>
        ))}
        
        {(!path.courses || path.courses.length === 0) && (
          <p className="text-gray-500">No courses in this path</p>
        )}
      </div>
    </div>
  );
}