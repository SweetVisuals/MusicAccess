-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    dispute_type TEXT NOT NULL CHECK (dispute_type IN ('unauthorized_charge', 'service_not_received', 'quality_issue', 'refund_request', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount_disputed DECIMAL(10,2) NOT NULL CHECK (amount_disputed > 0),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed', 'escalated')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create dispute_messages table
CREATE TABLE IF NOT EXISTS dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON dispute_messages(created_at);

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes
DROP POLICY IF EXISTS "Users can view their own disputes" ON disputes;
CREATE POLICY "Users can view their own disputes" ON disputes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own disputes" ON disputes;
CREATE POLICY "Users can create their own disputes" ON disputes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own disputes" ON disputes;
CREATE POLICY "Users can update their own disputes" ON disputes
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for dispute_messages
DROP POLICY IF EXISTS "Users can view messages for their disputes" ON dispute_messages;
CREATE POLICY "Users can view messages for their disputes" ON dispute_messages
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM disputes
            WHERE disputes.id = dispute_messages.dispute_id
            AND disputes.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create messages for their disputes" ON dispute_messages;
CREATE POLICY "Users can create messages for their disputes" ON dispute_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM disputes
            WHERE disputes.id = dispute_messages.dispute_id
            AND disputes.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
CREATE TRIGGER update_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample disputes for demonstration
INSERT INTO disputes (user_id, transaction_id, dispute_type, title, description, amount_disputed, status, priority) VALUES
(
    (SELECT id FROM auth.users LIMIT 1),
    'demo-1',
    'service_not_received',
    'Beat purchase not delivered',
    'I purchased the beat "Summer Vibes" but never received the download link or files.',
    49.99,
    'open',
    'medium'
),
(
    (SELECT id FROM auth.users LIMIT 1),
    'demo-2',
    'quality_issue',
    'Poor audio quality',
    'The sample pack I purchased has very low quality audio files that are unusable.',
    29.99,
    'under_review',
    'high'
),
(
    (SELECT id FROM auth.users LIMIT 1),
    'demo-3',
    'refund_request',
    'Changed my mind',
    'I accidentally purchased the wrong plugin and would like a refund.',
    19.99,
    'resolved',
    'low'
)
ON CONFLICT DO NOTHING;

-- Insert sample dispute messages
INSERT INTO dispute_messages (dispute_id, user_id, message, is_admin) VALUES
(
    (SELECT id FROM disputes WHERE title = 'Beat purchase not delivered' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'Hello, I purchased this beat 3 days ago but still haven''t received the files. Can you help?',
    false
),
(
    (SELECT id FROM disputes WHERE title = 'Beat purchase not delivered' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'We apologize for the delay. Our system shows the files were sent to your email. Let me resend them now.',
    true
),
(
    (SELECT id FROM disputes WHERE title = 'Poor audio quality' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'The audio files in this sample pack are very distorted and low quality.',
    false
),
(
    (SELECT id FROM disputes WHERE title = 'Changed my mind' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'I would like to request a refund as I purchased this by mistake.',
    false
),
(
    (SELECT id FROM disputes WHERE title = 'Changed my mind' LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'We have processed your refund. The amount will be returned to your original payment method within 5-7 business days.',
    true
)
ON CONFLICT DO NOTHING;