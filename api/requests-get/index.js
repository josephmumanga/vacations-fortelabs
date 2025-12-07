const sql = require('mssql');
const { query } = require('../lib/db');
const { getUserFromToken } = require('../lib/auth');

module.exports = async function (context, req) {
  context.log('Get requests function processed a request.');

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

    let sqlQuery = `
      SELECT 
        vr.id, vr.user_id, vr.type, vr.start_date, vr.end_date, vr.return_date,
        vr.days_requested, vr.hours_requested, vr.justification, vr.handover_tasks,
        vr.responsible_person, vr.mitigation_plan, vr.status, vr.approval_flow,
        vr.comments, vr.request_date, vr.is_partial_day, vr.start_time, vr.end_time,
        vr.created_at, vr.updated_at,
        p.name as user_name
      FROM vacation_requests vr
      LEFT JOIN profiles p ON vr.user_id = p.id
    `;

    const params = {};

    // Filter based on user role
    if (!['Admin', 'HR'].includes(currentUser.role)) {
      // Regular users only see their own requests
      sqlQuery += ' WHERE vr.user_id = @userId';
      params.userId = { type: sql.UniqueIdentifier, value: currentUser.id };
    } else if (currentUser.role === 'HR') {
      // HR can see all requests
      // No filter needed
    } else if (currentUser.role === 'Project Manager') {
      // PMs see requests that need PM approval
      sqlQuery += ' WHERE vr.status = @status';
      params.status = { type: sql.NVarChar, value: 'Pending PM' };
    } else if (currentUser.role === 'Leader') {
      // Leaders see requests that need leader approval
      sqlQuery += ' WHERE vr.status = @status';
      params.status = { type: sql.NVarChar, value: 'Pending Leader' };
    }

    sqlQuery += ' ORDER BY vr.created_at DESC';

    const requests = await query(sqlQuery, params);

    // Transform data to match frontend expectations
    const transformed = requests.map(req => ({
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
    }));

    context.res = {
      status: 200,
      body: transformed
    };
  } catch (error) {
    context.log.error('Get requests error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

