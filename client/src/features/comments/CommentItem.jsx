import { useState } from 'react';
import CommentForm from './CommentForm';
import { MessageSquare, ShieldCheck, CornerDownRight } from 'lucide-react';

export default function CommentItem({ comment, postId, replies = [], onRefresh }) {
  const [isReplying, setIsReplying] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isAdmin = comment.author?.role === 'admin';

  return (
    <div className="space-y-2">
      <div className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
        comment.isOfficialResponse
          ? 'bg-emerald-50/60 border-emerald-200/80 shadow-sm'
          : 'bg-zinc-50/80 border-zinc-200/80'
      }`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900">{comment.author?.name || 'Anonymous'}</span>

            {isAdmin && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 text-white uppercase">
                ADMIN
              </span>
            )}

            {comment.isOfficialResponse && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> OFFICIAL RESPONSE
              </span>
            )}

            <span className="text-zinc-400">• {formatDate(comment.createdAt)}</span>
          </div>

          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-medium"
          >
            <CornerDownRight className="h-3 w-3" /> Reply
          </button>
        </div>

        <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>

      {/* Inline reply form */}
      {isReplying && (
        <div className="pl-4 border-l-2 border-zinc-200">
          <CommentForm
            postId={postId}
            parentId={comment._id}
            placeholder={`Replying to ${comment.author?.name || 'comment'}...`}
            onSuccess={() => {
              setIsReplying(false);
              if (onRefresh) onRefresh();
            }}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="pl-4 border-l-2 border-zinc-200 space-y-2 pt-1">
          {replies.map((reply) => (
            <CommentItem key={reply._id} comment={reply} postId={postId} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}
