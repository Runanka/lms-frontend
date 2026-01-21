'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

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
  const [gradeInput, setGradeInput] = useState<{ [key: string]: { score: string; feedback: string } }>({});
  
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
      await api(
        `/progress/${submission.progressId}/submissions/${submission._id}/grade`,
        {
          method: 'PATCH',
          body: {
            score: input.score ? Number(input.score) : undefined,
            feedback: input.feedback || undefined,
          },
          token: accessToken,
        }
      );
      
      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === submission._id
            ? { ...s, score: Number(input.score), feedback: input.feedback, gradedAt: new Date().toISOString() }
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
    return <div className="text-center py-12">Loading submissions...</div>;
  }

  const ungradedSubmissions = submissions.filter((s) => !s.gradedAt && s.subjectiveAnswers);
  const gradedSubmissions = submissions.filter((s) => s.gradedAt || s.mcqAnswers);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/courses" className="text-gray-500 hover:text-black">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Student Submissions</h1>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No submissions yet
        </div>
      ) : (
        <>
          {/* Pending Grading */}
          {ungradedSubmissions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                Pending Grading ({ungradedSubmissions.length})
              </h2>
              <div className="space-y-4">
                {ungradedSubmissions.map((submission) => (
                  <div key={submission._id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-medium">
                          {submission.student.name || submission.student.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          Submitted {new Date(submission.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                        Pending
                      </span>
                    </div>
                    
                    {/* Show answers */}
                    <div className="mb-4 space-y-3">
                      {submission.subjectiveAnswers?.map((answer, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-500 mb-1">Answer {idx + 1}</div>
                          <div className="whitespace-pre-wrap">{answer}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Grading inputs */}
                    <div className="flex gap-4 items-end">
                      <div className="w-24">
                        <label className="block text-sm mb-1">Score (0-100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={gradeInput[submission._id]?.score || ''}
                          onChange={(e) =>
                            setGradeInput((prev) => ({
                              ...prev,
                              [submission._id]: { ...prev[submission._id], score: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm mb-1">Feedback</label>
                        <input
                          type="text"
                          value={gradeInput[submission._id]?.feedback || ''}
                          onChange={(e) =>
                            setGradeInput((prev) => ({
                              ...prev,
                              [submission._id]: { ...prev[submission._id], feedback: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Good work!"
                        />
                      </div>
                      <button
                        onClick={() => handleGrade(submission)}
                        disabled={grading === submission._id}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      >
                        {grading === submission._id ? 'Saving...' : 'Grade'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graded Submissions */}
          {gradedSubmissions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Graded ({gradedSubmissions.length})
              </h2>
              <div className="space-y-2">
                {gradedSubmissions.map((submission) => (
                  <div key={submission._id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {submission.student.name || submission.student.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{submission.score}%</div>
                      {submission.feedback && (
                        <div className="text-sm text-gray-500">{submission.feedback}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}