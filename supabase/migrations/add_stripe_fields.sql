-- Add Stripe subscription fields to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50);

-- Update existing column name for clarity (if needed)
-- Note: subscription_tier might already exist, so we'll keep both for backward compatibility
COMMENT ON COLUMN businesses.subscription_tier IS 'Legacy field - use subscription_plan instead';
COMMENT ON COLUMN businesses.subscription_plan IS 'Current Stripe subscription plan (STARTER, PROFESSIONAL, ENTERPRISE)';
COMMENT ON COLUMN businesses.subscription_status IS 'Stripe subscription status (active, canceled, past_due, etc.)';
COMMENT ON COLUMN businesses.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN businesses.stripe_subscription_id IS 'Stripe subscription ID';

-- Add index for faster Stripe webhook lookups
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer_id ON businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_subscription_id ON businesses(stripe_subscription_id);
