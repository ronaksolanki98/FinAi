-- Create table to store Gmail refresh tokens securely

CREATE TABLE IF NOT EXISTS gmail_connections (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  email TEXT,
  scope TEXT DEFAULT 'https://www.googleapis.com/auth/gmail.readonly',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_fetched_at TIMESTAMP,
  
  -- Foreign key to Supabase auth.users (optional, if you want referential integrity)
  CONSTRAINT fk_supabase_user FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX idx_gmail_connections_user_id ON gmail_connections(user_id);
CREATE INDEX idx_gmail_connections_updated_at ON gmail_connections(updated_at);
