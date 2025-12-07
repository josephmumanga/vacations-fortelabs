-- Migration script to add leader_name column to profiles table
-- Run this if you already have an existing database

-- Add leader_name column to profiles table
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('profiles') 
    AND name = 'leader_name'
)
BEGIN
    ALTER TABLE profiles
    ADD leader_name NVARCHAR(255) NULL;
    
    PRINT 'Column leader_name added to profiles table';
END
ELSE
BEGIN
    PRINT 'Column leader_name already exists in profiles table';
END

GO

