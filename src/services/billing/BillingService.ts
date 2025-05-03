import { Stripe } from '@stripe/stripe-js';

export interface BillingPermission {
  id: string;
  name: string;
  description: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: string;
  currency: string;
  interval: string;
  features: Array<{
    name: string;
    included: boolean;
  }>;
  permissions: string[];
  popular?: boolean;
  stripePriceId?: string;
  weblnPaymentRequest?: {
    amount: number;
    memo: string;
  };
}

export type PaymentProvider = 'stripe' | 'webln';

class BillingService {
  private static instance: BillingService;
  private initialized: boolean = false;
  private stripe: Stripe | null = null;

  private constructor() {}

  static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  async initialize(stripePublicKey: string): Promise<void> {
    if (this.initialized) return;
    
    try {
      const { loadStripe } = await import('@stripe/stripe-js');
      this.stripe = await loadStripe(stripePublicKey);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  async getAvailablePlans(): Promise<BillingPlan[]> {
    // In a real implementation, this would fetch from your backend
    return [
      {
        id: 'basic',
        name: 'Basic',
        price: '4.99',
        currency: 'USD',
        interval: 'month',
        stripePriceId: 'price_basic_monthly',
        weblnPaymentRequest: {
          amount: 499,
          memo: 'Basic Plan - Monthly'
        },
        features: [
          { name: 'Play against AI', included: true },
          { name: 'Basic tutorials', included: true },
          { name: 'Game history', included: true },
          { name: 'Advanced tutorials', included: false },
          { name: 'Multiplayer games', included: false },
          { name: 'Custom AI personalities', included: false }
        ],
        permissions: [
          'Access to single-player mode',
          'Basic game features',
          'Standard support'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: '9.99',
        currency: 'USD',
        interval: 'month',
        stripePriceId: 'price_premium_monthly',
        weblnPaymentRequest: {
          amount: 999,
          memo: 'Premium Plan - Monthly'
        },
        popular: true,
        features: [
          { name: 'Play against AI', included: true },
          { name: 'Basic tutorials', included: true },
          { name: 'Game history', included: true },
          { name: 'Advanced tutorials', included: true },
          { name: 'Multiplayer games', included: true },
          { name: 'Custom AI personalities', included: true }
        ],
        permissions: [
          'Access to all game modes',
          'Premium features',
          'Priority support',
          'Early access to new features'
        ]
      }
    ];
  }

  async getCurrentSubscription(): Promise<string | null> {
    try {
      // In a real implementation, this would fetch from your backend
      const subscription = await fetch('/api/billing/current-subscription');
      const data = await subscription.json();
      return data.planId || null;
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
      throw error;
    }
  }

  async subscribeToPlan(planId: string, provider: PaymentProvider): Promise<void> {
    if (!this.initialized && provider === 'stripe') {
      throw new Error('Billing service not initialized');
    }

    try {
      if (provider === 'stripe') {
        await this.handleStripeSubscription(planId);
      } else if (provider === 'webln') {
        await this.handleWeblnPayment(planId);
      }
    } catch (error) {
      console.error(`Failed to subscribe to plan using ${provider}:`, error);
      throw error;
    }
  }

  private async handleStripeSubscription(planId: string): Promise<void> {
    if (!this.stripe) throw new Error('Stripe not initialized');

    const plan = (await this.getAvailablePlans()).find(p => p.id === planId);
    if (!plan?.stripePriceId) throw new Error('Invalid plan ID');

    // Create a Checkout Session on your backend
    const response = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: plan.stripePriceId })
    });

    const session = await response.json();
    
    // Redirect to Stripe Checkout
    const result = await this.stripe.redirectToCheckout({
      sessionId: session.id
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  private async handleWeblnPayment(planId: string): Promise<void> {
    const plan = (await this.getAvailablePlans()).find(p => p.id === planId);
    if (!plan?.weblnPaymentRequest) throw new Error('Invalid plan ID');

    try {
      // @ts-ignore - WebLN types not included
      const webln = window.webln;
      if (!webln) throw new Error('WebLN not available');

      await webln.enable();
      const response = await webln.makePayment(plan.weblnPaymentRequest);

      // Verify payment on your backend
      await fetch('/api/billing/verify-lightning-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentRequest: plan.weblnPaymentRequest,
          response
        })
      });
    } catch (error) {
      console.error('WebLN payment failed:', error);
      throw error;
    }
  }
}

export const billingService = BillingService.getInstance();