'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { coursesApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Course, Progress } from '@/types';
import Comments from '@/components/Comments';

export default function LearnCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) {
        router.replace('/');
        return;
      }

      try {
        const [courseData, progressData] = await Promise.all([
          coursesApi.get(courseId, accessToken),
          progressApi.get(courseId, accessToken),
        ]);

        setCourse(courseData.course);
        setProgress(progressData.progress);
      } catch (err) {
        console.error('Failed to fetch course:', err);
        // Not enrolled - redirect to course page
        router.replace(`/courses/${courseId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, accessToken, router]);

  if (loading) {
    return <div className="text-center py-12">Loading course...</div>;
  }

  if (!course || !progress) {
    return null;
  }

  const isResourceComplete = (resourceId: string, type: 'video' | 'document') => {
    if (type === 'video') {
      return progress.completedVideos?.includes(resourceId);
    }
    return progress.completedDocuments?.includes(resourceId);
  };

  const totalResources = course.modules?.reduce(
    (acc, m) => acc + (m.resources?.length || 0), 0
  ) || 0;

  const completedCount =
    (progress.completedVideos?.length || 0) +
    (progress.completedDocuments?.length || 0);

  const progressPercent = totalResources > 0
    ? Math.round((completedCount / totalResources) * 100)
    : 0;

  return (
    <div className="flex gap-8">
      {/* Sidebar - Course Navigation */}
      <aside className="w-80 shrink-0">
        <div className="sticky top-8 border rounded-lg p-4">
          <h2 className="font-semibold mb-2">{course.title}</h2>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 rounded-full h-2 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Modules & Resources */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {course.modules?.map((module, mIdx) => (
              <div key={module._id}>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {mIdx + 1}. {module.title}
                </div>
                <div className="space-y-1 pl-4">
                  {module.resources?.map((resource) => {
                    const isComplete = isResourceComplete(resource._id, resource.type);

                    return (
                      <Link
                        key={resource._id}
                        href={`/learn/${courseId}/${resource._id}`}
                        className={`flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-100 ${isComplete ? 'text-green-600' : 'text-gray-600'
                          }`}
                      >
                        <span>{isComplete ? '✓' : resource.type === 'video' ? '🎬' : '📄'}</span>
                        <span className="truncate">{resource.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Welcome to {course.title}</h1>
          <p className="text-gray-600 mb-8">
            Select a lesson from the sidebar to start learning
          </p>

          {course.modules?.[0]?.resources?.[0] && (
            <Link
              href={`/learn/${courseId}/${course.modules[0].resources[0]._id}`}
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Start First Lesson
            </Link>
          )}
        </div>
        {/* Course Chat */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Course Discussion</h2>
          <Comments courseId={courseId} />
        </div>
      </main>
    </div>
  );
}