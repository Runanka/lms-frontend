'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi, pathsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Course } from '@/types';

export default function CreatePathPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!accessToken) return;
      
      try {
        // Fetch courses and filter to only mine
        const data = await coursesApi.list(accessToken);
        const owned = data.courses.filter((c) => c.coachId === user?.id);
        setMyCourses(owned);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      }
    };

    fetchMyCourses();
  }, [accessToken, user]);

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    
    if (selectedCourses.length === 0) {
      setError('Select at least one course');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await pathsApi.create(
        { 
          title, 
          description: description || undefined, 
          courseIds: selectedCourses 
        },
        accessToken
      );
      router.push(`/paths/${result.pathId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create path');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Create New Path</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. Full Stack Developer Path"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="What will students achieve?"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="https://..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Courses * ({selectedCourses.length} selected)
          </label>
          
          {myCourses.length === 0 ? (
            <p className="text-gray-500">
              You haven't created any courses yet.{' '}
              <a href="/create-course" className="text-blue-600 hover:underline">
                Create one first
              </a>
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
              {myCourses.map((course) => (
                <label
                  key={course._id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course._id)}
                    onChange={() => toggleCourse(course._id)}
                    className="w-4 h-4"
                  />
                  <span>{course.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || selectedCourses.length === 0}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Path'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}