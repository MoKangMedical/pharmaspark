// PharmaSpark — Stripe Payment Integration
// Subscription management and payment processing

import Stripe from 'stripe';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_...';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10',
});

// ============ Subscription Plans ============

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  apiLimit: number;
  features: string[];
  stripePriceId: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    interval: 'month',
    apiLimit: 1000,
    features: [
      'Basic molecule parsing',
      'Basic visualization',
      'Community support',
    ],
    stripePriceId: '',
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29,
    currency: 'usd',
    interval: 'month',
    apiLimit: 10000,
    features: [
      'Advanced molecule parsing',
      'All visualization options',
      'Molecule storage',
      'Analysis features',
      'Email support',
    ],
    stripePriceId: 'price_pro_monthly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    currency: 'usd',
    interval: 'month',
    apiLimit: 100000,
    features: [
      'Unlimited API calls',
      'All features',
      'Custom deployment',
      'Priority support',
      'SLA guarantee',
    ],
    stripePriceId: 'price_enterprise_monthly',
  },
];

// ============ Customer Management ============

export interface Customer {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string;
  subscriptionId: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
}

// Create Stripe customer
export async function createCustomer(email: string, name: string): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'pharmaspark',
    },
  });
  
  return customer;
}

// Get Stripe customer
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer as Stripe.Customer;
  } catch (error) {
    return null;
  }
}

// ============ Subscription Management ============

// Create subscription
export async function createSubscription(
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  
  return subscription;
}

// Get subscription
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    return null;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

// Update subscription
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations',
  });
  
  return updatedSubscription;
}

// ============ Payment Intent ============

// Create payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string,
  customerId: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  });
  
  return paymentIntent;
}

// ============ Webhook Handling ============

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  );
}

// Handle webhook events
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// Event handlers
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  console.log('Subscription created:', subscription.id);
  // Update user subscription in database
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('Subscription updated:', subscription.id);
  // Update user subscription in database
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('Subscription deleted:', subscription.id);
  // Update user subscription in database
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log('Payment succeeded:', invoice.id);
  // Update user payment status
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('Payment failed:', invoice.id);
  // Handle failed payment
}

// ============ Checkout Session ============

// Create checkout session
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  
  return session;
}

// ============ Customer Portal ============

// Create customer portal session
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  
  return session;
}

// ============ Usage Tracking ============

// Report usage for metered billing
export async function reportUsage(
  subscriptionItemId: string,
  quantity: number
): Promise<void> {
  await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: Math.floor(Date.now() / 1000),
  });
}

// ============ Plan Management ============

// Get plan by ID
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

// Get plan by Stripe price ID
export function getPlanByPriceId(priceId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.stripePriceId === priceId);
}

// Get all plans
export function getAllPlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS;
}

// ============ Export ============

export default stripe;
