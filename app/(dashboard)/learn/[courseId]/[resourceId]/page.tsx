'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { coursesApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Video,
  FileText,
  BookOpen,
} from 'lucide-react';
import type { Course, Resource, Progress } from '@/types';

export default function ResourceViewerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const resourceId = params.resourceId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      try {
        const [courseData, progressData] = await Promise.all([
          coursesApi.get(courseId, accessToken),
          progressApi.get(courseId, accessToken),
        ]);

        setCourse(courseData.course);
        setProgress(progressData.progress);

        // Find the resource
        for (const module of courseData.course.modules || []) {
          const found = module.resources?.find((r) => r._id === resourceId);
          if (found) {
            setResource(found);
            break;
          }
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, resourceId, accessToken]);

  const isComplete =
    resource &&
    progress &&
    (resource.type === 'video'
      ? progress.completedVideos?.includes(resource._id)
      : progress.completedDocuments?.includes(resource._id));

  const handleMarkComplete = async () => {
    if (!accessToken || !resource || isComplete) return;

    setMarking(true);
    try {
      await progressApi.completeResource(
        { courseId, resourceId, resourceType: resource.type },
        accessToken
      );

      // Update local progress
      setProgress((prev) => {
        if (!prev) return prev;
        const field = resource.type === 'video' ? 'completedVideos' : 'completedDocuments';
        return {
          ...prev,
          [field]: [...(prev[field] || []), resourceId],
        };
      });
    } catch (err) {
      console.error('Failed to mark complete:', err);
    } finally {
      setMarking(false);
    }
  };

  // Find next/prev resources
  const allResources: { moduleIdx: number; resource: Resource }[] = [];
  course?.modules?.forEach((m, mIdx) => {
    m.resources?.forEach((r) => {
      allResources.push({ moduleIdx: mIdx, resource: r });
    });
  });

  const currentIdx = allResources.findIndex((r) => r.resource._id === resourceId);
  const prevResource = currentIdx > 0 ? allResources[currentIdx - 1] : null;
  const nextResource = currentIdx < allResources.length - 1 ? allResources[currentIdx + 1] : null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
        <div className="aspect-video bg-gray-200 rounded-2xl mb-6" />
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Resource not found</h3>
        <p className="text-gray-500 mb-6">This resource may have been removed.</p>
        <Link href={`/learn/${courseId}`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </Link>
      </div>
    );
  }

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link
          href={`/learn/${courseId}`}
          className="text-gray-500 hover:text-violet-600 transition-colors flex items-center gap-1"
        >
          <BookOpen className="w-4 h-4" />
          {course?.title}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium truncate">{resource.title}</span>
      </div>

      {/* Resource Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            resource.type === 'video' ? 'bg-blue-100' : 'bg-emerald-100'
          }`}
        >
          {resource.type === 'video' ? (
            <Video className="w-5 h-5 text-blue-600" />
          ) : (
            <FileText className="w-5 h-5 text-emerald-600" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{resource.title}</h1>
          <p className="text-sm text-gray-500">
            {resource.type === 'video' ? 'Video Lesson' : 'Document'}
          </p>
        </div>
        {isComplete && (
          <div className="ml-auto flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Completed
          </div>
        )}
      </div>

      {/* Resource Content */}
      <div className="mb-8">
        {resource.type === 'video' && resource.youtubeUrl && (
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(resource.youtubeUrl)}`}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        {resource.type === 'document' && resource.content && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 prose prose-gray max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed">{resource.content}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
        <div className="flex gap-3 w-full sm:w-auto">
          {prevResource && (
            <Link href={`/learn/${courseId}/${prevResource.resource._id}`}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
            </Link>
          )}
          {nextResource && (
            <Link href={`/learn/${courseId}/${nextResource.resource._id}`}>
              <Button variant="outline" className="gap-2">
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        <Button
          onClick={handleMarkComplete}
          disabled={marking || isComplete === true}
          className={
            isComplete
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default'
              : 'bg-violet-600 hover:bg-violet-700'
          }
        >
          {isComplete ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : marking ? (
            'Marking...'
          ) : (
            'Mark as Complete'
          )}
        </Button>
      </div>
    </div>
  );
}
