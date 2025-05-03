'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CancellationDetails {
  endDate: string;
  remainingDays: number;
  planName: string;
}

export default function CancelPage() {
  const [details, setDetails] = useState<CancellationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadCancellationDetails();
  }, []);

  const loadCancellationDetails = async () => {
    try {
      const response = await fetch('/api/billing/current-subscription');
      if (!response.ok) throw new Error('Failed to load subscription details');
      
      const data = await response.json();
      if (!data.expiresAt) {
        toast({
          title: 'Error',
          description: 'No active subscription found',
          variant: 'destructive',
        });
        router.push('/billing');
        return;
      }

      const endDate = new Date(data.expiresAt);
      const now = new Date();
      const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      setDetails({
        endDate: endDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        remainingDays,
        planName: data.planId.charAt(0).toUpperCase() + data.planId.slice(1)
      });
    } catch (error) {
      console.error('Error loading cancellation details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      const response = await fetch('/api/billing/reactivate', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reactivate subscription');

      toast({
        title: 'Success',
        description: 'Your subscription has been reactivated',
      });

      router.push('/billing');
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to reactivate subscription',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You don't have an active subscription to cancel.</p>
            <Button onClick={() => router.push('/billing')}>View Plans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Subscription Details</h3>
            <p className="text-muted-foreground">Your {details.planName} plan has been cancelled.</p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="mb-2">
              You still have access to premium features until your current billing period ends on:
            </p>
            <p className="text-lg font-semibold">{details.endDate}</p>
            <p className="text-sm text-muted-foreground mt-1">
              ({details.remainingDays} days remaining)
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleReactivate} className="w-full">
              Reactivate Subscription
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/billing')}
              className="w-full"
            >
              Return to Billing
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team for assistance with your subscription.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}