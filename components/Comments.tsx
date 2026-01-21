'use client';

import { useEffect, useState, useRef } from 'react';
import { commentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
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
    return <div className="text-center py-4 text-gray-500">Loading chat...</div>;
  }

  return (
    <div className="border rounded-lg flex flex-col h-[400px]">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold">Course Chat</h3>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.userId._id === user?.id;
            
            return (
              <div
                key={comment._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-black text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {!isOwn && (
                    <div className="text-xs font-medium mb-1">
                      {comment.userId.name || comment.userId.email}
                      {comment.userId.role === 'coach' && (
                        <span className="ml-1 text-blue-500">• Coach</span>
                      )}
                    </div>
                  )}
                  <div className="break-words">{comment.content}</div>
                  <div className={`text-xs mt-1 ${isOwn ? 'text-gray-300' : 'text-gray-400'}`}>
                    {formatTime(comment.createdAt)}
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
        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newComment.trim()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      ) : (
        <div className="p-4 border-t text-center text-gray-500 text-sm">
          Log in to join the conversation
        </div>
      )}
    </div>
  );
}