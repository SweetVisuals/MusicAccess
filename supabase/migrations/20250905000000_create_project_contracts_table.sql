-- Create project_contracts table to link contracts to projects
CREATE TABLE IF NOT EXISTS project_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (project_id, contract_id)
);

-- Enable Row Level Security (RLS) for project_contracts
ALTER TABLE project_contracts ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view their own project_contracts
CREATE POLICY "Authenticated users can view their own project_contracts" ON project_contracts
FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow authenticated users to insert their own project_contracts
CREATE POLICY "Authenticated users can insert their own project_contracts" ON project_contracts
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to delete their own project_contracts
CREATE POLICY "Authenticated users can delete their own project_contracts" ON project_contracts
FOR DELETE USING (auth.uid() = user_id);

-- Policy to allow authenticated users to update their own project_contracts
CREATE POLICY "Authenticated users can update their own project_contracts" ON project_contracts
FOR UPDATE USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_project_contracts_project_id ON project_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contracts_contract_id ON project_contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_project_contracts_user_id ON project_contracts(user_id);
