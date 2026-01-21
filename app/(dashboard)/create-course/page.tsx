'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Video,
  FileText,
  GripVertical,
} from 'lucide-react';

type ResourceInput = {
  type: 'video' | 'document';
  title: string;
  youtubeUrl?: string;
  content?: string;
};

type ModuleInput = {
  title: string;
  order: number;
  resources: ResourceInput[];
};

export default function CreateCoursePage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [modules, setModules] = useState<ModuleInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UI state
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setLoading(true);
    setError('');

    try {
      const result = await coursesApi.create(
        {
          title,
          description,
          thumbnailUrl: thumbnailUrl || undefined,
          modules: modules.map((m, i) => ({
            ...m,
            order: i,
          })),
        } as any,
        accessToken
      );
      router.push(`/courses/${result.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  // Module handlers
  const addModule = () => {
    setModules([...modules, { title: '', order: modules.length, resources: [] }]);
    setExpandedModule(modules.length);
  };

  const updateModule = (index: number, updates: Partial<ModuleInput>) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], ...updates };
    setModules(updated);
  };

  const deleteModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
    if (expandedModule === index) setExpandedModule(null);
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === modules.length - 1) return;

    const updated = [...modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setModules(updated);
  };

  // Resource handlers
  const addResource = (moduleIndex: number, type: 'video' | 'document') => {
    const updated = [...modules];
    updated[moduleIndex].resources.push({
      type,
      title: '',
      ...(type === 'video' ? { youtubeUrl: '' } : { content: '' }),
    });
    setModules(updated);
  };

  const updateResource = (
    moduleIndex: number,
    resourceIndex: number,
    updates: Partial<ResourceInput>
  ) => {
    const updated = [...modules];
    updated[moduleIndex].resources[resourceIndex] = {
      ...updated[moduleIndex].resources[resourceIndex],
      ...updates,
    };
    setModules(updated);
  };

  const deleteResource = (moduleIndex: number, resourceIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].resources = updated[moduleIndex].resources.filter(
      (_, i) => i !== resourceIndex
    );
    setModules(updated);
  };

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

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
        <p className="text-gray-500 mt-1">Build your course with modules and resources</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <section className="mb-8 p-6 bg-white border border-gray-100 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="e.g. Introduction to JavaScript"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                placeholder="What will students learn?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        {/* Modules */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Modules</h2>
              <p className="text-sm text-gray-500">Organize your course content</p>
            </div>
            <Button type="button" variant="outline" onClick={addModule}>
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>

          {modules.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-500 mb-3">No modules yet</p>
              <Button type="button" variant="outline" onClick={addModule}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Module
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <div
                  key={moduleIndex}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                >
                  {/* Module Header */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50/50 border-b border-gray-100">
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded text-xs font-semibold flex items-center justify-center">
                      {moduleIndex + 1}
                    </span>

                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => updateModule(moduleIndex, { title: e.target.value })}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Module title"
                    />

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveModule(moduleIndex, 'up')}
                        disabled={moduleIndex === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveModule(moduleIndex, 'down')}
                        disabled={moduleIndex === modules.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex)
                      }
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-violet-600 transition-colors"
                    >
                      {expandedModule === moduleIndex ? 'Collapse' : 'Expand'}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteModule(moduleIndex)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Module Content */}
                  {expandedModule === moduleIndex && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Resources</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addResource(moduleIndex, 'video')}
                            className="text-xs"
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addResource(moduleIndex, 'document')}
                            className="text-xs"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Document
                          </Button>
                        </div>
                      </div>

                      {module.resources.length === 0 ? (
                        <div className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg">
                          No resources added yet
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {module.resources.map((resource, resourceIndex) => (
                            <div
                              key={resourceIndex}
                              className="flex gap-3 p-4 bg-gray-50 rounded-lg"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  resource.type === 'video'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-emerald-100 text-emerald-600'
                                }`}
                              >
                                {resource.type === 'video' ? (
                                  <Video className="w-4 h-4" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </div>

                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={resource.title}
                                  onChange={(e) =>
                                    updateResource(moduleIndex, resourceIndex, {
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                  placeholder="Resource title"
                                />

                                {resource.type === 'video' ? (
                                  <input
                                    type="url"
                                    value={resource.youtubeUrl || ''}
                                    onChange={(e) =>
                                      updateResource(moduleIndex, resourceIndex, {
                                        youtubeUrl: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                    placeholder="YouTube URL"
                                  />
                                ) : (
                                  <textarea
                                    value={resource.content || ''}
                                    onChange={(e) =>
                                      updateResource(moduleIndex, resourceIndex, {
                                        content: e.target.value,
                                      })
                                    }
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y"
                                    placeholder="Document content (max 1000 words)"
                                  />
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => deleteResource(moduleIndex, resourceIndex)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors self-start"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
