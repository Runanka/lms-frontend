'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { coursesApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
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
    return <div className="text-center py-12">Loading course...</div>;
  }

  if (!course) {
    return <div className="text-center py-12">Course not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        {course.thumbnailUrl && (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-gray-600 mt-2">{course.description}</p>
        
        {/* Actions */}
        <div className="mt-4 flex gap-4">
          {user?.role === 'student' && !isEnrolled && (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {enrolling ? 'Enrolling...' : 'Enroll in Course'}
            </button>
          )}
          
          {isEnrolled && (
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              ✓ Enrolled
            </span>
          )}
          
          {isOwner && (
            <button
              onClick={() => router.push(`/courses/${courseId}/edit`)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Edit Course
            </button>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Modules ({course.modules?.length || 0})</h2>
        
        {course.modules?.map((module, idx) => (
          <div key={module._id} className="border rounded-lg p-4">
            <h3 className="font-medium">
              {idx + 1}. {module.title}
            </h3>
            
            {/* Resources */}
            <div className="mt-2 space-y-2">
              {module.resources?.map((resource) => (
                <div 
                  key={resource._id}
                  className="flex items-center gap-2 text-sm text-gray-600 pl-4"
                >
                  <span>{resource.type === 'video' ? '🎬' : '📄'}</span>
                  <span>{resource.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {(!course.modules || course.modules.length === 0) && (
          <p className="text-gray-500">No modules yet</p>
        )}
      </div>
    </div>
  );
}