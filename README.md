# AIMeet - AI-Powered Business Assistant SaaS

A multi-tenant AI SaaS platform that combines intelligent customer support with automated appointment scheduling.

## Features

- **AI Chat Assistant**: Embeddable widget powered by OpenAI with RAG for business-specific knowledge
- **Smart Scheduling**: Calendar integration (Google/Outlook) with intelligent availability management
- **Multi-Tenant Architecture**: Secure business isolation with Row-Level Security
- **Knowledge Base**: Document uploads, FAQ management, and embeddings-based retrieval
- **Appointment Management**: Full booking system with confirmations and reminders
- **Subscription Plans**: Stripe-powered billing with feature gating

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth + Storage)
- **AI**: OpenAI GPT-4 with function calling, embeddings with pgvector
- **Payments**: Stripe
- **Calendar**: Google Calendar API, Microsoft Graph API

## Getting Started

### Prerequisites

1. Node.js 18+ and npm
2. Supabase account and project
3. OpenAI API key
4. Stripe account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kevinduncan1993/AIMeet.git
cd AIMeet
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in your credentials:
```bash
cp .env.example .env.local
```

4. Set up the Supabase database schema (see `/supabase/schema.sql`)

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
/app
  /api           # Next.js API routes (AI, appointments, webhooks)
  /auth          # Authentication pages
  /dashboard     # Business owner dashboard
  /(public)      # Public marketing pages
/components
  /ui            # Reusable UI components
  /dashboard     # Dashboard-specific components
  /widget        # Chat widget components
/lib
  /supabase      # Supabase client and utilities
  /ai            # OpenAI integration and RAG
  /calendar      # Google/Outlook integration
  /scheduling    # Availability logic
/types           # TypeScript type definitions
/supabase        # Database schema and migrations
```

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

This app is optimized for deployment on Vercel:

```bash
npm run build
```

Configure environment variables in your Vercel project settings.

## License

MIT
