'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Search, Layers } from 'lucide-react';
import type { Course } from '@/types';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { accessToken, user } = useAuthStore();
  const isCoach = user?.role === 'coach';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await coursesApi.list(accessToken || undefined);
        setCourses(data.courses);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [accessToken]);

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isCoach ? 'My Courses' : 'Browse Courses'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isCoach
                ? 'Manage and create your courses'
                : 'Discover courses to enhance your skills'}
            </p>
          </div>
          {isCoach && (
            <Link href="/create-course">
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl aspect-video" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No courses found' : 'No courses yet'}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms'
              : isCoach
                ? 'Create your first course to get started'
                : 'Check back soon for new courses'}
          </p>
          {isCoach && !searchQuery && (
            <Link href="/create-course">
              <Button className="mt-6 bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </Link>
          )}
        </div>
      ) : (
        /* Course Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Link
              key={course._id}
              href={`/courses/${course._id}`}
              className="group block"
            >
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-200 transition-all duration-300">
                {/* Thumbnail - Always same height */}
                <div className="aspect-video relative bg-linear-to-br from-violet-500 to-indigo-600 overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  {/* Module count badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {course.modules?.length || 0} modules
                  </div>
                </div>

                {/* Content - Fixed padding and structure */}
                <div className="p-5">
                  <h2 className="font-semibold text-lg leading-tight group-hover:text-violet-600 transition-colors line-clamp-1">
                    {course.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[40px]">
                    {course.description || 'No description available'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {isCoach ? 'Edit course →' : 'View details →'}
                    </span>
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-violet-600">
                        {course.title?.charAt(0).toUpperCase()}
                      </span>
                    </div>
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