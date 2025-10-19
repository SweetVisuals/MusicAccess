-- Create dispute resolution system tables
-- This migration adds support for transaction disputes and resolution workflows

-- Create wallet_transactions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric(12,2) NOT NULL,
    type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'purchase', 'sale', 'gem_purchase', 'refund', 'dispute_settlement')),
    description text NOT NULL,
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'disputed', 'refunded')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS for wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet_transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallet_transactions' AND policyname = 'Users can view their own transactions'
    ) THEN
        CREATE POLICY "Users can view their own transactions"
            ON wallet_transactions
            FOR SELECT
            TO public
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallet_transactions' AND policyname = 'Users can insert their own transactions'
    ) THEN
        CREATE POLICY "Users can insert their own transactions"
            ON wallet_transactions
            FOR INSERT
            TO public
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'wallet_transactions' AND policyname = 'Users can update their own transactions'
    ) THEN
        CREATE POLICY "Users can update their own transactions"
            ON wallet_transactions
            FOR UPDATE
            TO public
            USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id uuid REFERENCES wallet_transactions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dispute_type text NOT NULL CHECK (dispute_type IN ('unauthorized_charge', 'service_not_received', 'quality_issue', 'refund_request', 'other')),
    title text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed', 'escalated')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    amount_disputed numeric(12,2) NOT NULL,
    resolution text,
    resolved_by uuid REFERENCES auth.users(id),
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS for disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Create policies for disputes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'disputes' AND policyname = 'Users can view their own disputes'
    ) THEN
        CREATE POLICY "Users can view their own disputes"
            ON disputes
            FOR SELECT
            TO public
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'disputes' AND policyname = 'Users can insert their own disputes'
    ) THEN
        CREATE POLICY "Users can insert their own disputes"
            ON disputes
            FOR INSERT
            TO public
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'disputes' AND policyname = 'Users can update their own disputes'
    ) THEN
        CREATE POLICY "Users can update their own disputes"
            ON disputes
            FOR UPDATE
            TO public
            USING (auth.uid() = user_id);
    END IF;

    -- Admin policy for viewing all disputes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'disputes' AND policyname = 'Admins can view all disputes'
    ) THEN
        CREATE POLICY "Admins can view all disputes"
            ON disputes
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'Admin'
                )
            );
    END IF;

    -- Admin policy for updating all disputes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'disputes' AND policyname = 'Admins can update all disputes'
    ) THEN
        CREATE POLICY "Admins can update all disputes"
            ON disputes
            FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'Admin'
                )
            );
    END IF;
END
$$;

-- Create dispute_messages table for communication
CREATE TABLE IF NOT EXISTS dispute_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_type text NOT NULL DEFAULT 'message' CHECK (message_type IN ('message', 'internal_note', 'resolution_update')),
    content text NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    is_internal boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS for dispute_messages
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for dispute_messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dispute_messages' AND policyname = 'Users can view messages for their disputes'
    ) THEN
        CREATE POLICY "Users can view messages for their disputes"
            ON dispute_messages
            FOR SELECT
            TO public
            USING (
                auth.uid() = user_id OR 
                EXISTS (
                    SELECT 1 FROM disputes d
                    WHERE d.id = dispute_id
                    AND d.user_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'Admin'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dispute_messages' AND policyname = 'Users can insert messages for their disputes'
    ) THEN
        CREATE POLICY "Users can insert messages for their disputes"
            ON dispute_messages
            FOR INSERT
            TO public
            WITH CHECK (
                auth.uid() = user_id AND 
                EXISTS (
                    SELECT 1 FROM disputes d 
                    WHERE d.id = dispute_id 
                    AND d.user_id = auth.uid()
                )
            );
    END IF;

    -- Admin policy for inserting messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dispute_messages' AND policyname = 'Admins can insert messages for any dispute'
    ) THEN
        CREATE POLICY "Admins can insert messages for any dispute"
            ON dispute_messages
            FOR INSERT
            TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'Admin'
                )
            );
    END IF;
END
$$;

-- Create dispute_evidence table for supporting documents
CREATE TABLE IF NOT EXISTS dispute_evidence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size integer,
    description text,
    uploaded_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS for dispute_evidence
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;

