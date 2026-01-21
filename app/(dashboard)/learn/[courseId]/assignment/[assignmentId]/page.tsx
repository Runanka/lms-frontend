'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assignmentsApi, progressApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
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
          setSubjectiveAnswers(new Array(data.assignment.subjectiveQuestions?.length || 0).fill(''));
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
    return <div className="text-center py-12">Loading assignment...</div>;
  }

  if (!assignment) {
    return <div className="text-center py-12">Assignment not found</div>;
  }

  // Show result after submission
  if (result) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="mb-8">
          {result.score >= 0 ? (
            <>
              <h1 className="text-3xl font-bold mb-4">Assignment Completed!</h1>
              <div className="text-6xl font-bold mb-2">{result.score}%</div>
              <p className="text-gray-600">
                You answered correctly on {Math.round(result.score * result.total / 100)} out of {result.total} questions
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-4">Submitted!</h1>
              <p className="text-gray-600">
                Your answers have been submitted. The coach will grade them soon.
              </p>
            </>
          )}
        </div>
        
        <button
          onClick={() => router.push(`/learn/${courseId}`)}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Back to Course
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
      <p className="text-gray-500 mb-8">
        {assignment.type === 'mcq' ? 'Multiple Choice Quiz' : 'Written Assignment'}
      </p>

      {/* MCQ Questions */}
      {assignment.type === 'mcq' && assignment.mcqQuestions && (
        <div className="space-y-8">
          {assignment.mcqQuestions.map((q, qIdx) => (
            <div key={q._id} className="border rounded-lg p-6">
              <div className="font-medium mb-4">
                {qIdx + 1}. {q.questionText}
              </div>
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => (
                  <label
                    key={oIdx}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      mcqAnswers[qIdx] === oIdx ? 'border-black bg-gray-50' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIdx}`}
                      checked={mcqAnswers[qIdx] === oIdx}
                      onChange={() => handleMcqSelect(qIdx, oIdx)}
                      className="w-4 h-4"
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subjective Questions */}
      {assignment.type === 'subjective' && assignment.subjectiveQuestions && (
        <div className="space-y-8">
          {assignment.subjectiveQuestions.map((q, qIdx) => (
            <div key={q._id} className="border rounded-lg p-6">
              <div className="font-medium mb-2">
                {qIdx + 1}. {q.questionText}
              </div>
              {q.maxWords && (
                <div className="text-sm text-gray-500 mb-3">
                  Max {q.maxWords} words
                </div>
              )}
              <textarea
                value={subjectiveAnswers[qIdx]}
                onChange={(e) => handleSubjectiveChange(qIdx, e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Write your answer here..."
              />
              <div className="text-sm text-gray-400 mt-1">
                {subjectiveAnswers[qIdx].split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Assignment'}
        </button>
      </div>
    </div>
  );
}