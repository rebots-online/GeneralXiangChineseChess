'use client';

import { useEffect, useState } from 'react';
import { StandardizedBillingInterface } from '@/components/billing/StandardizedBillingInterface';
import { billingService, BillingPlan } from '@/services/billing/BillingService';
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<string | undefined>(undefined);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const [subscription, availablePlans] = await Promise.all([
        billingService.getCurrentSubscription(),
        billingService.getAvailablePlans()
      ]);
      setCurrentPlan(subscription || undefined);
      setPlans(availablePlans);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      // Default to Stripe, but you could add a payment method selector
      await billingService.subscribeToPlan(planId, 'stripe');
      await loadBillingData();
      toast({
        title: 'Success',
        description: 'Subscription updated successfully',
      });
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast({
        title: 'Error',
        description: 'Failed to process subscription',
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Subscription Plans</h1>
      <StandardizedBillingInterface
        plans={plans}
        onSubscribe={handleSubscribe}
        currentPlan={currentPlan}
      />

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">About Our Plans</h2>
        <p className="text-sm text-muted-foreground">
          Choose the plan that best suits your needs. All plans include access to our core features,
          with premium plans offering advanced features like multiplayer support and AI customization.
        </p>
        <div className="mt-4 text-sm">
          <h3 className="font-semibold mb-1">Payment Methods</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Credit/Debit Cards (via Stripe)</li>
            <li>Bitcoin Lightning Network (via WebLN)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}