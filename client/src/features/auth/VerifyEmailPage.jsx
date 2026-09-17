import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function VerifyEmailPage() {
  const [params]  = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }

    api.post('/auth/verify-email', null, { params: { token } })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error?.message ?? 'Verification failed.');
      });
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Verifying…'}
            {status === 'success' && '✓ Email verified!'}
            {status === 'error'   && 'Verification failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your account is active. You can now sign in.'}
            {status === 'error'   && (message || 'The link may have expired or already been used.')}
          </CardDescription>
        </CardHeader>
        {status !== 'loading' && (
          <CardContent>
            <Button id="verify-goto-login" asChild className="w-full">
              <Link to="/login">Go to sign in</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
