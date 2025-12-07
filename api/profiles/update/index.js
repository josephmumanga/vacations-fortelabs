const sql = require('mssql');
const { query, execute } = require('../../lib/db');
const { getUserFromToken } = require('../../lib/auth');

module.exports = async function (context, req) {
  context.log('Update profile function processed a request.');

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      context.res = {
        status: 401,
        body: { error: 'No token provided' }
      };
      return;
    }

    const token = authHeader.substring(7);
    const currentUser = await getUserFromToken(token);

    if (!currentUser) {
      context.res = {
        status: 401,
        body: { error: 'Invalid or expired token' }
      };
      return;
    }

    const { userId, role, has_project, ...updateData } = req.body;
    const targetUserId = userId || currentUser.id;

    // Users can only update their own profile (except role) unless they're Admin
    if (targetUserId !== currentUser.id && currentUser.role !== 'Admin') {
      context.res = {
        status: 403,
        body: { error: 'Forbidden' }
      };
      return;
    }

    // Only admins can update roles
    if (role && currentUser.role !== 'Admin') {
      context.res = {
        status: 403,
        body: { error: 'Only admins can update roles' }
      };
      return;
    }

    // Build update query
    const updates = [];
    const params = { targetUserId: { type: sql.UniqueIdentifier, value: targetUserId } };

    if (updateData.name !== undefined) {
      updates.push('name = @name');
      params.name = { type: sql.NVarChar, value: updateData.name };
    }
    if (role !== undefined && currentUser.role === 'Admin') {
      updates.push('role = @role');
      params.role = { type: sql.NVarChar, value: role };
    }
    if (updateData.department !== undefined) {
      updates.push('department = @department');
      params.department = { type: sql.NVarChar, value: updateData.department };
    }
    if (updateData.position !== undefined) {
      updates.push('position = @position');
      params.position = { type: sql.NVarChar, value: updateData.position };
    }
    if (updateData.leader_name !== undefined) {
      updates.push('leader_name = @leader_name');
      params.leader_name = { type: sql.NVarChar, value: updateData.leader_name };
    }
    if (updateData.join_date !== undefined) {
      updates.push('join_date = @join_date');
      params.join_date = { type: sql.Date, value: updateData.join_date };
    }
    if (updateData.balance !== undefined) {
      updates.push('balance = @balance');
      params.balance = { type: sql.Int, value: updateData.balance };
    }
    if (has_project !== undefined && currentUser.role === 'Admin') {
      updates.push('has_project = @has_project');
      params.has_project = { type: sql.Bit, value: has_project ? 1 : 0 };
    }

    if (updates.length === 0) {
      context.res = {
        status: 400,
        body: { error: 'No fields to update' }
      };
      return;
    }

    await execute(
      `UPDATE profiles SET ${updates.join(', ')} WHERE id = @targetUserId`,
      params
    );

    // Get updated profile
    const profiles = await query(
      `SELECT id, name, role, department, position, leader_name, join_date, balance, has_project, created_at, updated_at
       FROM profiles WHERE id = @targetUserId`,
      { targetUserId: { type: sql.UniqueIdentifier, value: targetUserId } }
    );

    context.res = {
      status: 200,
      body: profiles[0]
    };
  } catch (error) {
    context.log.error('Update profile error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

