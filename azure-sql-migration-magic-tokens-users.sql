-- Migration: Add Magic Token Columns to Users Table
-- Run this in your Azure SQL Database to support magic link authentication

-- Add MagicToken column to users table
ALTER TABLE users
ADD MagicToken NVARCHAR(255) NULL;

-- Add MagicTokenExpires column to users table
ALTER TABLE users
ADD MagicTokenExpires DATETIME2 NULL;

GO

-- Create index on MagicToken for faster lookups
CREATE INDEX idx_users_magic_token ON users(MagicToken)
WHERE MagicToken IS NOT NULL;

GO

