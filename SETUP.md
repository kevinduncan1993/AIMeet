# AIMeet Setup Guide

Complete setup instructions for getting your AI-powered business assistant up and running.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A Supabase account (create one at https://supabase.com)
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- Stripe account (optional, for payments - https://stripe.com)

## Step 1: Supabase Setup

### 1.1 Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in your project details:
   - Name: AIMeet (or your choice)
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to your users
4. Wait for the project to be created (~2 minutes)

### 1.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, go to Settings → API
2. Copy these values:
   - **Project URL** (under "Project URL")
   - **Anon/Public Key** (under "Project API keys" → "anon public")
   - **Service Role Key** (under "Project API keys" → "service_role")

⚠️ **Important**: Never commit the service role key to version control!

### 1.3 Run Database Migrations

1. In Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy the contents of `/supabase/schema.sql` from this project
4. Run the query to create all tables, indexes, and RLS policies
5. Create another new query
6. Copy the contents of `/supabase/functions.sql`
7. Run the query to create the vector similarity search function

### 1.4 Enable pgvector Extension

1. In Supabase dashboard, go to Database → Extensions
2. Search for "vector"
3. Enable the "vector" extension

## Step 2: Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your `.env.local` file:

```env
# Supabase (from Step 1.2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (optional - can add later)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# Calendar OAuth (optional - can add later)
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# MICROSOFT_CLIENT_ID=...
# MICROSOFT_CLIENT_SECRET=...

# Email (optional - can add later)
# RESEND_API_KEY=re_...
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run Development Server

```bash
npm run dev
```

The app should now be running at http://localhost:3000

## Step 5: Create Your First Business Account

1. Go to http://localhost:3000
2. Click "Get Started"
3. Fill in the sign-up form
4. Check your email for verification (check spam folder)
5. Click the verification link in your email
6. You'll be redirected to `/dashboard/setup`
7. Complete your business profile setup

## Step 6: Configure Your Business

### Add Services

1. Navigate to Dashboard → Services
2. Click "Add Service"
3. Create your first service:
   - Name: e.g., "30-minute Consultation"
   - Description: What's included
   - Duration: 30 minutes
   - Buffer: 5-10 minutes (optional)
   - Price: Optional

### Set Business Hours

1. Navigate to Dashboard → Business Hours
2. Add your weekly operating hours for each day
3. Add any special closures or holidays

### Add Knowledge Base Content

1. Navigate to Dashboard → Knowledge Base
2. Add FAQs:
   - Common questions your customers ask
   - Answers your AI should give
3. Upload documents (coming soon):
   - PDFs, text files with business info
   - These will be processed and embedded for RAG

## Step 7: Test the Chat Widget

You can test the widget locally by:

1. Creating a test page with the widget embedded
2. Or using the preview in Dashboard → Settings → Widget

The widget code is:
```html
<script
  src="http://localhost:3000/widget.js"
  data-widget-key="YOUR_WIDGET_KEY">
</script>
```

Your widget key is shown in the dashboard.

## Step 8: Deploy to Production (Optional)

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add all environment variables in Vercel dashboard
4. Update `NEXT_PUBLIC_APP_URL` to your production domain
5. Deploy!

### Post-Deployment Steps

1. Update Supabase redirect URLs:
   - In Supabase dashboard → Authentication → URL Configuration
   - Add your production domain to "Site URL"
   - Add `https://yourdomain.com/auth/callback` to "Redirect URLs"

2. Set up Stripe webhooks (if using payments):
   - In Stripe dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhook/stripe`
   - Copy the webhook secret to your env vars

## Troubleshooting

### "Not authenticated" errors
- Clear your browser cookies
- Check that Supabase URL and keys are correct
- Verify email and try logging in again

### Database errors
- Ensure all migrations from `schema.sql` and `functions.sql` ran successfully
- Check Supabase logs in Dashboard → Logs

### Widget not loading
- Check browser console for errors
- Verify widget key is correct
- Ensure CORS is configured properly (should work by default in Next.js)

### OpenAI errors
- Verify your API key is correct
- Check you have credits in your OpenAI account
- Review rate limits if getting 429 errors

## Next Steps

Now that your basic setup is complete, you can:

1. **Configure Calendar Integration** - Connect Google Calendar or Outlook
2. **Set Up Stripe** - Enable subscription billing
3. **Customize Branding** - Add your logo and colors
4. **Train Your AI** - Add more FAQs and knowledge base content
5. **Review Conversations** - Monitor AI interactions in the dashboard
6. **Set Up Notifications** - Configure email/SMS reminders

## Support

For issues or questions:
- Check the main README.md
- Review the code comments
- Open an issue on GitHub

## Security Checklist

Before going to production:

- [ ] All environment variables are set in production
- [ ] Service role key is never exposed to client
- [ ] RLS policies are enabled on all tables
- [ ] Email verification is working
- [ ] HTTPS is enabled on production domain
- [ ] Stripe webhooks are configured (if using)
- [ ] Rate limiting is configured (optional but recommended)
- [ ] Monitoring is set up (Sentry, Logtail, etc.)
