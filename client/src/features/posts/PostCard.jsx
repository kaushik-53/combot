import { useState } from 'react';
import { ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import CommentSection from '../comments/CommentSection';

const STATUS_BADGES = {
  under_review: { label: 'UNDER REVIEW', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  planned:      { label: 'PLANNED',      className: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress:  { label: 'IN PROGRESS',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  shipped:      { label: 'SHIPPED',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function PostCard({ post, onVoteToggle, currentUserId }) {
  const [showComments, setShowComments] = useState(false);
  const isVoted = currentUserId && post.voters?.includes(currentUserId);
  const statusInfo = STATUS_BADGES[post.status] || STATUS_BADGES.under_review;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-zinc-200/90 shadow-sm rounded-xl p-5 space-y-4 hover:border-zinc-300 transition-all">
      <div className="flex items-start gap-4">
        {/* Vote button */}
        <button
          onClick={() => onVoteToggle && onVoteToggle(post._id)}
          className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold min-w-12 transition-all ${
            isVoted
              ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5 mb-0.5" />
          <span>{post.voteCount ?? 0}</span>
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
            <span className="capitalize text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              {post.category}
            </span>
            <span className="text-zinc-400">• Posted by {post.author?.name || 'Anonymous'}</span>
            <span className="text-zinc-400">• {formatDate(post.createdAt)}</span>
          </div>

          <h3 className="text-base font-bold text-zinc-900 leading-snug">{post.title}</h3>

          <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
            {post.description}
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 font-medium transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Discussion</span>
              {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable comments section */}
      {showComments && <CommentSection postId={post._id} />}
    </div>
  );
}
