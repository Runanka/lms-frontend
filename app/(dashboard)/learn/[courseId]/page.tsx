'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { coursesApi, progressApi, assignmentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import Comments from '@/components/Comments';
import {
  BookOpen,
  Play,
  CheckCircle,
  Video,
  FileText,
  ArrowLeft,
  ClipboardList,
} from 'lucide-react';
import type { Course, Progress, Assignment } from '@/types';

export default function LearnCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) {
        router.replace('/');
        return;
      }

      try {
        const [courseData, progressData, assignmentsData] = await Promise.all([
          coursesApi.get(courseId, accessToken),
          progressApi.get(courseId, accessToken),
          assignmentsApi.listByCourse(courseId, accessToken),
        ]);

        setCourse(courseData.course);
        setProgress(progressData.progress);
        setAssignments(assignmentsData.assignments);
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
    return (
      <div className="flex gap-8 animate-pulse">
        <aside className="w-80 shrink-0">
          <div className="h-96 bg-gray-200 rounded-xl" />
        </aside>
        <main className="flex-1">
          <div className="h-64 bg-gray-200 rounded-xl" />
        </main>
      </div>
    );
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

  const isAssignmentSubmitted = (assignmentId: string) => {
    return progress.submissions?.some((s) => s.assignmentId === assignmentId);
  };

  const getAssignmentForModule = (moduleId: string) => {
    const module = course.modules.find((m) => m._id === moduleId);
    if (!module?.assignmentId) return null;
    return assignments.find((a) => a._id === module.assignmentId);
  };

  const totalResources =
    course.modules?.reduce((acc, m) => acc + (m.resources?.length || 0), 0) || 0;
  
  const totalAssignments = course.modules?.filter((m) => m.assignmentId).length || 0;
  const totalItems = totalResources + totalAssignments;

  const completedResourceCount =
    (progress.completedVideos?.length || 0) + (progress.completedDocuments?.length || 0);
  const completedAssignmentCount = course.modules?.filter(
    (m) => m.assignmentId && isAssignmentSubmitted(m.assignmentId)
  ).length || 0;
  const completedCount = completedResourceCount + completedAssignmentCount;

  const progressPercent =
    totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar - Course Navigation */}
      <aside className="w-full lg:w-80 shrink-0 order-2 lg:order-1">
        <div className="lg:sticky lg:top-24 bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* Course Header */}
          <div className="p-4 border-b border-gray-100">
            <Link
              href={`/courses/${courseId}`}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Overview
            </Link>
            <h2 className="font-semibold line-clamp-2">{course.title}</h2>
          </div>

          {/* Progress */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Your Progress</span>
              <span className="font-semibold text-violet-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-violet-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {completedCount} of {totalItems} items completed
            </p>
          </div>

          {/* Modules & Resources */}
          <div className="max-h-[50vh] overflow-y-auto">
            {course.modules?.map((module, mIdx) => {
              const moduleAssignment = getAssignmentForModule(module._id);
              const assignmentSubmitted = module.assignmentId
                ? isAssignmentSubmitted(module.assignmentId)
                : false;

              return (
                <div key={module._id} className="border-b border-gray-100 last:border-0">
                  <div className="px-4 py-3 bg-gray-50/50">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Module {mIdx + 1}
                    </span>
                    <h3 className="font-medium text-sm mt-0.5">{module.title}</h3>
                  </div>
                  <div className="py-1">
                    {/* Resources */}
                    {module.resources?.map((resource) => {
                      const isComplete = isResourceComplete(resource._id, resource.type);

                      return (
                        <Link
                          key={resource._id}
                          href={`/learn/${courseId}/${resource._id}`}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-violet-50 ${
                            isComplete ? 'text-emerald-600' : 'text-gray-600'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle className="w-4 h-4 shrink-0" />
                          ) : resource.type === 'video' ? (
                            <Video className="w-4 h-4 shrink-0 text-blue-500" />
                          ) : (
                            <FileText className="w-4 h-4 shrink-0 text-emerald-500" />
                          )}
                          <span className="truncate">{resource.title}</span>
                        </Link>
                      );
                    })}

                    {/* Module Assignment */}
                    {moduleAssignment && (
                      <Link
                        href={`/learn/${courseId}/assignment/${moduleAssignment._id}`}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-violet-50 ${
                          assignmentSubmitted ? 'text-emerald-600' : 'text-violet-600'
                        }`}
                      >
                        {assignmentSubmitted ? (
                          <CheckCircle className="w-4 h-4 shrink-0" />
                        ) : (
                          <ClipboardList className="w-4 h-4 shrink-0" />
                        )}
                        <span className="truncate">{moduleAssignment.title}</span>
                        {!assignmentSubmitted && (
                          <span className="ml-auto text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded">
                            {moduleAssignment.type === 'mcq' ? 'Quiz' : 'Assignment'}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 order-1 lg:order-2">
        {/* Welcome Card */}
        <div className="bg-linear-to-br from-violet-500 to-indigo-600 rounded-2xl p-8 text-white mb-8">
          <div className="max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">
              Welcome to {course.title}
            </h1>
            <p className="text-violet-100 mb-6">
              Select a lesson from the sidebar to start learning, or continue where you left off.
            </p>

            {course.modules?.[0]?.resources?.[0] && (
              <Link href={`/learn/${courseId}/${course.modules[0].resources[0]._id}`}>
                <Button className="bg-white text-violet-600 hover:bg-violet-50">
                  <Play className="w-4 h-4 mr-2" />
                  Start First Lesson
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Course Overview */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Course Overview</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-violet-600">
                {course.modules?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Modules</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-violet-600">{totalResources}</div>
              <div className="text-sm text-gray-500">Resources</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-violet-600">{totalAssignments}</div>
              <div className="text-sm text-gray-500">Assignments</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </div>

        {/* Course Chat */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Course Discussion</h2>
          <Comments courseId={courseId} />
        </div>
      </main>
    </div>
  );
}
