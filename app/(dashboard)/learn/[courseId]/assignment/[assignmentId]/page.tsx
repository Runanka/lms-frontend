'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { assignmentsApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  FileQuestion,
  Trophy,
  Clock,
} from 'lucide-react';
import type { Assignment } from '@/types';

export default function AssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  // MCQ answers: index of selected option for each question
  const [mcqAnswers, setMcqAnswers] = useState<number[]>([]);
  // Subjective answers: text for each question
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<string[]>([]);

  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!accessToken) return;

      try {
        const data = await assignmentsApi.get(assignmentId, accessToken);
        setAssignment(data.assignment);

        // Initialize answers arrays
        if (data.assignment.type === 'mcq') {
          setMcqAnswers(new Array(data.assignment.mcqQuestions?.length || 0).fill(-1));
        } else {
          setSubjectiveAnswers(
            new Array(data.assignment.subjectiveQuestions?.length || 0).fill('')
          );
        }
      } catch (err) {
        console.error('Failed to fetch assignment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId, accessToken]);

  const handleMcqSelect = (questionIdx: number, optionIdx: number) => {
    setMcqAnswers((prev) => {
      const updated = [...prev];
      updated[questionIdx] = optionIdx;
      return updated;
    });
  };

  const handleSubjectiveChange = (questionIdx: number, text: string) => {
    setSubjectiveAnswers((prev) => {
      const updated = [...prev];
      updated[questionIdx] = text;
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!accessToken || !assignment) return;

    setSubmitting(true);
    try {
      if (assignment.type === 'mcq') {
        const res = await progressApi.submitMcq(
          { courseId, assignmentId, answers: mcqAnswers },
          accessToken
        );
        setResult({ score: res.score, total: res.totalQuestions });
      } else {
        await progressApi.submitSubjective(
          { courseId, assignmentId, answers: subjectiveAnswers },
          accessToken
        );
        setResult({ score: -1, total: 0 }); // -1 means pending grading
      }
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-32 bg-gray-100 rounded mb-8" />
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Assignment not found</h3>
        <p className="text-gray-500 mb-6">This assignment may have been removed.</p>
        <Link href={`/learn/${courseId}`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </Link>
      </div>
    );
  }

  // Show result after submission
  if (result) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            result.score >= 0 ? 'bg-emerald-100' : 'bg-violet-100'
          }`}
        >
          {result.score >= 0 ? (
            <Trophy className="w-10 h-10 text-emerald-600" />
          ) : (
            <Clock className="w-10 h-10 text-violet-600" />
          )}
        </div>

        {result.score >= 0 ? (
          <>
            <h1 className="text-3xl font-bold mb-3">Assignment Completed!</h1>
            <div className="text-6xl font-bold text-emerald-600 mb-2">{result.score}%</div>
            <p className="text-gray-600 mb-8">
              You answered{' '}
              {Math.round((result.score * result.total) / 100)} out of {result.total} questions
              correctly
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-3">Submitted!</h1>
            <p className="text-gray-600 mb-8">
              Your answers have been submitted successfully.
              <br />
              The coach will review and grade them soon.
            </p>
          </>
        )}

        <Link href={`/learn/${courseId}`}>
          <Button className="bg-violet-600 hover:bg-violet-700">Back to Course</Button>
        </Link>
      </div>
    );
  }

  const answeredCount =
    assignment.type === 'mcq'
      ? mcqAnswers.filter((a) => a >= 0).length
      : subjectiveAnswers.filter((a) => a.trim()).length;

  const totalQuestions =
    assignment.type === 'mcq'
      ? assignment.mcqQuestions?.length || 0
      : assignment.subjectiveQuestions?.length || 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Link */}
      <Link
        href={`/learn/${courseId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Course
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <p className="text-sm text-gray-500">
              {assignment.type === 'mcq' ? 'Multiple Choice Quiz' : 'Written Assignment'}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <div className="text-sm text-gray-600">
            {answeredCount} of {totalQuestions} answered
          </div>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* MCQ Questions */}
      {assignment.type === 'mcq' && assignment.mcqQuestions && (
        <div className="space-y-6">
          {assignment.mcqQuestions.map((q, qIdx) => (
            <div
              key={q._id}
              className="bg-white border border-gray-100 rounded-xl p-6 hover:border-violet-200 transition-colors"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0">
                  {qIdx + 1}
                </span>
                <span className="font-medium pt-0.5">{q.questionText}</span>
              </div>
              <div className="space-y-2 ml-10">
                {q.options.map((opt, oIdx) => (
                  <label
                    key={oIdx}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      mcqAnswers[qIdx] === oIdx
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-violet-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIdx}`}
                      checked={mcqAnswers[qIdx] === oIdx}
                      onChange={() => handleMcqSelect(qIdx, oIdx)}
                      className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subjective Questions */}
      {assignment.type === 'subjective' && assignment.subjectiveQuestions && (
        <div className="space-y-6">
          {assignment.subjectiveQuestions.map((q, qIdx) => (
            <div
              key={q._id}
              className="bg-white border border-gray-100 rounded-xl p-6 hover:border-violet-200 transition-colors"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0">
                  {qIdx + 1}
                </span>
                <div>
                  <span className="font-medium">{q.questionText}</span>
                  {q.maxWords && (
                    <p className="text-sm text-gray-500 mt-1">Max {q.maxWords} words</p>
                  )}
                </div>
              </div>
              <div className="ml-10">
                <textarea
                  value={subjectiveAnswers[qIdx]}
                  onChange={(e) => handleSubjectiveChange(qIdx, e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                  placeholder="Write your answer here..."
                />
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-gray-400">
                    {subjectiveAnswers[qIdx].split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-8 flex justify-end sticky bottom-6">
        <Button
          onClick={handleSubmit}
          disabled={submitting || answeredCount === 0}
          className="bg-violet-600 hover:bg-violet-700 shadow-lg"
          size="lg"
        >
          {submitting ? (
            'Submitting...'
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Assignment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
