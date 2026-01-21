'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { progressApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface EnrolledCourse {
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    totalModules: number;
  };
  enrolledAt: string;
  progress: number;
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!accessToken) return;
      
      try {
        const data = await progressApi.myCourses(accessToken);
        setCourses(data.courses);
      } catch (err) {
        console.error('Failed to fetch my courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [accessToken]);

  if (loading) {
    return <div className="text-center py-12">Loading your courses...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">My Learning</h1>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet</p>
          <Link href="/courses" className="text-blue-600 hover:underline">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(({ course, progress, enrolledAt }) => (
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