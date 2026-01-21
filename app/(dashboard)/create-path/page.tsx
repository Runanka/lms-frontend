'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { coursesApi, pathsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Route, BookOpen, Check } from 'lucide-react';
import type { Course } from '@/types';

export default function CreatePathPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
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
      } finally {
        setLoadingCourses(false);
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
          courseIds: selectedCourses,
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
      {/* Back Button */}
      <Link
        href="/paths"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Paths
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Path</h1>
        <p className="text-gray-500 mt-1">Group courses into a structured learning journey</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="p-6 bg-white border border-gray-100 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="e.g. Full Stack Developer Path"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
              placeholder="What will students achieve?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Thumbnail URL</label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Course Selection */}
        <div className="p-6 bg-white border border-gray-100 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium">Select Courses *</label>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedCourses.length} course{selectedCourses.length !== 1 && 's'} selected
              </p>
            </div>
          </div>

          {loadingCourses ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading your courses...</p>
            </div>
          ) : myCourses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Route className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">You haven't created any courses yet</p>
              <Link href="/create-course">
                <Button variant="outline" size="sm">
                  Create a Course First
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {myCourses.map((course) => {
                const isSelected = selectedCourses.includes(course._id);
                return (
                  <button
                    key={course._id}
                    type="button"
                    onClick={() => toggleCourse(course._id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <p className="text-sm text-gray-500">
                        {course.modules?.length || 0} modules
                      </p>
                    </div>
                    <BookOpen className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || selectedCourses.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Creating...' : 'Create Path'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
