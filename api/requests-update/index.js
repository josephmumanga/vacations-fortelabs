const sql = require('mssql');
const { query, execute } = require('../lib/db');
const { getUserFromToken } = require('../lib/auth');

module.exports = async function (context, req) {
  context.log('Update request function processed a request.');

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

    const { id, ...updateData } = req.body;

    if (!id) {
      context.res = {
        status: 400,
        body: { error: 'Request ID is required' }
      };
      return;
    }

    // Get existing request
    const existingRequests = await query(
      `SELECT * FROM vacation_requests WHERE id = @id`,
      { id: { type: sql.UniqueIdentifier, value: id } }
    );

    if (existingRequests.length === 0) {
      context.res = {
        status: 404,
        body: { error: 'Request not found' }
      };
      return;
    }

    const existingRequest = existingRequests[0];

    // Users can only update their own pending requests
    if (existingRequest.user_id !== currentUser.id && !['Admin', 'HR'].includes(currentUser.role)) {
      // Check if user can approve this request
      const canApprove = 
        (currentUser.role === 'Project Manager' && existingRequest.status === 'Pending PM') ||
        (currentUser.role === 'Leader' && existingRequest.status === 'Pending Leader') ||
        (currentUser.role === 'HR' && existingRequest.status === 'Pending HR');

      if (!canApprove) {
        context.res = {
          status: 403,
          body: { error: 'Forbidden' }
        };
        return;
      }
    }

    // Build update query
    const updates = [];
    const params = { id: { type: sql.UniqueIdentifier, value: id } };

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = @${key}`);
        
        if (key === 'is_partial_day' || key === 'isPartialDay') {
          params[key] = { type: sql.Bit, value: updateData[key] ? 1 : 0 };
        } else if (key.includes('date') || key.includes('Date')) {
          params[key] = { type: sql.Date, value: updateData[key] };
        } else if (key.includes('time') || key.includes('Time')) {
          params[key] = { type: sql.Time, value: updateData[key] };
        } else if (key === 'approval_flow' || key === 'approvalFlow') {
          params[key] = { type: sql.NVarChar, value: typeof updateData[key] === 'string' ? updateData[key] : JSON.stringify(updateData[key]) };
        } else if (typeof updateData[key] === 'number') {
          params[key] = { type: sql.Int, value: updateData[key] };
        } else {
          params[key] = { type: sql.NVarChar, value: updateData[key] };
        }
      }
    });

    if (updates.length === 0) {
      context.res = {
        status: 400,
        body: { error: 'No fields to update' }
      };
      return;
    }

    // Map frontend keys to database keys
    const keyMapping = {
      startDate: 'start_date',
      endDate: 'end_date',
      returnDate: 'return_date',
      daysRequested: 'days_requested',
      hoursRequested: 'hours_requested',
      handoverTasks: 'handover_tasks',
      responsiblePerson: 'responsible_person',
      mitigationPlan: 'mitigation_plan',
      approvalFlow: 'approval_flow',
      isPartialDay: 'is_partial_day',
      startTime: 'start_time',
      endTime: 'end_time'
    };

    const dbUpdates = [];
    const dbParams = { id: { type: sql.UniqueIdentifier, value: id } };

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        const dbKey = keyMapping[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
        dbUpdates.push(`${dbKey} = @${key}`);
        
        if (key === 'isPartialDay' || key === 'is_partial_day') {
          dbParams[key] = { type: sql.Bit, value: updateData[key] ? 1 : 0 };
        } else if (key.includes('Date') || key.includes('date')) {
          dbParams[key] = { type: sql.Date, value: updateData[key] };
        } else if (key.includes('Time') || key.includes('time')) {
          dbParams[key] = { type: sql.Time, value: updateData[key] };
        } else if (key === 'approvalFlow' || key === 'approval_flow') {
          dbParams[key] = { type: sql.NVarChar, value: typeof updateData[key] === 'string' ? updateData[key] : JSON.stringify(updateData[key]) };
        } else if (key === 'daysRequested' || key === 'days_requested') {
          dbParams[key] = { type: sql.Int, value: updateData[key] };
        } else if (key === 'hoursRequested' || key === 'hours_requested') {
          dbParams[key] = { type: sql.Decimal, value: updateData[key] };
        } else {
          dbParams[key] = { type: sql.NVarChar, value: updateData[key] };
        }
      }
    });

    await execute(
      `UPDATE vacation_requests SET ${dbUpdates.join(', ')} WHERE id = @id`,
      dbParams
    );

    // Get updated request
    const requests = await query(
      `SELECT 
        vr.id, vr.user_id, vr.type, vr.start_date, vr.end_date, vr.return_date,
        vr.days_requested, vr.hours_requested, vr.justification, vr.handover_tasks,
        vr.responsible_person, vr.mitigation_plan, vr.status, vr.approval_flow,
        vr.comments, vr.request_date, vr.is_partial_day, vr.start_time, vr.end_time,
        vr.created_at, vr.updated_at,
        p.name as user_name
      FROM vacation_requests vr
      LEFT JOIN profiles p ON vr.user_id = p.id
      WHERE vr.id = @id`,
      { id: { type: sql.UniqueIdentifier, value: id } }
    );

    const req = requests[0];
    const transformed = {
      id: req.id,
      userId: req.user_id,
      user_id: req.user_id,
      userName: req.user_name,
      type: req.type,
      startDate: req.start_date,
      start_date: req.start_date,
      endDate: req.end_date,
      end_date: req.end_date,
      returnDate: req.return_date,
      return_date: req.return_date,
      daysRequested: req.days_requested || 0,
      days_requested: req.days_requested || 0,
      hoursRequested: req.hours_requested || 0,
      hours_requested: req.hours_requested || 0,
      justification: req.justification,
      handoverTasks: req.handover_tasks,
      handover_tasks: req.handover_tasks,
      responsiblePerson: req.responsible_person,
      responsible_person: req.responsible_person,
      mitigationPlan: req.mitigation_plan,
      mitigation_plan: req.mitigation_plan,
      status: req.status,
      approvalFlow: typeof req.approval_flow === 'string' ? JSON.parse(req.approval_flow) : req.approval_flow,
      approval_flow: typeof req.approval_flow === 'string' ? JSON.parse(req.approval_flow) : req.approval_flow,
      comments: req.comments,
      requestDate: req.request_date || (req.created_at ? req.created_at.toISOString().split('T')[0] : null),
      request_date: req.request_date || (req.created_at ? req.created_at.toISOString().split('T')[0] : null),
      isPartialDay: req.is_partial_day || false,
      is_partial_day: req.is_partial_day || false,
      startTime: req.start_time,
      start_time: req.start_time,
      endTime: req.end_time,
      end_time: req.end_time,
      created_at: req.created_at,
      updated_at: req.updated_at
    };

    context.res = {
      status: 200,
      body: transformed
    };
  } catch (error) {
    context.log.error('Update request error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

