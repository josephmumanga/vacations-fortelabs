-- Schema Verification Script for Vacation Management System
-- Run this against your Azure SQL Database to verify schema matches expectations

-- Check if required tables exist
SELECT 
    'Table Check' AS CheckType,
    TABLE_NAME AS ObjectName,
    'EXISTS' AS Status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('users', 'profiles', 'vacation_requests')
ORDER BY TABLE_NAME;

-- Check users table columns
SELECT 
    'Users Table Columns' AS CheckType,
    COLUMN_NAME AS ObjectName,
    DATA_TYPE AS DataType,
    IS_NULLABLE AS IsNullable,
    COLUMN_DEFAULT AS DefaultValue
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Check profiles table columns
SELECT 
    'Profiles Table Columns' AS CheckType,
    COLUMN_NAME AS ObjectName,
    DATA_TYPE AS DataType,
    IS_NULLABLE AS IsNullable,
    COLUMN_DEFAULT AS DefaultValue
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'profiles'
ORDER BY ORDINAL_POSITION;

-- Check for leader_name column in profiles (may not exist in all deployments)
SELECT 
    'Leader Name Column Check' AS CheckType,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'leader_name'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END AS Status;

-- Check for NOT NULL constraints that might cause issues
SELECT 
    'NOT NULL Constraints' AS CheckType,
    TABLE_NAME AS TableName,
    COLUMN_NAME AS ColumnName,
    IS_NULLABLE AS IsNullable
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('users', 'profiles', 'vacation_requests')
    AND IS_NULLABLE = 'NO'
    AND COLUMN_DEFAULT IS NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Check foreign key constraints
SELECT 
    'Foreign Keys' AS CheckType,
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS ParentTable,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ParentColumn,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fc
    ON fk.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) IN ('profiles', 'vacation_requests')
ORDER BY ParentTable, ForeignKeyName;

-- Check indexes
SELECT 
    'Indexes' AS CheckType,
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique
FROM sys.indexes i
WHERE OBJECT_NAME(i.object_id) IN ('users', 'profiles', 'vacation_requests')
    AND i.name IS NOT NULL
    AND i.is_primary_key = 0
ORDER BY TableName, IndexName;

-- Summary: Count columns per table
SELECT 
    'Column Count Summary' AS CheckType,
    TABLE_NAME AS TableName,
    COUNT(*) AS ColumnCount
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('users', 'profiles', 'vacation_requests')
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;

