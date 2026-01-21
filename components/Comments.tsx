'use client';

import { useEffect, useState, useRef } from 'react';
import { commentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, User } from 'lucide-react';
import type { Comment } from '@/types';

interface CommentsProps {
  courseId: string;
}

export default function Comments({ courseId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await commentsApi.list(courseId, accessToken || undefined);
        setComments(data.comments);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Poll for new comments every 10 seconds
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [courseId, accessToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newComment.trim()) return;

    setSending(true);
    try {
      const { comment } = await commentsApi.create(courseId, newComment.trim(), accessToken);
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="border border-gray-100 rounded-xl h-[400px] flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading discussion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-xl flex flex-col h-[400px] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-violet-600" />
        <h3 className="font-semibold text-sm">Course Chat</h3>
        <span className="text-xs text-gray-400 ml-auto">
          {comments.length} message{comments.length !== 1 && 's'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">Be the first to start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.userId._id === user?.id;

            return (
              <div
                key={comment._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isOwn ? 'bg-violet-100' : 'bg-gray-100'
                    }`}
                  >
                    <User
                      className={`w-4 h-4 ${isOwn ? 'text-violet-600' : 'text-gray-500'}`}
                    />
                  </div>

                  {/* Message Bubble */}
                  <div>
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          {comment.userId.name || comment.userId.email}
                        </span>
                        {comment.userId.role === 'coach' && (
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                            Coach
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isOwn
                          ? 'bg-violet-600 text-white rounded-tr-md'
                          : 'bg-gray-100 text-gray-900 rounded-tl-md'
                      }`}
                    >
                      <p className="text-sm break-words">{comment.content}</p>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-right text-gray-400' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(comment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {accessToken ? (
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-gray-100 bg-gray-50/50 flex gap-2"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={sending || !newComment.trim()}
            className="bg-violet-600 hover:bg-violet-700 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      ) : (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
          <p className="text-sm text-gray-500">Log in to join the conversation</p>
        </div>
      )}
    </div>
  );
}
