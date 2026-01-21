'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function CreateCoursePage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await coursesApi.create(
        { title, description, thumbnailUrl: thumbnailUrl || undefined },
        accessToken
      );
      router.push(`/courses/${result.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Create New Course</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. Introduction to JavaScript"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="What will students learn?"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="https://..."
          />
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}