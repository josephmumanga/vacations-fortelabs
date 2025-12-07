const sql = require('mssql');
const { query, execute } = require('../../lib/db');
const { getUserFromToken } = require('../../lib/auth');

module.exports = async function (context, req) {
  context.log('Approve request function processed a request.');

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

    const { id, action, comment } = req.body;

    if (!id || !action) {
      context.res = {
        status: 400,
        body: { error: 'Request ID and action are required' }
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
    let approvalFlow = typeof existingRequest.approval_flow === 'string' 
      ? JSON.parse(existingRequest.approval_flow) 
      : existingRequest.approval_flow;

    if (action === 'reject') {
      await execute(
        `UPDATE vacation_requests 
         SET status = @status, 
             comments = CASE WHEN @comment IS NOT NULL AND @comment != '' 
                           THEN CASE WHEN comments IS NOT NULL AND comments != '' 
                                    THEN comments + ' | ' + @comment 
                                    ELSE @comment 
                                  END
                           ELSE comments
                         END
         WHERE id = @id`,
        {
          id: { type: sql.UniqueIdentifier, value: id },
          status: { type: sql.NVarChar, value: 'Rejected' },
          comment: { type: sql.NVarChar, value: comment || null }
        }
      );
    } else if (action === 'approve') {
      let newStatus = existingRequest.status;
      const newFlow = { ...approvalFlow };

      if (currentUser.role === 'Project Manager' && existingRequest.status === 'Pending PM') {
        newFlow.pm = true;
        newStatus = 'Pending Leader';
      } else if (currentUser.role === 'Leader' && existingRequest.status === 'Pending Leader') {
        newFlow.leader = true;
        newStatus = 'Pending HR';
      } else if (currentUser.role === 'HR' && existingRequest.status === 'Pending HR') {
        newFlow.hr = true;
        newStatus = 'Approved';
      } else {
        context.res = {
          status: 403,
          body: { error: 'You do not have permission to approve this request' }
        };
        return;
      }

      const updatedComments = comment 
        ? (existingRequest.comments ? existingRequest.comments + ' | ' + comment : comment)
        : existingRequest.comments;

      await execute(
        `UPDATE vacation_requests 
         SET status = @status, 
             approval_flow = @approval_flow,
             comments = @comments
         WHERE id = @id`,
        {
          id: { type: sql.UniqueIdentifier, value: id },
          status: { type: sql.NVarChar, value: newStatus },
          approval_flow: { type: sql.NVarChar, value: JSON.stringify(newFlow) },
          comments: { type: sql.NVarChar, value: updatedComments || null }
        }
      );
    } else {
      context.res = {
        status: 400,
        body: { error: 'Invalid action. Use "approve" or "reject"' }
      };
      return;
    }

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
    context.log.error('Approve request error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

