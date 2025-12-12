// Subscription Plans Configuration
// This file can be safely imported on both client and server

export const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
    price: 19,
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
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    price: 29,
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
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    price: 50,
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
