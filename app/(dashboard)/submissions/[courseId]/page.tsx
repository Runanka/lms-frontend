'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
  FileText,
  MessageSquare,
} from 'lucide-react';

interface Submission {
  _id: string;
  assignmentId: string;
  submittedAt: string;
  mcqAnswers?: number[];
  subjectiveAnswers?: string[];
  score?: number;
  feedback?: string;
  gradedAt?: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  progressId: string;
}

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState<{
    [key: string]: { score: string; feedback: string };
  }>({});

  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'coach') {
      router.replace('/courses');
      return;
    }

    const fetchSubmissions = async () => {
      if (!accessToken) return;

      try {
        const data = await api<{ submissions: Submission[] }>(
          `/progress/course/${courseId}/submissions`,
          { token: accessToken }
        );
        setSubmissions(data.submissions);

        // Initialize grade inputs
        const inputs: typeof gradeInput = {};
        data.submissions.forEach((s) => {
          inputs[s._id] = {
            score: s.score?.toString() || '',
            feedback: s.feedback || '',
          };
        });
        setGradeInput(inputs);
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [courseId, accessToken, user, router]);

  const handleGrade = async (submission: Submission) => {
    if (!accessToken) return;

    const input = gradeInput[submission._id];
    if (!input) return;

    setGrading(submission._id);
    try {
      await api(`/progress/${submission.progressId}/submissions/${submission._id}/grade`, {
        method: 'PATCH',
        body: {
          score: input.score ? Number(input.score) : undefined,
          feedback: input.feedback || undefined,
        },
        token: accessToken,
      });

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === submission._id
            ? {
                ...s,
                score: Number(input.score),
                feedback: input.feedback,
                gradedAt: new Date().toISOString(),
              }
            : s
        )
      );
    } catch (err) {
      console.error('Failed to grade:', err);
    } finally {
      setGrading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const ungradedSubmissions = submissions.filter((s) => !s.gradedAt && s.subjectiveAnswers);
  const gradedSubmissions = submissions.filter((s) => s.gradedAt || s.mcqAnswers);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Student Submissions</h1>
        <p className="text-gray-500 mt-1">
          Review and grade student assignments
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
          <p className="text-gray-500">Students haven't submitted any assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Pending Grading */}
          {ungradedSubmissions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Pending Grading</h2>
                <span className="text-sm text-gray-400 ml-2">
                  {ungradedSubmissions.length} submission
                  {ungradedSubmissions.length !== 1 && 's'}
                </span>
              </div>

              <div className="space-y-4">
                {ungradedSubmissions.map((submission) => (
                  <div
                    key={submission._id}
                    className="bg-white border border-gray-100 rounded-xl p-6"
                  >
                    {/* Student Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {submission.student.name || submission.student.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            Submitted {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        Pending
                      </span>
                    </div>

                    {/* Answers */}
                    <div className="mb-6 space-y-3">
                      {submission.subjectiveAnswers?.map((answer, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                          <div className="text-xs font-medium text-gray-500 mb-2">
                            Answer {idx + 1}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{answer}</div>
                        </div>
                      ))}
                    </div>

                    {/* Grading Inputs */}
                    <div className="flex flex-col sm:flex-row gap-4 items-end border-t border-gray-100 pt-4">
                      <div className="w-full sm:w-28">
                        <label className="block text-sm font-medium mb-1.5">
                          Score (0-100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={gradeInput[submission._id]?.score || ''}
                          onChange={(e) =>
                            setGradeInput((prev) => ({
                              ...prev,
                              [submission._id]: {
                                ...prev[submission._id],
                                score: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-sm font-medium mb-1.5">
                          Feedback
                        </label>
                        <input
                          type="text"
                          value={gradeInput[submission._id]?.feedback || ''}
                          onChange={(e) =>
                            setGradeInput((prev) => ({
                              ...prev,
                              [submission._id]: {
                                ...prev[submission._id],
                                feedback: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          placeholder="Great work! Consider adding more detail..."
                        />
                      </div>
                      <Button
                        onClick={() => handleGrade(submission)}
                        disabled={grading === submission._id}
                        className="bg-violet-600 hover:bg-violet-700 shrink-0"
                      >
                        {grading === submission._id ? 'Saving...' : 'Save Grade'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Graded Submissions */}
          {gradedSubmissions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold">Graded</h2>
                <span className="text-sm text-gray-400 ml-2">
                  {gradedSubmissions.length} submission
                  {gradedSubmissions.length !== 1 && 's'}
                </span>
              </div>

              <div className="space-y-2">
                {gradedSubmissions.map((submission) => (
                  <div
                    key={submission._id}
                    className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {submission.student.name || submission.student.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {submission.feedback && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MessageSquare className="w-4 h-4" />
                          <span className="max-w-[200px] truncate">{submission.feedback}</span>
                        </div>
                      )}
                      <div
                        className={`text-2xl font-bold ${
                          (submission.score || 0) >= 70 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {submission.score}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
