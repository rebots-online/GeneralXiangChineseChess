import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';


    

interface LightningSubscription {
  planId: string;
  expiresAt: string;
}

interface SubscriptionResponse {
  planId: string | null;
  provider?: 'stripe' | 'webln';
  expiresAt?: string;
}

// Extended Stripe types to include properties not in the official types
interface StripeSubscriptionWithPeriod extends Stripe.Subscription {
  current_period_end: number;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session_token');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user ID from the session token
    // This is a placeholder - implement your actual session handling
    const userId = 'current-user-id';

    // Check for active Stripe subscription
    const stripeSubscription = await getStripeSubscription(userId);
    
    // Check for active Lightning subscription
    const lightningSubscription = await getLightningSubscription(userId);

    // Return the active subscription, preferring Stripe if both exist
    const activeSubscription = stripeSubscription || lightningSubscription;

    if (!activeSubscription) {
      return NextResponse.json({ planId: null });
    }

    return NextResponse.json(activeSubscription);
  } catch (error) {
    console.error('Failed to fetch current subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

async function getStripeSubscription(userId: string): Promise<SubscriptionResponse | null> {
  try {
    // Check if STRIPE_SECRET_KEY is available
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('Stripe API key is not configured, skipping Stripe subscription check');
      return null;
    }
    
    // Initialize Stripe with API key at request time, not build time
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil'
    });
    
    // Fetch the customer ID associated with the user
    // This would typically come from your database
    const customerId = await getStripeCustomerId(userId);
    

    if (!customerId) return null;

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
      expand: ['data.latest_invoice']
    });

    if (subscriptions.data.length === 0) return null;

    const subscription = subscriptions.data[0] as StripeSubscriptionWithPeriod;
    const price = subscription.items.data[0]?.price;
    
    if (!price?.id) return null;

    return {
      planId: getPlanIdFromStripePrice(price.id),
      provider: 'stripe',
      expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error fetching Stripe subscription:', error);
    return null;
  }
}

async function getLightningSubscription(userId: string): Promise<SubscriptionResponse | null> {
  try {
    // This would typically query your database for active Lightning subscriptions
    // This is a placeholder implementation
    const subscription = await queryLightningSubscription(userId);
    
    if (!subscription) return null;

    return {
      planId: subscription.planId,
      provider: 'webln',
      expiresAt: subscription.expiresAt
    };
  } catch (error) {
    console.error('Error fetching Lightning subscription:', error);
    return null;
  }
}

// Placeholder functions - implement these based on your database structure
async function getStripeCustomerId(userId: string): Promise<string | null> {
  // Query your database to get the Stripe customer ID for this user
  return null;
}

function getPlanIdFromStripePrice(priceId: string): string {
  // Map Stripe price IDs to your internal plan IDs
  const priceToPlans: Record<string, string> = {
    'price_basic_monthly': 'basic',
    'price_premium_monthly': 'premium'
  };
  return priceToPlans[priceId] || 'basic';
}

async function queryLightningSubscription(userId: string): Promise<LightningSubscription | null> {
  // Query your database for active Lightning subscriptions
  // This is a placeholder implementation
  return null;
}