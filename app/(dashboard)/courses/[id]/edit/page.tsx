'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi, assignmentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { Course, Module, Resource, Assignment } from '@/types';

type ResourceInput = {
  type: 'video' | 'document';
  title: string;
  youtubeUrl?: string;
  content?: string;
};

type ModuleInput = {
  _id?: string;
  title: string;
  order: number;
  resources: ResourceInput[];
  assignmentId?: string;
};

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Course fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [modules, setModules] = useState<ModuleInput[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // UI state
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState<{ moduleIndex: number } | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    loadCourse();
  }, [id, accessToken]);

  const loadCourse = async () => {
    try {
      const [courseRes, assignmentsRes] = await Promise.all([
        coursesApi.get(id, accessToken!),
        assignmentsApi.listByCourse(id, accessToken!),
      ]);
      
      const course = courseRes.course;
      setTitle(course.title);
      setDescription(course.description || '');
      setThumbnailUrl(course.thumbnailUrl || '');
      setModules(course.modules.map((m) => ({
        _id: m._id,
        title: m.title,
        order: m.order,
        resources: m.resources.map((r) => ({
          type: r.type,
          title: r.title,
          youtubeUrl: r.youtubeUrl,
          content: r.content,
        })),
        assignmentId: m.assignmentId,
      })));
      setAssignments(assignmentsRes.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    setError('');

    try {
      await coursesApi.update(id, {
        title,
        description,
        thumbnailUrl: thumbnailUrl || undefined,
        modules: modules.map((m, i) => ({
          ...m,
          order: i,
        })),
      } as any, accessToken);
      
      router.push(`/courses/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save course');
    } finally {
      setSaving(false);
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

  // Assignment handlers
  const getAssignmentForModule = (moduleIndex: number) => {
    const assignmentId = modules[moduleIndex]?.assignmentId;
    return assignments.find((a) => a._id === assignmentId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (user?.role !== 'coach') {
    return <div className="text-center py-12">Only coaches can edit courses.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Edit Course</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

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
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Course title"
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
          <h2 className="text-lg font-semibold">Modules</h2>
          <button
            onClick={addModule}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
          >
            + Add Module
          </button>
        </div>

        <div className="space-y-4">
          {modules.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              No modules yet. Add your first module to start building the course.
            </div>
          ) : (
            modules.map((module, moduleIndex) => (
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
                      onClick={() => moveModule(moduleIndex, 'up')}
                      disabled={moduleIndex === 0}
                      className="p-1 text-gray-400 hover:text-black disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveModule(moduleIndex, 'down')}
                      disabled={moduleIndex === modules.length - 1}
                      className="p-1 text-gray-400 hover:text-black disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  <button
                    onClick={() => setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-black"
                  >
                    {expandedModule === moduleIndex ? 'Collapse' : 'Expand'}
                  </button>

                  <button
                    onClick={() => deleteModule(moduleIndex)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Delete module"
                  >
                    ×
                  </button>
                </div>

                {/* Module Content (expanded) */}
                {expandedModule === moduleIndex && (
                  <div className="p-4 space-y-4">
                    {/* Resources */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Resources</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addResource(moduleIndex, 'video')}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            + Video
                          </button>
                          <button
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
                              <span className={`text-xs px-2 py-0.5 rounded self-start ${
                                resource.type === 'video' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
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

                    {/* Assignment */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Assignment</span>
                        {!module.assignmentId && (
                          <button
                            onClick={() => setShowAssignmentModal({ moduleIndex })}
                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                          >
                            + Add Assignment
                          </button>
                        )}
                      </div>

                      {module.assignmentId ? (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">
                              {getAssignmentForModule(moduleIndex)?.title || 'Assignment'}
                            </span>
                            <span className="ml-2 text-xs text-purple-600">
                              ({getAssignmentForModule(moduleIndex)?.type})
                            </span>
                          </div>
                          <button
                            onClick={() => updateModule(moduleIndex, { assignmentId: undefined })}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 py-2">No assignment attached</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <AssignmentModal
          courseId={id}
          accessToken={accessToken!}
          onClose={() => setShowAssignmentModal(null)}
          onCreated={(assignmentId, assignment) => {
            updateModule(showAssignmentModal.moduleIndex, { assignmentId });
            setAssignments([...assignments, assignment]);
            setShowAssignmentModal(null);
          }}
        />
      )}
    </div>
  );
}

// Assignment creation modal component
function AssignmentModal({
  courseId,
  accessToken,
  onClose,
  onCreated,
}: {
  courseId: string;
  accessToken: string;
  onClose: () => void;
  onCreated: (assignmentId: string, assignment: Assignment) => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'mcq' | 'subjective'>('mcq');
  const [mcqQuestions, setMcqQuestions] = useState<
    { questionText: string; options: { text: string; isCorrect: boolean }[] }[]
  >([{ questionText: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }]);
  const [subjectiveQuestions, setSubjectiveQuestions] = useState<
    { questionText: string; maxWords?: number }[]
  >([{ questionText: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setSaving(true);
    setError('');

    try {
      const data: any = { title, type, courseId };
      
      if (type === 'mcq') {
        data.mcqQuestions = mcqQuestions;
      } else {
        data.subjectiveQuestions = subjectiveQuestions;
      }

      const result = await assignmentsApi.create(data, accessToken);
      
      // Fetch the created assignment to get full data
      const { assignment } = await assignmentsApi.get(result.assignmentId, accessToken);
      onCreated(result.assignmentId, assignment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Create Assignment</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Assignment title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'mcq' | 'subjective')}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="subjective">Subjective</option>
              </select>
            </div>

            {type === 'mcq' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Questions</label>
                <div className="space-y-4">
                  {mcqQuestions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Question {qIndex + 1}</span>
                        {mcqQuestions.length > 1 && (
                          <button
                            onClick={() => setMcqQuestions(mcqQuestions.filter((_, i) => i !== qIndex))}
                            className="text-red-500 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...mcqQuestions];
                          updated[qIndex].questionText = e.target.value;
                          setMcqQuestions(updated);
                        }}
                        className="w-full px-3 py-2 border rounded mb-3"
                        placeholder="Question text"
                      />

                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={opt.isCorrect}
                              onChange={() => {
                                const updated = [...mcqQuestions];
                                updated[qIndex].options = updated[qIndex].options.map((o, i) => ({
                                  ...o,
                                  isCorrect: i === optIndex,
                                }));
                                setMcqQuestions(updated);
                              }}
                            />
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const updated = [...mcqQuestions];
                                updated[qIndex].options[optIndex].text = e.target.value;
                                setMcqQuestions(updated);
                              }}
                              className="flex-1 px-3 py-1 border rounded text-sm"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            {q.options.length > 2 && (
                              <button
                                onClick={() => {
                                  const updated = [...mcqQuestions];
                                  updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
                                  setMcqQuestions(updated);
                                }}
                                className="text-red-400 text-sm"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {q.options.length < 6 && (
                        <button
                          onClick={() => {
                            const updated = [...mcqQuestions];
                            updated[qIndex].options.push({ text: '', isCorrect: false });
                            setMcqQuestions(updated);
                          }}
                          className="mt-2 text-xs text-blue-600"
                        >
                          + Add option
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setMcqQuestions([...mcqQuestions, {
                    questionText: '',
                    options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
                  }])}
                  className="mt-3 text-sm text-blue-600"
                >
                  + Add Question
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Questions</label>
                <div className="space-y-3">
                  {subjectiveQuestions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Question {qIndex + 1}</span>
                        {subjectiveQuestions.length > 1 && (
                          <button
                            onClick={() => setSubjectiveQuestions(subjectiveQuestions.filter((_, i) => i !== qIndex))}
                            className="text-red-500 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <textarea
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...subjectiveQuestions];
                          updated[qIndex].questionText = e.target.value;
                          setSubjectiveQuestions(updated);
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border rounded mb-2"
                        placeholder="Question text"
                      />
                      
                      <input
                        type="number"
                        value={q.maxWords || ''}
                        onChange={(e) => {
                          const updated = [...subjectiveQuestions];
                          updated[qIndex].maxWords = e.target.value ? parseInt(e.target.value) : undefined;
                          setSubjectiveQuestions(updated);
                        }}
                        className="w-32 px-3 py-1 border rounded text-sm"
                        placeholder="Max words"
                      />
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setSubjectiveQuestions([...subjectiveQuestions, { questionText: '' }])}
                  className="mt-3 text-sm text-blue-600"
                >
                  + Add Question
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !title}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

