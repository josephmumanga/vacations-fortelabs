-- Azure SQL Database Schema for Vacation Management System
-- Run this in your Azure SQL Database

-- Create users table for authentication
CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

-- Create profiles table
CREATE TABLE profiles (
  id UNIQUEIDENTIFIER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name NVARCHAR(255) NOT NULL,
  role NVARCHAR(50) NOT NULL DEFAULT 'Collaborator' CHECK (role IN ('Collaborator', 'Leader', 'Project Manager', 'HR', 'Admin')),
  department NVARCHAR(255),
  position NVARCHAR(255),
  leader_name NVARCHAR(255),
  join_date DATE,
  balance INT DEFAULT 0,
  has_project BIT DEFAULT 0,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

-- Create vacation_requests table
CREATE TABLE vacation_requests (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type NVARCHAR(50) NOT NULL CHECK (type IN ('Vacaciones', 'Permiso', 'Día Económico')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  return_date DATE NOT NULL,
  days_requested INT DEFAULT 0,
  hours_requested DECIMAL(5,2) DEFAULT 0,
  justification NVARCHAR(MAX),
  handover_tasks NVARCHAR(MAX),
  responsible_person NVARCHAR(255),
  mitigation_plan NVARCHAR(MAX),
  status NVARCHAR(50) NOT NULL DEFAULT 'Pending Leader' CHECK (status IN ('Pending PM', 'Pending Leader', 'Pending HR', 'Approved', 'Rejected')),
  approval_flow NVARCHAR(MAX) DEFAULT '{"pm": false, "leader": false, "hr": false}',
  comments NVARCHAR(MAX),
  request_date DATE DEFAULT CAST(GETDATE() AS DATE),
  is_partial_day BIT DEFAULT 0,
  start_time TIME,
  end_time TIME,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

GO

-- Create trigger to update updated_at timestamp for profiles
CREATE TRIGGER trg_profiles_updated_at
ON profiles
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE profiles
  SET updated_at = GETDATE()
  FROM profiles p
  INNER JOIN inserted i ON p.id = i.id;
END;

GO

-- Create trigger to update updated_at timestamp for vacation_requests
CREATE TRIGGER trg_vacation_requests_updated_at
ON vacation_requests
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE vacation_requests
  SET updated_at = GETDATE()
  FROM vacation_requests vr
  INNER JOIN inserted i ON vr.id = i.id;
END;

GO

-- Create indexes for better query performance
CREATE INDEX idx_vacation_requests_user_id ON vacation_requests(user_id);
CREATE INDEX idx_vacation_requests_status ON vacation_requests(status);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_users_email ON users(email);

