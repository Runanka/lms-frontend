'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { coursesApi, assignmentsApi } from '@/lib/api';
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
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import type { Assignment } from '@/types';

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
  const [showAssignmentModal, setShowAssignmentModal] = useState<{ moduleIndex: number; moduleId?: string } | null>(null);

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
      setModules(
        course.modules.map((m) => ({
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
        }))
      );
      setAssignments(assignmentsRes.assignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  // Validation
  const validateCourse = (): string | null => {
    if (!title.trim()) return 'Course title is required';
    if (modules.length === 0) return 'Course must have at least one module';

    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      if (!m.title.trim()) return `Module ${i + 1} needs a title`;
      
      const hasContent = m.resources.length > 0 || m.assignmentId;
      if (!hasContent) return `Module "${m.title || i + 1}" must have at least one resource or assignment`;

      for (let j = 0; j < m.resources.length; j++) {
        const r = m.resources[j];
        if (!r.title.trim()) return `Resource in module "${m.title}" needs a title`;
        if (r.type === 'video' && !r.youtubeUrl?.trim()) {
          return `Video "${r.title || 'Untitled'}" in module "${m.title}" needs a YouTube URL`;
        }
        if (r.type === 'document' && !r.content?.trim()) {
          return `Document "${r.title || 'Untitled'}" in module "${m.title}" needs content`;
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    if (!accessToken) return;

    const validationError = validateCourse();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await coursesApi.update(
        id,
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

  // Assignment handlers
  const getAssignmentForModule = (moduleIndex: number) => {
    const assignmentId = modules[moduleIndex]?.assignmentId;
    return assignments.find((a) => a._id === assignmentId);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-8" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (user?.role !== 'coach') {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Only coaches can edit courses.</p>
        <Link href="/courses">
          <Button variant="outline" className="mt-4">
            Back to Courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <Link
        href={`/courses/${id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Course
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
          <p className="text-gray-500 mt-1">Update your course content and structure</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
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
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="Course title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              placeholder="What will students learn?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Thumbnail URL</label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
            <p className="text-sm text-gray-500">
              Each module must have at least one resource or assignment
            </p>
          </div>
          <Button variant="outline" onClick={addModule}>
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </Button>
        </div>

        {modules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500 mb-3">No modules yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Add at least one module with content to save the course
            </p>
            <Button variant="outline" onClick={addModule}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Module
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => {
              const hasContent = module.resources.length > 0 || module.assignmentId;
              const assignmentData = getAssignmentForModule(moduleIndex);

              return (
                <div
                  key={moduleIndex}
                  className={`bg-white border rounded-xl overflow-hidden ${
                    !hasContent ? 'border-amber-200' : 'border-gray-100'
                  }`}
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

                    {!hasContent && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        Needs content
                      </span>
                    )}

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
                    <div className="p-4 space-y-4">
                      {/* Resources */}
                      <div>
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
                                    placeholder="Resource title *"
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
                                      placeholder="YouTube URL *"
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
                                      placeholder="Document content * (required)"
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

                      {/* Assignment */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Assignment</span>
                          {!module.assignmentId && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setShowAssignmentModal({
                                  moduleIndex,
                                  moduleId: module._id,
                                })
                              }
                              className="text-xs"
                            >
                              <ClipboardList className="w-3 h-3 mr-1" />
                              Add Assignment
                            </Button>
                          )}
                        </div>

                        {module.assignmentId && assignmentData ? (
                          <div className="flex items-center justify-between p-4 bg-violet-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                                <ClipboardList className="w-4 h-4 text-violet-600" />
                              </div>
                              <div>
                                <span className="font-medium text-sm">{assignmentData.title}</span>
                                <span className="ml-2 text-xs text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                                  {assignmentData.type === 'mcq' ? 'MCQ Quiz' : 'Subjective'}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateModule(moduleIndex, { assignmentId: undefined })}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg">
                            No assignment attached
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <AssignmentModal
          courseId={id}
          moduleId={showAssignmentModal.moduleId}
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
  moduleId,
  accessToken,
  onClose,
  onCreated,
}: {
  courseId: string;
  moduleId?: string;
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

  const validateAssignment = (): string | null => {
    if (!title.trim()) return 'Assignment title is required';

    if (type === 'mcq') {
      for (let i = 0; i < mcqQuestions.length; i++) {
        const q = mcqQuestions[i];
        if (!q.questionText.trim()) return `Question ${i + 1} needs text`;
        const filledOptions = q.options.filter((o) => o.text.trim());
        if (filledOptions.length < 2) return `Question ${i + 1} needs at least 2 options`;
        if (!q.options.some((o) => o.isCorrect && o.text.trim())) {
          return `Question ${i + 1} needs a correct answer`;
        }
      }
    } else {
      for (let i = 0; i < subjectiveQuestions.length; i++) {
        if (!subjectiveQuestions[i].questionText.trim()) {
          return `Question ${i + 1} needs text`;
        }
      }
    }

    return null;
  };

  const handleCreate = async () => {
    const validationError = validateAssignment();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const data: any = { title, type, courseId, moduleId };

      if (type === 'mcq') {
        // Filter out empty options
        data.mcqQuestions = mcqQuestions.map((q) => ({
          questionText: q.questionText,
          options: q.options.filter((o) => o.text.trim()),
        }));
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-1">Create Assignment</h3>
          <p className="text-sm text-gray-500 mb-6">
            Add a quiz or written assignment to this module
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Assignment title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'mcq' | 'subjective')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="subjective">Subjective / Written</option>
              </select>
            </div>

            {type === 'mcq' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Questions *</label>
                <div className="space-y-4">
                  {mcqQuestions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Question {qIndex + 1}</span>
                        {mcqQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setMcqQuestions(mcqQuestions.filter((_, i) => i !== qIndex))
                            }
                            className="text-red-500 text-sm hover:text-red-700"
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3"
                        placeholder="Question text *"
                      />

                      <p className="text-xs text-gray-500 mb-2">
                        Select the correct answer:
                      </p>
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
                              className="text-violet-600 focus:ring-violet-500"
                            />
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const updated = [...mcqQuestions];
                                updated[qIndex].options[optIndex].text = e.target.value;
                                setMcqQuestions(updated);
                              }}
                              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...mcqQuestions];
                                  updated[qIndex].options = updated[qIndex].options.filter(
                                    (_, i) => i !== optIndex
                                  );
                                  setMcqQuestions(updated);
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {q.options.length < 6 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...mcqQuestions];
                            updated[qIndex].options.push({ text: '', isCorrect: false });
                            setMcqQuestions(updated);
                          }}
                          className="mt-2 text-xs text-violet-600 hover:text-violet-700"
                        >
                          + Add option
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMcqQuestions([
                      ...mcqQuestions,
                      {
                        questionText: '',
                        options: [
                          { text: '', isCorrect: true },
                          { text: '', isCorrect: false },
                        ],
                      },
                    ])
                  }
                  className="mt-3 text-sm text-violet-600 hover:text-violet-700"
                >
                  + Add Question
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Questions *</label>
                <div className="space-y-3">
                  {subjectiveQuestions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Question {qIndex + 1}</span>
                        {subjectiveQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setSubjectiveQuestions(
                                subjectiveQuestions.filter((_, i) => i !== qIndex)
                              )
                            }
                            className="text-red-500 text-sm hover:text-red-700"
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-2"
                        placeholder="Question text *"
                      />

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Max words (optional):</label>
                        <input
                          type="number"
                          value={q.maxWords || ''}
                          onChange={(e) => {
                            const updated = [...subjectiveQuestions];
                            updated[qIndex].maxWords = e.target.value
                              ? parseInt(e.target.value)
                              : undefined;
                            setSubjectiveQuestions(updated);
                          }}
                          className="w-24 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                          placeholder="500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSubjectiveQuestions([...subjectiveQuestions, { questionText: '' }])
                  }
                  className="mt-3 text-sm text-violet-600 hover:text-violet-700"
                >
                  + Add Question
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
