'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { coursesApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import Comments from '@/components/Comments';
import {
  BookOpen,
  Play,
  Edit,
  FileText,
  Video,
  CheckCircle,
  Layers,
  ArrowLeft,
  Users,
} from 'lucide-react';
import type { Course } from '@/types';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const { accessToken, user } = useAuthStore();
  const isCoach = user?.role === 'coach';
  const isOwner = course?.coachId === user?.id;

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await coursesApi.get(courseId, accessToken || undefined);
        setCourse(data.course);

        // Check if student is enrolled
        if (user?.role === 'student' && accessToken) {
          try {
            await progressApi.get(courseId, accessToken);
            setIsEnrolled(true);
          } catch {
            setIsEnrolled(false);
          }
        }
      } catch (err) {
        console.error('Failed to fetch course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, accessToken, user]);

  const handleEnroll = async () => {
    if (!accessToken) return;

    setEnrolling(true);
    try {
      await progressApi.enroll(courseId, accessToken);
      setIsEnrolled(true);
    } catch (err) {
      console.error('Failed to enroll:', err);
    } finally {
      setEnrolling(false);
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

  if (!course) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Course not found</h3>
        <p className="text-gray-500 mb-6">This course may have been removed or doesn't exist.</p>
        <Link href="/courses">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
      </div>
    );
  }

  const totalResources = course.modules?.reduce(
    (acc, m) => acc + (m.resources?.length || 0),
    0
  ) || 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="aspect-video relative bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl overflow-hidden mb-6">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-white/30" />
            </div>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          {course.title}
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          {course.description || 'No description available'}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>{course.modules?.length || 0} modules</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{totalResources} resources</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {user?.role === 'student' && !isEnrolled && (
            <Button
              onClick={handleEnroll}
              disabled={enrolling}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {enrolling ? (
                'Enrolling...'
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Enroll in Course
                </>
              )}
            </Button>
          )}

          {isEnrolled && (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Enrolled
              </div>
              <Link href={`/learn/${courseId}`}>
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Play className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
              </Link>
            </>
          )}

          {isOwner && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/courses/${courseId}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </Button>
              <Link href={`/submissions/${courseId}`}>
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  View Submissions
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Modules Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          Course Content
        </h2>

        {course.modules && course.modules.length > 0 ? (
          <div className="space-y-3">
            {course.modules.map((module, idx) => (
              <div
                key={module._id}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:border-violet-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-lg">{module.title}</h3>

                    {/* Resources List */}
                    {module.resources && module.resources.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {module.resources.map((resource) => (
                          <div
                            key={resource._id}
                            className="flex items-center gap-3 text-sm text-gray-600 py-1"
                          >
                            {resource.type === 'video' ? (
                              <Video className="w-4 h-4 text-blue-500" />
                            ) : (
                              <FileText className="w-4 h-4 text-emerald-500" />
                            )}
                            <span>{resource.title}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {(!module.resources || module.resources.length === 0) && (
                      <p className="text-sm text-gray-400 mt-2">No resources yet</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No modules yet</p>
            {isOwner && (
              <Link href={`/courses/${courseId}/edit`}>
                <Button variant="link" className="text-violet-600 mt-2">
                  Add modules →
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Discussion</h2>
        <Comments courseId={courseId} />
      </div>
    </div>
  );
}