-- Create policies for dispute_evidence
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dispute_evidence' AND policyname = 'Users can view evidence for their disputes'
    ) THEN
        CREATE POLICY "Users can view evidence for their disputes"
            ON dispute_evidence
            FOR SELECT
            TO public
            USING (
                auth.uid() = user_id OR
                EXISTS (
                    SELECT 1 FROM disputes d
                    WHERE d.id = dispute_id
                    AND d.user_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'Admin'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'dispute_evidence' AND policyname = 'Users can insert evidence for their disputes'
    ) THEN
        CREATE POLICY "Users can insert evidence for their disputes"
            ON dispute_evidence
            FOR INSERT
            TO public
            WITH CHECK (
                auth.uid() = user_id AND 
                EXISTS (
                    SELECT 1 FROM disputes d 
                    WHERE d.id = dispute_id 
                    AND d.user_id = auth.uid()
                )
            );
    END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_idx ON wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_created_at_idx ON wallet_transactions (created_at);
CREATE INDEX IF NOT EXISTS wallet_transactions_status_idx ON wallet_transactions (status);

CREATE INDEX IF NOT EXISTS disputes_user_id_idx ON disputes (user_id);
CREATE INDEX IF NOT EXISTS disputes_transaction_id_idx ON disputes (transaction_id);
CREATE INDEX IF NOT EXISTS disputes_status_idx ON disputes (status);
CREATE INDEX IF NOT EXISTS disputes_priority_idx ON disputes (priority);
CREATE INDEX IF NOT EXISTS disputes_created_at_idx ON disputes (created_at);

CREATE INDEX IF NOT EXISTS dispute_messages_dispute_id_idx ON dispute_messages (dispute_id);
CREATE INDEX IF NOT EXISTS dispute_messages_user_id_idx ON dispute_messages (user_id);
CREATE INDEX IF NOT EXISTS dispute_messages_created_at_idx ON dispute_messages (created_at);

CREATE INDEX IF NOT EXISTS dispute_evidence_dispute_id_idx ON dispute_evidence (dispute_id);
CREATE INDEX IF NOT EXISTS dispute_evidence_user_id_idx ON dispute_evidence (user_id);

-- Create function to update transaction status when dispute is resolved
CREATE OR REPLACE FUNCTION handle_dispute_resolution()
RETURNS TRIGGER AS $$
BEGIN
    -- If dispute is resolved and has a resolution, update the related transaction
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' AND NEW.resolution IS NOT NULL THEN
        -- Update the transaction status based on resolution
        IF NEW.resolution = 'refund_approved' THEN
            UPDATE wallet_transactions 
            SET status = 'refunded', 
                updated_at = now()
            WHERE id = NEW.transaction_id;
            
            -- Refund the amount to user's wallet
            UPDATE user_wallets 
            SET balance = balance + NEW.amount_disputed,
                updated_at = now()
            WHERE user_id = NEW.user_id;
            
        ELSIF NEW.resolution = 'dispute_rejected' THEN
            UPDATE wallet_transactions 
            SET status = 'completed', 
                updated_at = now()
            WHERE id = NEW.transaction_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dispute resolution
DROP TRIGGER IF EXISTS on_dispute_resolution ON disputes;
CREATE TRIGGER on_dispute_resolution
    AFTER UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION handle_dispute_resolution();

-- Create function to create a dispute
CREATE OR REPLACE FUNCTION create_dispute(
    p_transaction_id uuid,
    p_user_id uuid,
    p_dispute_type text,
    p_title text,
    p_description text,
    p_amount_disputed numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dispute_id uuid;
    v_transaction_amount numeric;
BEGIN
    -- Verify the transaction exists and belongs to the user
    SELECT amount INTO v_transaction_amount
    FROM wallet_transactions
    WHERE id = p_transaction_id AND user_id = p_user_id;
    
    IF v_transaction_amount IS NULL THEN
        RAISE EXCEPTION 'Transaction not found or access denied';
    END IF;
    
    -- Verify the amount disputed is valid
    IF p_amount_disputed > v_transaction_amount OR p_amount_disputed <= 0 THEN
        RAISE EXCEPTION 'Invalid dispute amount';
    END IF;
    
    -- Create the dispute
    INSERT INTO disputes (
        transaction_id,
        user_id,
        dispute_type,
        title,
        description,
        amount_disputed
    ) VALUES (
        p_transaction_id,
        p_user_id,
        p_dispute_type,
        p_title,
        p_description,
        p_amount_disputed
    ) RETURNING id INTO v_dispute_id;
    
    -- Update the transaction status to disputed
    UPDATE wallet_transactions 
    SET status = 'disputed',
        updated_at = now()
    WHERE id = p_transaction_id;
    
    RETURN v_dispute_id;
END;
$$;

-- Create function to add message to dispute
CREATE OR REPLACE FUNCTION add_dispute_message(
    p_dispute_id uuid,
    p_user_id uuid,
    p_content text,
    p_message_type text DEFAULT 'message',
    p_is_internal boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_message_id uuid;
    v_dispute_user_id uuid;
    v_user_role text;
BEGIN
    -- Verify the dispute exists and user has access
    SELECT d.user_id INTO v_dispute_user_id
    FROM disputes d
    WHERE d.id = p_dispute_id;
    
    IF v_dispute_user_id IS NULL THEN
        RAISE EXCEPTION 'Dispute not found';
    END IF;
    
    -- Check if user is the dispute owner or an admin
    SELECT role INTO v_user_role
    FROM profiles
    WHERE id = p_user_id;
    
    IF v_dispute_user_id != p_user_id AND v_user_role != 'Admin' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Insert the message
    INSERT INTO dispute_messages (
        dispute_id,
        user_id,
        message_type,
        content,
        is_internal
    ) VALUES (
        p_dispute_id,
        p_user_id,
        p_message_type,
        p_content,
        p_is_internal
    ) RETURNING id INTO v_message_id;
    
    -- Update dispute updated_at timestamp
    UPDATE disputes 
    SET updated_at = now()
    WHERE id = p_dispute_id;
    
    RETURN v_message_id;
END;
$$;

-- Create function to get dispute statistics for dashboard
CREATE OR REPLACE FUNCTION get_dispute_stats(p_user_id uuid)
RETURNS TABLE(
    total_disputes bigint,
    open_disputes bigint,
    resolved_disputes bigint,
    urgent_disputes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_disputes,
        COUNT(*) FILTER (WHERE status = 'open') as open_disputes,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_disputes,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_disputes
    FROM disputes
    WHERE user_id = p_user_id;
END;
$$;