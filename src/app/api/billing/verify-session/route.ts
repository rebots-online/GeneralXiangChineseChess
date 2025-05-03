import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil'
});

// Extended Stripe types
interface ExtendedSubscription extends Stripe.Subscription {
  current_period_end: number;
  current_period_start: number;
}

interface ExtendedSession extends Stripe.Checkout.Session {
  subscription: ExtendedSubscription;
}

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    }) as unknown as ExtendedSession;

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      );
    }

    // Get the current user from the session token
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session_token');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Here you would typically:
    // 1. Get the user ID from the session token
    // 2. Verify that the session's customer matches the user's Stripe customer ID
    // 3. Update the user's subscription status in your database

    const userId = 'current-user-id'; // Replace with actual user ID lookup
    await updateUserSubscription(userId, session);

    return NextResponse.json({
      success: true,
      customerId: session.customer,
      subscriptionId: session.subscription.id,
      status: session.status
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}

async function updateUserSubscription(userId: string, session: ExtendedSession) {
  if (session.status !== 'complete') {
    throw new Error('Payment not completed');
  }

  const subscription = session.subscription;
  if (!subscription) {
    throw new Error('No subscription found in session');
  }

  // Store the subscription details in your database
  // This is a placeholder implementation
  await storeSubscription({
    userId,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    planId: getPlanIdFromPrice(subscription.items.data[0]?.price.id),
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });

  // Log the subscription activation in the audit trail
  await logSubscriptionChange(userId, 'subscription_activated', {
    subscriptionId: subscription.id,
    planId: getPlanIdFromPrice(subscription.items.data[0]?.price.id),
    startDate: new Date(subscription.current_period_start * 1000).toISOString()
  });
}

function getPlanIdFromPrice(priceId: string | undefined): string {
  if (!priceId) return 'basic';
  
  // Map Stripe price IDs to your internal plan IDs
  const priceToPlans: Record<string, string> = {
    'price_basic_monthly': 'basic',
    'price_premium_monthly': 'premium'
  };
  return priceToPlans[priceId] || 'basic';
}

async function storeSubscription(data: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd: Date;
  planId: string;
  cancelAtPeriodEnd: boolean;
}) {
  // Here you would store the subscription data in your database
  // This is a placeholder implementation
  console.log('Storing subscription:', data);
  return true;
}

async function logSubscriptionChange(
  userId: string,
  action: string,
  metadata: Record<string, any>
) {
  // Here you would log the subscription change in your audit trail
  // This is a placeholder implementation
  console.log('Logging subscription change:', {
    userId,
    action,
    metadata,
    timestamp: new Date().toISOString()
  });
  return true;
}