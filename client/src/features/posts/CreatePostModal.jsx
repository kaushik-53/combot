import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import api from '../../lib/api';
import { toast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { X, Plus, Sparkles } from 'lucide-react';

const schema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  category: z.enum(['feature', 'bug', 'integration', 'ux', 'other']),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
});

export default function CreatePostModal({ isOpen, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: 'feature',
      description: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/posts', values);
      toast.success('Feature request submitted!');
      reset();
      onClose();
      if (onSuccess) onSuccess(res.data.post);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to submit request';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl w-full max-w-lg p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-zinc-700" />
            Submit a Feature Request
          </h2>
          <p className="text-xs text-zinc-500">
            Share your idea with the community. You will automatically upvote your submission.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-zinc-700">
              Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Dark mode theme customizer"
              {...register('title')}
              className="border-zinc-200 focus:border-zinc-900 text-sm"
            />
            {errors.title && (
              <p className="text-xs text-rose-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-semibold text-zinc-700">
              Category
            </Label>
            <select
              id="category"
              {...register('category')}
              className="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 shadow-sm"
            >
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Fix</option>
              <option value="integration">Integration</option>
              <option value="ux">UX / Design</option>
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <p className="text-xs text-rose-500">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-zinc-700">
              Description (Markdown supported)
            </Label>

            <textarea
              id="description"
              rows={5}
              placeholder="Explain the problem this solves and how it should work..."
              {...register('description')}
              className="w-full bg-white border border-zinc-200 rounded-md p-3 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 shadow-sm"
            />
            {errors.description && (
              <p className="text-xs text-rose-500">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-200 text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
