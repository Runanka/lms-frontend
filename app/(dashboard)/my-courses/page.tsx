'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { progressApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { BookOpen, Play, CheckCircle } from 'lucide-react';

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

  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100);
  const notStarted = courses.filter((c) => c.progress === 0);
  const completed = courses.filter((c) => c.progress === 100);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
        <p className="text-gray-500 mt-1">
          Track your progress and continue where you left off
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
      ) : courses.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
            You haven't enrolled in any courses yet. Start your learning journey today!
          </p>
          <Link href="/courses">
            <Button className="bg-violet-600 hover:bg-violet-700">
              Browse Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* In Progress Section */}
          {inProgress.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Play className="w-5 h-5 text-violet-600" />
                <h2 className="text-xl font-semibold">Continue Learning</h2>
                <span className="text-sm text-gray-400 ml-2">
                  {inProgress.length} course{inProgress.length !== 1 && 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgress.map(({ course, progress }) => (
                  <CourseCard key={course._id} course={course} progress={progress} />
                ))}
              </div>
            </section>
          )}

          {/* Not Started Section */}
          {notStarted.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-semibold">Not Started</h2>
                <span className="text-sm text-gray-400 ml-2">
                  {notStarted.length} course{notStarted.length !== 1 && 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notStarted.map(({ course, progress }) => (
                  <CourseCard key={course._id} course={course} progress={progress} />
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
                  {completed.length} course{completed.length !== 1 && 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completed.map(({ course, progress }) => (
                  <CourseCard key={course._id} course={course} progress={progress} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  progress,
}: {
  course: EnrolledCourse['course'];
  progress: number;
}) {
  const isCompleted = progress === 100;

  return (
    <Link href={`/learn/${course._id}`} className="group block">
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-200 transition-all duration-300">
        {/* Thumbnail */}
        <div className="aspect-video relative bg-gradient-to-br from-violet-500 to-indigo-600 overflow-hidden">
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
          {/* Progress overlay */}
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Completed
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h2 className="font-semibold text-lg leading-tight group-hover:text-violet-600 transition-colors line-clamp-1">
            {course.title}
          </h2>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-violet-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-violet-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Action */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs font-medium text-violet-600">
              {isCompleted ? 'Review course →' : progress > 0 ? 'Continue →' : 'Start learning →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
