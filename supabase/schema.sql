-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- BUSINESSES & USERS
-- =====================================================

-- Businesses table (multi-tenant core)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  website VARCHAR(255),
  description TEXT,

  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#4F46E5',
  widget_key UUID UNIQUE DEFAULT uuid_generate_v4(),

  -- Subscription
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, starter, professional, enterprise
  subscription_status VARCHAR(50) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business users junction table (supports multiple staff/owners per business)
CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'staff', -- owner, manager, staff
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SERVICES & SCHEDULING
-- =====================================================

-- Services offered by businesses
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 0, -- buffer time after appointment
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff members (can be linked to user accounts or be standalone)
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- optional link to user account
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(100),
  is_active BOOLEAN DEFAULT true,

  -- Calendar integration
  google_calendar_id VARCHAR(255),
  google_access_token TEXT,
  google_refresh_token TEXT,
  microsoft_calendar_id VARCHAR(255),
  microsoft_access_token TEXT,
  microsoft_refresh_token TEXT,
  calendar_sync_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff services (which staff can perform which services)
CREATE TABLE staff_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(staff_member_id, service_id)
);

-- Business hours (weekly schedule)
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE, -- NULL for business-wide hours
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Special closures / blackout dates
CREATE TABLE special_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE, -- NULL for business-wide
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CUSTOMERS & APPOINTMENTS
-- =====================================================

-- Customers (leads who interact with the widget)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(50),
  name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, email)
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,

  -- Timing
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(50) NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show

  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,

  -- Calendar sync
  google_event_id VARCHAR(255),
  microsoft_event_id VARCHAR(255),

  -- Notifications
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- KNOWLEDGE BASE & RAG
-- =====================================================

-- FAQ items
CREATE TABLE faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents (uploaded files)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_type VARCHAR(50), -- pdf, docx, txt, url
  source_url TEXT, -- for web pages
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, ready, failed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document chunks with embeddings (for RAG)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  faq_id UUID REFERENCES faq_items(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension

  -- Metadata for retrieval
  source_type VARCHAR(50), -- faq, document, website
  chunk_index INTEGER,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX document_chunks_embedding_idx ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- =====================================================
-- CONVERSATIONS & MESSAGES
-- =====================================================

-- Conversations (chat sessions)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Session info
  session_id VARCHAR(255),
  channel VARCHAR(50) DEFAULT 'widget', -- widget, api, test

  -- Metadata
  metadata JSONB DEFAULT '{}',
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages in conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  role VARCHAR(50) NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,

  -- AI metadata
  function_call JSONB, -- for tracking tool/function calls
  tokens_used INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTIONS (Stripe)
-- =====================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  status VARCHAR(50), -- active, canceled, past_due, etc.
  tier VARCHAR(50), -- free, starter, professional, enterprise

  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Usage limits
  monthly_conversations_limit INTEGER,
  monthly_conversations_used INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_business_users_business_id ON business_users(business_id);
CREATE INDEX idx_business_users_user_id ON business_users(user_id);
CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_staff_members_business_id ON staff_members(business_id);
CREATE INDEX idx_business_hours_business_id ON business_hours(business_id);
CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_appointments_business_id ON appointments(business_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_faq_items_business_id ON faq_items(business_id);
CREATE INDEX idx_documents_business_id ON documents(business_id);
CREATE INDEX idx_document_chunks_business_id ON document_chunks(business_id);
CREATE INDEX idx_conversations_business_id ON conversations(business_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_subscriptions_business_id ON subscriptions(business_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- User profiles: users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Business users can access their business data
-- Helper function to check if user has access to a business
CREATE OR REPLACE FUNCTION user_has_business_access(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM business_users
    WHERE business_id = business_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Businesses: users can view businesses they belong to
CREATE POLICY "Users can view their businesses" ON businesses
  FOR SELECT USING (user_has_business_access(id));

CREATE POLICY "Users can update their businesses" ON businesses
  FOR UPDATE USING (
    user_has_business_access(id) AND
    EXISTS (
      SELECT 1 FROM business_users
      WHERE business_id = id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Users can insert businesses" ON businesses
  FOR INSERT WITH CHECK (true); -- Will be linked via trigger

-- Business users table
CREATE POLICY "Users can view business_users" ON business_users
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Owners can manage business_users" ON business_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = business_users.business_id
      AND bu.user_id = auth.uid()
      AND bu.role = 'owner'
    )
  );

-- Services, Staff, Hours, etc.: users can access data for their businesses
CREATE POLICY "Users can view services" ON services
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage services" ON services
  FOR ALL USING (user_has_business_access(business_id));

CREATE POLICY "Users can view staff" ON staff_members
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage staff" ON staff_members
  FOR ALL USING (user_has_business_access(business_id));

CREATE POLICY "Users can view business hours" ON business_hours
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage business hours" ON business_hours
  FOR ALL USING (user_has_business_access(business_id));

CREATE POLICY "Users can view closures" ON special_closures
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage closures" ON special_closures
  FOR ALL USING (user_has_business_access(business_id));

CREATE POLICY "Users can view customers" ON customers
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage customers" ON customers
  FOR ALL USING (user_has_business_access(business_id));

CREATE POLICY "Users can view appointments" ON appointments
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage appointments" ON appointments
  FOR ALL USING (user_has_business_access(business_id));

CREATE POLICY "Users can view FAQs" ON faq_items
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage FAQs" ON faq_items
  FOR ALL USING (user_has_business_access(business_id));

CREATE POLICY "Users can view documents" ON documents
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage documents" ON documents
  FOR ALL USING (user_has_business_access(business_id));

CREATE POLICY "Users can view document chunks" ON document_chunks
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage document chunks" ON document_chunks
  FOR ALL USING (user_has_business_access(business_id));

CREATE POLICY "Users can view conversations" ON conversations
  FOR SELECT USING (user_has_business_access(business_id));

CREATE POLICY "Users can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND user_has_business_access(c.business_id)
    )
  );

CREATE POLICY "Users can view subscriptions" ON subscriptions
  FOR SELECT USING (user_has_business_access(business_id));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at BEFORE UPDATE ON faq_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default business_user entry when a business is created
CREATE OR REPLACE FUNCTION create_business_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO business_users (business_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_business_created
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION create_business_owner();
