import { useState } from 'react';
import api from '../../lib/api';
import { toast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Send } from 'lucide-react';

export default function CommentForm({ postId, parentId, onSuccess, onCancel, placeholder = 'Write a comment...' }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comments`, {
        content: content.trim(),
        parentId: parentId || null,
      });
      toast.success('Comment posted!');
      setContent('');
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Please sign in to comment';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 shadow-sm"
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs text-zinc-500 hover:text-zinc-800"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          size="sm"
          className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-3 py-1.5 h-8"
        >
          <Send className="h-3 w-3 mr-1" />
          {isSubmitting ? 'Posting...' : 'Comment'}
        </Button>
      </div>
    </form>
  );
}
