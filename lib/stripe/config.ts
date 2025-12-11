import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
}

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    price: 29,
    interval: 'month' as const,
    features: [
      'Up to 100 conversations/month',
      'Basic AI chat widget',
      'Email notifications',
      'Knowledge base (up to 50 articles)',
      'Standard support',
    ],
    limits: {
      conversations: 100,
      faqs: 50,
      services: 5,
    },
  },
  PROFESSIONAL: {
    name: 'Professional',
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    price: 79,
    interval: 'month' as const,
    features: [
      'Up to 500 conversations/month',
      'Advanced AI with custom training',
      'Priority email & chat support',
      'Knowledge base (up to 200 articles)',
      'Calendar integrations (Google, Outlook)',
      'Custom branding',
    ],
    limits: {
      conversations: 500,
      faqs: 200,
      services: 20,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    price: 199,
    interval: 'month' as const,
    features: [
      'Unlimited conversations',
      'Custom AI model fine-tuning',
      'Dedicated account manager',
      'Unlimited knowledge base',
      'White-label solution',
      'Custom integrations & API access',
      'SLA guarantee',
    ],
    limits: {
      conversations: -1, // unlimited
      faqs: -1, // unlimited
      services: -1, // unlimited
    },
  },
} as const

export type PlanType = keyof typeof SUBSCRIPTION_PLANS
