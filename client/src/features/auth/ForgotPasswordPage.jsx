import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { toast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data) {
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email });
      setSubmitted(true);
      // Show reset link in dev
      if (res.data.resetLink) setResetLink(res.data.resetLink);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md mb-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 font-bold text-sm text-foreground">
            <div className="h-6 w-6 rounded bg-foreground text-background flex items-center justify-center text-xs font-extrabold">
              C
            </div>
            <span>Combot</span>
          </Link>
        </div>

        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If that address is registered, a reset link is on its way.
            </CardDescription>
          </CardHeader>
          {resetLink && (
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">(Dev mode — reset link:)</p>
              <div className="rounded-md bg-muted p-3 text-sm break-all font-mono">{resetLink}</div>
              <Button id="forgot-goto-reset" asChild className="w-full">
                <Link to={`/reset-password${resetLink.split('/reset-password')[1] || ''}`}>
                  Go to reset password
                </Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 font-bold text-sm text-foreground">
          <div className="h-6 w-6 rounded bg-foreground text-background flex items-center justify-center text-xs font-extrabold">
            C
          </div>
          <span>Combot</span>
        </Link>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="forgot-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" placeholder="enter your email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <Button id="forgot-submit" type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
