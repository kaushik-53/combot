import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { RotateCw, MessageSquare } from 'lucide-react';

export default function CommentSection({ postId }) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}/comments`);
      return res.data;
    },
    enabled: !!postId,
  });

  const comments = data?.comments || [];

  // Group comments into top-level and nested replies map
  const topLevelComments = comments.filter((c) => !c.parent);
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parent) {
      const parentId = typeof c.parent === 'object' ? c.parent._id : c.parent;
      if (!acc[parentId]) acc[parentId] = [];
      acc[parentId].push(c);
    }
    return acc;
  }, {});

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    refetch();
  };

  return (
    <div className="pt-4 border-t border-zinc-200/80 space-y-4 text-xs">
      <div className="flex items-center gap-2 text-zinc-900 font-bold">
        <MessageSquare className="h-4 w-4 text-zinc-500" />
        <span>Discussion ({comments.length})</span>
      </div>

      {/* Top-level comment submission form */}
      <CommentForm postId={postId} onSuccess={handleRefresh} />

      {/* Comment list */}
      {isLoading ? (
        <div className="py-4 text-center text-zinc-400 flex items-center justify-center gap-2">
          <RotateCw className="h-4 w-4 animate-spin" /> Loading discussion...
        </div>
      ) : isError ? (
        <div className="text-xs text-rose-500 py-2">Failed to load comments</div>
      ) : topLevelComments.length === 0 ? (
        <p className="text-xs text-zinc-400 italic py-2">No comments yet. Start the conversation!</p>
      ) : (
        <div className="space-y-3 pt-2">
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              replies={repliesMap[comment._id] || []}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
