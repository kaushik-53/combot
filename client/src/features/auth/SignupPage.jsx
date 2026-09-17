import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { toast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';

const schema = z.object({
  name:     z.string().min(1, 'Name is required').max(100),
  email:    z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
});

export default function SignupPage() {
  const navigate = useNavigate();
  const [verifyLink, setVerifyLink] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data) {
    try {
      const res = await api.post('/auth/signup', {
        name:     data.name,
        email:    data.email,
        password: data.password,
      });
      toast.success('Account created! Check your email to verify.');
      // In dev, the server returns verifyLink — show it in the UI
      if (res.data.verifyLink) setVerifyLink(res.data.verifyLink);
      else navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Signup failed. Please try again.';
      toast.error(msg);
    }
  }

  // Dev-only: show the verification link after successful signup
  if (verifyLink) {
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
          <CardHeader>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              In production an email would be sent. For this demo, click the link below:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm break-all font-mono">
              {verifyLink}
            </div>
            <Button
              id="verify-link-btn"
              className="w-full"
              onClick={() => navigate(verifyLink.replace('/api/auth/verify-email', '/verify-email'))}
            >
              Verify email
            </Button>
          </CardContent>
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
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Start submitting and voting on feature requests</CardDescription>
        </CardHeader>

        <CardContent>
          <form id="signup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input id="signup-name" placeholder="enter full name" autoComplete="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" placeholder="enter your email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input id="signup-password" type="password" placeholder="••••••••" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm">Confirm password</Label>
              <Input id="signup-confirm" type="password" placeholder="••••••••" autoComplete="new-password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              id="signup-submit"
              type="submit"
              form="signup-form"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Separator />
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
