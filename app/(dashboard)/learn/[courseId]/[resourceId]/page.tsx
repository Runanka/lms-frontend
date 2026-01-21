'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { coursesApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
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

  const isComplete = resource && progress && (
    resource.type === 'video'
      ? progress.completedVideos?.includes(resource._id)
      : progress.completedDocuments?.includes(resource._id)
  );

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
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!resource) {
    return <div className="text-center py-12">Resource not found</div>;
  }

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-500">
        <Link href={`/learn/${courseId}`} className="hover:text-black">
          {course?.title}
        </Link>
        <span className="mx-2">/</span>
        <span>{resource.title}</span>
      </div>

      {/* Resource Content */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">{resource.title}</h1>
        
        {resource.type === 'video' && resource.youtubeUrl && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(resource.youtubeUrl)}`}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}
        
        {resource.type === 'document' && resource.content && (
          <div className="prose max-w-none bg-white border rounded-lg p-8">
            {/* Simple rendering - you might want to add markdown support */}
            <div className="whitespace-pre-wrap">{resource.content}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex gap-4">
          {prevResource && (
            <Link
              href={`/learn/${courseId}/${prevResource.resource._id}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              ← Previous
            </Link>
          )}
          {nextResource && (
            <Link
              href={`/learn/${courseId}/${nextResource.resource._id}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Next →
            </Link>
          )}
        </div>
        
        <button
          onClick={handleMarkComplete}
          disabled={marking === true || isComplete === true}
          className={`px-6 py-2 rounded-lg ${
            isComplete
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-black text-white hover:bg-gray-800'
          } disabled:opacity-50`}
        >
          {isComplete ? '✓ Completed' : marking ? 'Marking...' : 'Mark as Complete'}
        </button>
      </div>
    </div>
  );
}