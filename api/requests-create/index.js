const sql = require('mssql');
const { query, execute } = require('../lib/db');
const { getUserFromToken } = require('../lib/auth');

module.exports = async function (context, req) {
  context.log('Create request function processed a request.');

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

    const {
      type, start_date, end_date, return_date, days_requested, hours_requested,
      justification, handover_tasks, responsible_person, mitigation_plan,
      is_partial_day, start_time, end_time
    } = req.body;

    // Validate required fields
    if (!type || !start_date || !end_date || !return_date || !handover_tasks || !responsible_person) {
      context.res = {
        status: 400,
        body: { error: 'Missing required fields' }
      };
      return;
    }

    // Determine initial status based on workflow
    const initialStatus = currentUser.has_project ? 'Pending PM' : 'Pending Leader';
    const initialFlow = JSON.stringify({
      pm: !currentUser.has_project,
      leader: false,
      hr: false
    });

    const requestId = sql.UniqueIdentifier();

    await execute(
      `INSERT INTO vacation_requests (
        id, user_id, type, start_date, end_date, return_date, days_requested, hours_requested,
        justification, handover_tasks, responsible_person, mitigation_plan, status, approval_flow,
        request_date, is_partial_day, start_time, end_time
      ) VALUES (
        @id, @user_id, @type, @start_date, @end_date, @return_date, @days_requested, @hours_requested,
        @justification, @handover_tasks, @responsible_person, @mitigation_plan, @status, @approval_flow,
        CAST(GETDATE() AS DATE), @is_partial_day, @start_time, @end_time
      )`,
      {
        id: { type: sql.UniqueIdentifier, value: requestId },
        user_id: { type: sql.UniqueIdentifier, value: currentUser.id },
        type: { type: sql.NVarChar, value: type },
        start_date: { type: sql.Date, value: start_date },
        end_date: { type: sql.Date, value: end_date },
        return_date: { type: sql.Date, value: return_date },
        days_requested: { type: sql.Int, value: days_requested || 0 },
        hours_requested: { type: sql.Decimal, value: hours_requested || 0 },
        justification: { type: sql.NVarChar, value: justification },
        handover_tasks: { type: sql.NVarChar, value: handover_tasks },
        responsible_person: { type: sql.NVarChar, value: responsible_person },
        mitigation_plan: { type: sql.NVarChar, value: mitigation_plan || null },
        status: { type: sql.NVarChar, value: initialStatus },
        approval_flow: { type: sql.NVarChar, value: initialFlow },
        is_partial_day: { type: sql.Bit, value: is_partial_day ? 1 : 0 },
        start_time: { type: sql.Time, value: start_time || null },
        end_time: { type: sql.Time, value: end_time || null }
      }
    );

    // Get created request
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
      { id: { type: sql.UniqueIdentifier, value: requestId } }
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
      status: 201,
      body: transformed
    };
  } catch (error) {
    context.log.error('Create request error:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal server error' }
    };
  }
};

