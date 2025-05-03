import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil'
});

export async function POST() {
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

    // Get the customer's Stripe subscription
    const subscription = await getStripeSubscription(userId);
    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Reactivate the subscription by removing the cancellation schedule
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
    });

    // Update local database record
    await updateSubscriptionStatus(userId, subscription.id, {
      cancelAtPeriodEnd: false
    });

    // Log the reactivation
    await logSubscriptionChange(userId, 'subscription_reactivated', {
      subscriptionId: subscription.id,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}

interface ExtendedSubscription extends Stripe.Subscription {
  customer: string;
}

async function getStripeSubscription(userId: string): Promise<ExtendedSubscription | null> {
  try {
    // Get the customer ID from your database
    const customerId = await getStripeCustomerId(userId);
    if (!customerId) return null;

    // Get the customer's active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'active',
      expand: ['data.customer']
    });

    const subscription = subscriptions.data[0];
    if (!subscription) return null;

    // Convert complex customer object to string ID if needed
    const customerString = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;

    // Create a new object with the correct customer type
    return {
      ...subscription,
      customer: customerString
    };
  } catch (error) {
    console.error('Error fetching Stripe subscription:', error);
    return null;
  }
}

async function getStripeCustomerId(userId: string): Promise<string | null> {
  // Query your database to get the Stripe customer ID for this user
  // This is a placeholder implementation
  return null; // Replace with actual database query
}

async function updateSubscriptionStatus(
  userId: string,
  subscriptionId: string,
  updates: { cancelAtPeriodEnd: boolean }
) {
  // Update the subscription status in your database
  // This is a placeholder implementation
  console.log('Updating subscription status:', {
    userId,
    subscriptionId,
    updates
  });
  return true;
}

async function logSubscriptionChange(
  userId: string,
  action: string,
  metadata: Record<string, any>
) {
  // Log the subscription change to your audit trail
  // This is a placeholder implementation
  console.log('Logging subscription change:', {
    userId,
    action,
    metadata
  });
  return true;
}