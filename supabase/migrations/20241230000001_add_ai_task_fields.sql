

-- Add new columns to support AI-generated task features
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS estimated_duration text,
ADD COLUMN IF NOT EXISTS needs_user_input boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS timeline_question text,
ADD COLUMN IF NOT EXISTS idea_id uuid REFERENCES ideas(id) ON DELETE SET NULL;

-- Add new column to ideas table to store AI response
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS ai_response jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_idea_id ON tasks(idea_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

