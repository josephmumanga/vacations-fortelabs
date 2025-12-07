-- Migration: Add Magic Link and Password Reset Token Tables
-- Run this in your Azure SQL Database after the initial schema

-- Create magic_link_tokens table
CREATE TABLE magic_link_tokens (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token NVARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME2 NOT NULL,
  used BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

-- Create password_reset_tokens table
CREATE TABLE password_reset_tokens (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token NVARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME2 NOT NULL,
  used BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE()
);

GO

-- Create indexes for better query performance
CREATE INDEX idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX idx_magic_link_tokens_user_id ON magic_link_tokens(user_id);
CREATE INDEX idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

GO

-- Create stored procedure to clean up expired tokens (optional, can be called periodically)
CREATE PROCEDURE sp_CleanupExpiredTokens
AS
BEGIN
  SET NOCOUNT ON;
  
  -- Delete expired magic link tokens older than 1 day
  DELETE FROM magic_link_tokens 
  WHERE expires_at < DATEADD(day, -1, GETDATE());
  
  -- Delete expired password reset tokens older than 1 day
  DELETE FROM password_reset_tokens 
  WHERE expires_at < DATEADD(day, -1, GETDATE());
  
  -- Return count of deleted tokens
  SELECT @@ROWCOUNT AS deleted_tokens;
END;

GO

