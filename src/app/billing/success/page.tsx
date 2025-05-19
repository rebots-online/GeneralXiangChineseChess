
import { Suspense } from 'react';
import { SessionVerifier } from './session-verifier';
import { Spinner } from '@/components/ui/spinner';

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Suspense
        fallback={
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <h1 className="text-2xl font-semibold">Loading...</h1>
            <p className="text-muted-foreground">
              Please wait while we prepare your subscription information.
            </p>
          </div>
        }
      >
        <SessionVerifier />
      </Suspense>
    </div>
  );
}