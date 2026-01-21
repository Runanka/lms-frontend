'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

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

  const updateResource = (moduleIndex: number, resourceIndex: number, updates: Partial<ResourceInput>) => {
    const updated = [...modules];
    updated[moduleIndex].resources[resourceIndex] = {
      ...updated[moduleIndex].resources[resourceIndex],
      ...updates,
    };
    setModules(updated);
  };

  const deleteResource = (moduleIndex: number, resourceIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].resources = updated[moduleIndex].resources.filter((_, i) => i !== resourceIndex);
    setModules(updated);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Create New Course</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}

        {/* Basic Info */}
        <section className="mb-8 p-6 bg-white border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
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
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="What will students learn?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        {/* Modules */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Modules (Optional)</h2>
            <button
              type="button"
              onClick={addModule}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
            >
              + Add Module
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            You can add modules now or edit them later after creating the course.
          </p>

          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div key={moduleIndex} className="border rounded-lg bg-white">
                {/* Module Header */}
                <div className="flex items-center gap-3 p-4 border-b">
                  <span className="text-sm text-gray-500 font-mono">{moduleIndex + 1}</span>

                  <input
                    type="text"
                    value={module.title}
                    onChange={(e) => updateModule(moduleIndex, { title: e.target.value })}
                    className="flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Module title"
                  />

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveModule(moduleIndex, 'up')}
                      disabled={moduleIndex === 0}
                      className="p-1 text-gray-400 hover:text-black disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveModule(moduleIndex, 'down')}
                      disabled={moduleIndex === modules.length - 1}
                      className="p-1 text-gray-400 hover:text-black disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-black"
                  >
                    {expandedModule === moduleIndex ? 'Collapse' : 'Expand'}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteModule(moduleIndex)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>

                {/* Module Content */}
                {expandedModule === moduleIndex && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Resources</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addResource(moduleIndex, 'video')}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          + Video
                        </button>
                        <button
                          type="button"
                          onClick={() => addResource(moduleIndex, 'document')}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          + Document
                        </button>
                      </div>
                    </div>

                    {module.resources.length === 0 ? (
                      <div className="text-sm text-gray-400 py-2">No resources added</div>
                    ) : (
                      <div className="space-y-3">
                        {module.resources.map((resource, resourceIndex) => (
                          <div key={resourceIndex} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className={`text-xs px-2 py-0.5 rounded self-start ${resource.type === 'video' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                              {resource.type}
                            </span>

                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={resource.title}
                                onChange={(e) => updateResource(moduleIndex, resourceIndex, { title: e.target.value })}
                                className="w-full px-3 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                                placeholder="Resource title"
                              />

                              {resource.type === 'video' ? (
                                <input
                                  type="url"
                                  value={resource.youtubeUrl || ''}
                                  onChange={(e) => updateResource(moduleIndex, resourceIndex, { youtubeUrl: e.target.value })}
                                  className="w-full px-3 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                                  placeholder="YouTube URL"
                                />
                              ) : (
                                <textarea
                                  value={resource.content || ''}
                                  onChange={(e) => updateResource(moduleIndex, resourceIndex, { content: e.target.value })}
                                  rows={4}
                                  className="w-full px-3 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-black resize-y"
                                  placeholder="Document content (max 1000 words)"
                                />
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteResource(moduleIndex, resourceIndex)}
                              className="text-red-500 hover:text-red-700 self-start"
                            >
                              ×
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
        </section>

        {/* Submit */}
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
