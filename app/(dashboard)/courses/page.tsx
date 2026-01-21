'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Course } from '@/types';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return <div className="text-center py-12">Loading courses...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">
          {isCoach ? 'My Courses' : 'Browse Courses'}
        </h1>
        {isCoach && (
          <Link
            href="/create-course"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Create Course
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No courses found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course._id}
              href={`/courses/${course._id}`}
              className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {course.thumbnailUrl && (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="font-semibold">{course.title}</h2>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {course.description}
                </p>
                <div className="text-xs text-gray-400 mt-2">
                  {course.modules?.length || 0} modules
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}