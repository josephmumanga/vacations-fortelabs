-- Migration: Add Rate Limiting Column for Magic Link Requests
-- Run this in your Azure SQL Database to support rate limiting

-- Add LastMagicLinkSentAt column to users table
ALTER TABLE users
ADD LastMagicLinkSentAt DATETIME2 NULL;

GO

-- Create index on LastMagicLinkSentAt for faster queries
CREATE INDEX idx_users_last_magic_link_sent ON users(LastMagicLinkSentAt)
WHERE LastMagicLinkSentAt IS NOT NULL;

GO

