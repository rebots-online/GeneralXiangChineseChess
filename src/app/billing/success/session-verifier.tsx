'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function SessionVerifier() {
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      toast({
        title: 'Error',
        description: 'Invalid checkout session',
        variant: 'destructive',
      });
      router.push('/billing');
      return;
    }

    verifySession(sessionId);
  }, [searchParams, router, toast]);

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/billing/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify session');
      }

      toast({
        title: 'Success',
        description: 'Your subscription has been activated!',
      });

      // Redirect to billing page after a short delay
      setTimeout(() => {
        router.push('/billing');
      }, 2000);
    } catch (error) {
      console.error('Error verifying session:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify subscription',
        variant: 'destructive',
      });
      router.push('/billing');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      {isVerifying ? (
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <h1 className="text-2xl font-semibold">Verifying your subscription...</h1>
          <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Thank you for subscribing!</h1>
          <p className="text-muted-foreground">Redirecting you back to the billing page...</p>
        </div>
      )}
    </>
  );
}
