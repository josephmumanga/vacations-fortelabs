import React, { useState, useEffect, useRef } from 'react';
import auroraImage from '../aurora.jpg';
import { api, auth } from './lib/api';
import Auth from './components/Auth';
import ProfileCompletion from './components/ProfileCompletion';
import MagicLinkVerify from './components/MagicLinkVerify';
import PasswordResetConfirm from './components/PasswordResetConfirm';
import { useTranslation } from './hooks/useTranslation';
import { useLanguage } from './contexts/LanguageContext';

import { 

  Calendar, 

  CheckCircle, 

  Clock, 

  FileText, 

  User, 

  Users, 

  XCircle, 

  Menu, 

  LogOut, 

  Briefcase, 

  AlertCircle,

  ChevronRight,

  ShieldCheck,

  ClipboardList,

  Sparkles,

  Bot,

  MessageSquare,

  Send,

  Loader2,

  Settings,

  Key,

  ExternalLink,

  Edit,

  Save,

  UserCog,

  Layout

} from 'lucide-react';



// --- STYLING CONSTANTS ---

const COLORS = {

  primaryRed: '#e42935',

  darkGray: '#494949', 

  slateBlue: '#1e293b',   // New Sidebar Background (Professional Dark Blue)

  brightBlue: '#4bb3d4',

  lightBlue: '#65a0af',

  white: '#ffffff',

  bgLight: '#f1f5f9'

};



// --- GEMINI API HANDLER (RAG ENHANCED) ---

const callAuroraAI = async (prompt, historyContext, apiKeys) => {

  const validKeys = apiKeys.filter(k => k && k.trim().length > 0);

  

  if (validKeys.length === 0) {
    // Note: This function doesn't have access to t, so we'll handle it differently
    return "⚠️ Error: No hay API Keys configuradas. Por favor ve a Configuración (⚙️) y agrega tu clave.";
  }



  // RAG Context Injection

  const systemPrompt = `

    Eres AURORA, el asistente virtual experto en RH de FORTE Innovation Consulting.

    

    Tus capacidades:

    1. Tienes acceso a la política de vacaciones (Use it or lose it, Prima vacacional, etc.).

    2. Tienes acceso al HISTORIAL de solicitudes del usuario actual (proporcionado abajo).

    3. Si el usuario pregunta "¿Cuándo pedí vacaciones?" o "¿Fueron aprobadas?", consulta el contexto JSON proveído.

    

    Contexto de Solicitudes del Usuario:

    ${JSON.stringify(historyContext)}



    Reglas de Negocio:

    - Si el usuario tiene proyecto, necesita aprobación del Project Manager (PM) con un Plan de Mitigación antes del Líder.

    - El flujo es: Solicitud -> (PM si aplica) -> Líder -> RH.

    

    Responde de manera amable, profesional y concisa.

  `;



  for (const key of validKeys) {

    try {

      const response = await fetch(

        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`,

        {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({

            contents: [{ parts: [{ text: prompt }] }],

            systemInstruction: { parts: [{ text: systemPrompt }] },

          }),

        }

      );



      if (!response.ok) continue;



      const data = await response.json();

      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude procesar la respuesta.";

      

    } catch (error) {

      console.error("Aurora Error:", error);

    }

  }



  return "❌ Error de conexión con AURORA. Verifica tus API Keys.";

};



// --- MOCK DATA ---

const VACATION_TABLE = [

  { years: 1, days: 12 }, { years: 2, days: 14 }, { years: 3, days: 16 },

  { years: 4, days: 18 }, { years: '5-9', days: 20 }, { years: '10-14', days: 22 }

];






// --- HELPER COMPONENTS ---



const StatusBadge = ({ status }) => {

  const styles = {

    'Approved': 'bg-green-100 text-green-800 border-green-200',

    'Rejected': 'bg-red-100 text-red-800 border-red-200',

    'Pending PM': 'bg-purple-100 text-purple-800 border-purple-200',

    'Pending Leader': 'bg-yellow-100 text-yellow-800 border-yellow-200',

    'Pending HR': 'bg-blue-100 text-blue-800 border-blue-200',

  };

  return (

    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>

      {status}

    </span>

  );

};



const Card = ({ children, className = "" }) => (

  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>

    {children}

  </div>

);



// --- MAIN COMPONENT ---



export default function LeaveManagementApp() {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();

  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState([]);
  const [apiKeys, setApiKeys] = useState(['', '', '']);
  const [loading, setLoading] = useState(true);

  

  // UI State

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [showChat, setShowChat] = useState(false);

  const [showConfig, setShowConfig] = useState(false);



  // Form State (New & Edit)
  const REQUEST_TYPES = {
    VACATION: 'Vacaciones',
    PERMISSION: 'Permiso',
    ECONOMIC_DAY: 'Día Económico'
  };

  const [editingRequestId, setEditingRequestId] = useState(null);

  const [formType, setFormType] = useState(REQUEST_TYPES.VACATION);

  const [formData, setFormData] = useState({

    startDate: '', endDate: '', returnDate: '', daysRequested: 0,

    justification: '', handoverTasks: '', responsiblePerson: '', mitigationPlan: '',

    isPartialDay: false, startTime: '', endTime: '', hoursRequested: 0

  });



  // Approval Comment State

  const [approvalComment, setApprovalComment] = useState("");

  const [activeApprovalId, setActiveApprovalId] = useState(null);



  // Check for existing session and load user profile
  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: sessionData } = await auth.getSession();
        
        if (sessionData?.session) {
          setSession(sessionData.session);
          // Profile is already included in session data
          if (sessionData.session.user) {
            const { data: profile } = await api.getProfile(sessionData.session.user.id);
            if (profile) {
              setCurrentUser(profile);
            }
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profile } = await api.getProfile(session.user.id);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load requests when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    const loadRequests = async () => {
      try {
        const { data, error } = await api.getRequests();

        if (error) {
          console.error('Error loading requests:', error);
        } else if (data) {
          // Data is already transformed by the API
          setRequests(data);
        }
      } catch (error) {
        console.error('Error in loadRequests:', error);
      }
    };

    loadRequests();
  }, [currentUser]);

  // Load all users for admin panel
  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      const loadUsers = async () => {
        const { data, error } = await api.listProfiles();
        
        if (error) {
          console.error('Error loading users:', error);
        } else if (data) {
          const transformed = data.map(u => ({
            ...u,
            joinDate: u.join_date,
            hasProject: u.has_project || false,
          }));
          setUsers(transformed);
        }
      };
      loadUsers();
    }
  }, [currentUser]);

  // Load API Keys
  useEffect(() => {
    const stored = localStorage.getItem('forte_gemini_keys');
    if (stored) setApiKeys(JSON.parse(stored));
  }, []);



  const handleSaveKeys = (keys) => {
    setApiKeys(keys);
    localStorage.setItem('forte_gemini_keys', JSON.stringify(keys));
    setShowConfig(false);
  };

  const handleAuthSuccess = async (authData) => {
    setSession(authData.user);
    setCurrentUser(authData.profile);
  };

  const handleLogout = async () => {
    await api.signOut();
    setSession(null);
    setCurrentUser(null);
    setRequests([]);
    setUsers([]);
    setActiveTab('dashboard');
  };



  // --- LOGIC: DATE CALC ---

  const calculateDays = (start, end) => {

    if (!start || !end) return 0;

    const s = new Date(start);

    const e = new Date(end);

    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;

    return diff > 0 ? diff : 0;

  };



  const calculateHours = (startTime, endTime) => {

    if (!startTime || !endTime) return 0;

    const [startH, startM] = startTime.split(':').map(Number);

    const [endH, endM] = endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;

    const endMinutes = endH * 60 + endM;

    const diffMinutes = endMinutes - startMinutes;

    return diffMinutes > 0 ? (diffMinutes / 60).toFixed(2) : 0;

  };

  const handleDateChange = (e) => {

    const { name, value } = e.target;

    const newData = { ...formData, [name]: value };

    if (name === 'startDate' || name === 'endDate') {

      // Auto-sync endDate to startDate when partial day is enabled

      if (formData.isPartialDay && name === 'startDate') {

        newData.endDate = value;

      }

      // If partial day and dates don't match, reset partial day mode

      if (formData.isPartialDay) {

        const startDate = name === 'startDate' ? value : formData.startDate;

        const endDate = name === 'endDate' ? value : formData.endDate;

        if (startDate && endDate && startDate !== endDate) {

          newData.isPartialDay = false;

          newData.startTime = '';

          newData.endTime = '';

          newData.hoursRequested = 0;

        }

      }

      if (formData.isPartialDay && newData.startDate && newData.endDate && newData.startDate === newData.endDate) {

        // For partial days, calculate hours instead

        if (formData.startTime && formData.endTime) {

          newData.hoursRequested = calculateHours(formData.startTime, formData.endTime);

        }

        newData.daysRequested = 0;

      } else {

        newData.daysRequested = calculateDays(

          name === 'startDate' ? value : formData.startDate,

          name === 'endDate' ? value : formData.endDate

        );

        if (!formData.isPartialDay) {

          newData.hoursRequested = 0;

        }

      }

    }

    setFormData(newData);

  };

  const handleTimeChange = (e) => {

    const { name, value } = e.target;

    const newData = { ...formData, [name]: value };

    if ((name === 'startTime' || name === 'endTime') && formData.isPartialDay) {

      const startTime = name === 'startTime' ? value : formData.startTime;

      const endTime = name === 'endTime' ? value : formData.endTime;

      if (startTime && endTime) {

        newData.hoursRequested = calculateHours(startTime, endTime);

      }

    }

    setFormData(newData);

  };



  // --- LOGIC: SUBMIT / EDIT ---

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) return;

    // Determine Initial Status based on Workflow
    let initialStatus = currentUser.has_project ? 'Pending PM' : 'Pending Leader';
    let initialFlow = { pm: !currentUser.has_project, leader: false, hr: false };

    try {
      const requestData = {
        user_id: currentUser.id,
        type: formType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        return_date: formData.returnDate,
        days_requested: formData.daysRequested,
        hours_requested: formData.hoursRequested || 0,
        justification: formData.justification,
        handover_tasks: formData.handoverTasks,
        responsible_person: formData.responsiblePerson,
        mitigation_plan: formData.mitigationPlan || null,
        status: initialStatus,
        approval_flow: initialFlow,
        comments: '',
        request_date: new Date().toISOString().split('T')[0],
        is_partial_day: formData.isPartialDay || false,
        start_time: formData.startTime || null,
        end_time: formData.endTime || null,
      };

      if (editingRequestId) {
        // UPDATE EXISTING
        const { data, error } = await api.updateRequest(editingRequestId, requestData);

        if (error) throw error;
        alert(t('requestUpdated'));
      } else {
        // CREATE NEW
        const { data, error } = await api.createRequest(requestData);

        if (error) throw error;
        alert(t('requestSent'));
      }

      // Reload requests
      const { data, error: reloadError } = await api.getRequests();

      if (data && !reloadError) {
        setRequests(data);
      }

      setEditingRequestId(null);
      setFormData({
        startDate: '', endDate: '', returnDate: '', daysRequested: 0,
        justification: '', handoverTasks: '', responsiblePerson: '', mitigationPlan: '',
        isPartialDay: false, startTime: '', endTime: '', hoursRequested: 0
      });
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error saving request:', error);
      alert(t('errorSaving') + ': ' + error.message);
    }
  };



  const handleEditRequest = (req) => {

    setEditingRequestId(req.id);

    setFormType(req.type);

    setFormData({

      startDate: req.startDate,

      endDate: req.endDate,

      returnDate: req.returnDate,

      daysRequested: req.daysRequested,

      justification: req.justification || '',

      handoverTasks: req.handoverTasks,

      responsiblePerson: req.responsiblePerson,

      mitigationPlan: req.mitigationPlan || '',

      isPartialDay: req.isPartialDay || false,

      startTime: req.startTime || '',

      endTime: req.endTime || '',

      hoursRequested: req.hoursRequested || 0

    });

    setActiveTab('new-request');

  };



  // --- LOGIC: APPROVAL FLOW ---

  const processApproval = async (reqId, action, comment) => {
    if (!currentUser) return;

    try {
      const req = requests.find(r => r.id === reqId);
      if (!req) return;

      const { data, error } = await api.approveRequest(reqId, action, comment);

      if (error) throw error;

      // Reload requests
      const { data: requestsData, error: reloadError } = await api.getRequests();

      if (requestsData && !reloadError) {
        setRequests(requestsData);
      }

      setActiveApprovalId(null);
      setApprovalComment("");
    } catch (error) {
      console.error('Error processing approval:', error);
      alert(t('errorProcessing') + ': ' + error.message);
    }
  };



  // --- LOGIC: ADMIN RBAC ---

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data, error } = await api.updateProfile({ userId, role: newRole });

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating role:', error);
      alert(t('errorUpdatingRole') + ': ' + error.message);
    }
  };

  const handleProjectToggle = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      const newHasProject = !user.has_project;

      const { data, error } = await api.updateProfile({ userId, has_project: newHasProject });

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, has_project: newHasProject, hasProject: newHasProject } : u));
    } catch (error) {
      console.error('Error updating project status:', error);
      alert(t('errorUpdatingProject') + ': ' + error.message);
    }
  };



  // --- VIEWS ---



  const AdminPanel = () => (

    <div className="space-y-6">

       <h1 className="text-2xl font-bold" style={{ color: COLORS.darkGray }}>{t('adminPanel')}</h1>

       <Card className="overflow-hidden">

         <table className="w-full text-left text-sm">

           <thead className="bg-slate-100 text-slate-600">

             <tr>

               <th className="p-4">{t('name')}</th>

               <th className="p-4">{t('currentRole')}</th>

               <th className="p-4">{t('hasProject')}</th>

               <th className="p-4">{t('actions')}</th>

             </tr>

           </thead>

           <tbody className="divide-y divide-slate-100">

             {users.map(u => (

               <tr key={u.id} className="hover:bg-slate-50">

                 <td className="p-4 font-medium">{u.name}</td>

                 <td className="p-4">

                   <select 

                     value={u.role} 

                     onChange={(e) => handleRoleChange(u.id, e.target.value)}

                     className="p-2 border rounded-md"

                   >

                     <option value="Collaborator">{t('collaborator')}</option>

                     <option value="Leader">{t('leader')}</option>

                     <option value="Project Manager">{t('projectManager')}</option>

                     <option value="HR">{t('hr')}</option>

                     <option value="Admin">{t('admin')}</option>

                   </select>

                 </td>

                 <td className="p-4">

                   <button 

                     onClick={() => handleProjectToggle(u.id)}

                     className={`px-3 py-1 rounded-full text-xs font-bold ${(u.has_project || u.hasProject) ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}

                   >

                     {(u.has_project || u.hasProject) ? t('yesAssigned') : t('no')}

                   </button>

                 </td>

                 <td className="p-4 text-xs text-slate-400">ID: {u.id}</td>

               </tr>

             ))}

           </tbody>

         </table>

       </Card>

    </div>

  );



  const NewRequestView = () => (

    <div className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center gap-2 mb-6">

        <button onClick={() => { setActiveTab('dashboard'); setEditingRequestId(null); }} className="text-slate-400 hover:text-slate-600">{t('myDashboard')}</button>

        <ChevronRight size={16} className="text-slate-300" />

        <h2 className="text-xl font-bold" style={{ color: COLORS.primaryRed }}>

          {editingRequestId ? t('editRequest') : t('newRequest')}

        </h2>

      </div>



      <Card className="p-6">

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Workflow Indicator */}

          {currentUser.has_project && (

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 flex items-center gap-2">

              <Briefcase size={16} />

              <span>{t('activeProject')}</span>

            </div>

          )}



          <div className="grid grid-cols-3 gap-4">

            {[
              { key: REQUEST_TYPES.VACATION, label: t('vacation') },
              { key: REQUEST_TYPES.PERMISSION, label: t('permission') },
              { key: REQUEST_TYPES.ECONOMIC_DAY, label: t('economicDay') }
            ].map(({ key, label }) => (

              <button

                key={key}

                type="button"

                onClick={() => {

                  setFormType(key);

                  // Reset partial day state when switching away from Permission

                  if (key !== REQUEST_TYPES.PERMISSION) {

                    setFormData({

                      ...formData,

                      isPartialDay: false,

                      startTime: '',

                      endTime: '',

                      hoursRequested: 0,

                      daysRequested: formData.startDate && formData.endDate ? calculateDays(formData.startDate, formData.endDate) : 0

                    });

                  }

                }}

                className={`p-3 text-sm font-bold rounded-lg border transition-all`}

                style={formType === key ? { backgroundColor: COLORS.primaryRed, color: 'white', borderColor: COLORS.primaryRed } : { backgroundColor: 'white', color: COLORS.darkGray }}

              >

                {label}

              </button>

            ))}

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-2">

              <label className="text-sm font-medium">{t('startDate')}</label>

              <input required type="date" name="startDate" value={formData.startDate} onChange={handleDateChange} className="w-full p-2.5 border rounded-lg" />

            </div>

            <div className="space-y-2">

              <label className="text-sm font-medium">{t('endDate')}</label>

              <input required type="date" name="endDate" value={formData.endDate} onChange={handleDateChange} className="w-full p-2.5 border rounded-lg" />

            </div>

            {/* Time Selection for Permission (Partial Day) */}

            {formType === REQUEST_TYPES.PERMISSION && (

              <div className="space-y-2 md:col-span-2">

                <label className="text-sm font-medium flex items-center gap-2">

                  <input 

                    type="checkbox" 

                    checked={formData.isPartialDay}

                    onChange={(e) => {

                      const isPartial = e.target.checked;

                      // Auto-set endDate to startDate when enabling partial day

                      const newEndDate = isPartial && formData.startDate ? formData.startDate : formData.endDate;

                      setFormData({

                        ...formData,

                        isPartialDay: isPartial,

                        endDate: newEndDate,

                        startTime: isPartial ? formData.startTime : '',

                        endTime: isPartial ? formData.endTime : '',

                        hoursRequested: isPartial ? formData.hoursRequested : 0,

                        daysRequested: isPartial ? 0 : calculateDays(formData.startDate, newEndDate)

                      });

                    }}

                    className="w-4 h-4"

                  />

                  <span>{t('requestHours')}</span>

                </label>

                {formData.isPartialDay && (

                  <p className="text-xs text-slate-500 ml-6">

                    {t('notePartialDay')}

                  </p>

                )}

              </div>

            )}

            {formType === REQUEST_TYPES.PERMISSION && formData.isPartialDay && (

              <>

                <div className="space-y-2">

                  <label className="text-sm font-medium">{t('startTime')}</label>

                  <input 

                    required={formData.isPartialDay}

                    type="time" 

                    name="startTime" 

                    value={formData.startTime} 

                    onChange={handleTimeChange} 

                    className="w-full p-2.5 border rounded-lg" 

                  />

                </div>

                <div className="space-y-2">

                  <label className="text-sm font-medium">{t('endTime')}</label>

                  <input 

                    required={formData.isPartialDay}

                    type="time" 

                    name="endTime" 

                    value={formData.endTime} 

                    onChange={handleTimeChange} 

                    className="w-full p-2.5 border rounded-lg" 

                  />

                </div>

              </>

            )}

            <div className="space-y-2">

              <label className="text-sm font-medium">{t('returnDate')}</label>

              <input required type="date" name="returnDate" value={formData.returnDate} onChange={handleDateChange} className="w-full p-2.5 border rounded-lg" />

            </div>

            <div className="space-y-2">

              <label className="text-sm font-medium">

                {formData.isPartialDay && formType === REQUEST_TYPES.PERMISSION ? t('hoursRequested') : t('daysRequested')}

              </label>

              <div className="p-2.5 bg-slate-100 rounded-lg font-medium">

                {formData.isPartialDay && formType === REQUEST_TYPES.PERMISSION 

                  ? `${formData.hoursRequested} ${language === 'es' ? 'horas' : 'hours'}` 

                  : `${formData.daysRequested} ${language === 'es' ? 'días' : 'days'}`}

              </div>

            </div>

          </div>



          <div className="space-y-2">

             <label className="text-sm font-medium">{t('justification')}</label>

             <textarea name="justification" value={formData.justification} onChange={(e) => setFormData({...formData, justification: e.target.value})} className="w-full p-3 border rounded-lg" rows="2" />

          </div>



          <div className="border-t pt-6">

            <h3 className="font-semibold mb-4 flex items-center gap-2">

              <ShieldCheck size={18} style={{ color: COLORS.primaryRed }}/> {t('operationalContinuity')}

            </h3>

            

            <div className="space-y-4">

              {currentUser.has_project && (

                <div className="space-y-2">

                  <label className="text-sm font-bold text-purple-700 flex items-center gap-2">

                    <Briefcase size={14}/> {t('mitigationPlan')}

                  </label>

                  <textarea 

                    required 

                    name="mitigationPlan"

                    value={formData.mitigationPlan}

                    onChange={(e) => setFormData({...formData, mitigationPlan: e.target.value})}

                    className="w-full p-3 border-2 border-purple-100 rounded-lg focus:border-purple-300 outline-none"

                    placeholder={t('mitigationPlanPlaceholder')}

                    rows="3"

                  />

                </div>

              )}



              <div className="space-y-2">

                <label className="text-sm font-medium">{t('handoverTasks')}</label>

                <textarea required name="handoverTasks" value={formData.handoverTasks} onChange={(e) => setFormData({...formData, handoverTasks: e.target.value})} className="w-full p-3 border rounded-lg" rows="3" />

              </div>

              <div className="space-y-2">

                <label className="text-sm font-medium">{t('responsiblePerson')}</label>

                <input required type="text" name="responsiblePerson" value={formData.responsiblePerson} onChange={(e) => setFormData({...formData, responsiblePerson: e.target.value})} className="w-full p-2.5 border rounded-lg" />

              </div>

            </div>

          </div>



          <div className="pt-4 flex justify-end gap-3">

            <button type="button" onClick={() => setActiveTab('dashboard')} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">{t('cancel')}</button>

            <button type="submit" className="px-5 py-2.5 text-white font-medium rounded-lg shadow-sm hover:opacity-90" style={{ backgroundColor: COLORS.primaryRed }}>

              {editingRequestId ? t('updateRequest') : t('sendRequest')}

            </button>

          </div>

        </form>

      </Card>

    </div>

  );



  const ApprovalsView = () => {

    const pendingRequests = requests.filter(req => {

      if (currentUser.role === 'Project Manager') return req.status === 'Pending PM';

      if (currentUser.role === 'Leader') return req.status === 'Pending Leader';

      if (currentUser.role === 'HR') return req.status === 'Pending HR' || req.status === 'Pending Leader';

      return false;

    });



    return (

      <div className="space-y-6">

        <h1 className="text-2xl font-bold" style={{ color: COLORS.darkGray }}>{t('approvalCenter')}</h1>

        {pendingRequests.length === 0 ? (

           <Card className="p-12 text-center text-slate-500"><CheckCircle size={32} className="mx-auto mb-4"/>{t('allUpToDate')}</Card>

        ) : (

          <div className="grid gap-6">

            {pendingRequests.map(req => (

              <Card key={req.id} className="p-6">

                <div className="flex flex-col gap-4">

                  <div className="flex justify-between items-start">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: COLORS.brightBlue }}>{req.userName.charAt(0)}</div>

                      <div>

                        <h3 className="font-bold">{req.userName}</h3>

                        <p className="text-xs text-slate-500">
                          {req.type} | {req.isPartialDay && req.hoursRequested 
                            ? `${req.hoursRequested} horas` 
                            : `${req.daysRequested} Días`}
                        </p>

                      </div>

                    </div>

                    <StatusBadge status={req.status} />

                  </div>



                  {/* Mitigation Plan if PM */}

                  {req.mitigationPlan && (

                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">

                      <p className="text-xs font-bold text-purple-700 uppercase mb-1">{t('mitigationPlan')} (Proyecto)</p>

                      <p className="text-sm text-purple-900">{req.mitigationPlan}</p>

                    </div>

                  )}

                  

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">

                    <p className="font-medium text-slate-700">Handover: <span className="font-normal">{req.handoverTasks}</span></p>

                    <p className="font-medium text-slate-700 mt-1">Responsable: <span className="font-normal">{req.responsiblePerson}</span></p>

                  </div>



                  {/* Comment Input for Decision */}

                  {activeApprovalId === req.id ? (

                    <div className="mt-2 space-y-3 animation-fade-in">

                      <textarea 

                        className="w-full p-2 border border-slate-300 rounded text-sm" 

                        placeholder={t('addComment')}

                        value={approvalComment}

                        onChange={(e) => setApprovalComment(e.target.value)}

                      />

                      <div className="flex gap-2">

                        <button 

                          onClick={() => processApproval(req.id, 'approve', approvalComment)}

                          className="flex-1 bg-green-600 text-white py-1.5 rounded text-sm font-medium"

                        >

                          {t('confirmApproval')}

                        </button>

                        <button 

                          onClick={() => processApproval(req.id, 'reject', approvalComment)}

                          className="flex-1 bg-red-600 text-white py-1.5 rounded text-sm font-medium"

                        >

                          {t('confirmRejection')}

                        </button>

                        <button 

                          onClick={() => setActiveApprovalId(null)}

                          className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded text-sm"

                        >

                          {t('cancel')}

                        </button>

                      </div>

                    </div>

                  ) : (

                    <div className="flex gap-3 mt-2">

                      <button onClick={() => setActiveApprovalId(req.id)} className="flex-1 py-2 rounded-lg font-medium text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: COLORS.primaryRed }}>

                        {t('reviewRequest')}

                      </button>

                    </div>

                  )}

                </div>

              </Card>

            ))}

          </div>

        )}

      </div>

    );

  };



  // --- AI CHATBOT COMPONENT (AURORA) ---

  const AuroraChat = () => {
    const { t: tChat } = useTranslation();
    const [messages, setMessages] = useState([{ role: 'system', text: tChat('auroraGreeting') }]);

    const [input, setInput] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const endRef = useRef(null);



    useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);



    const handleSend = async (e) => {

      e.preventDefault();

      if (!input.trim()) return;

      const userMsg = { role: 'user', text: input };

      setMessages(p => [...p, userMsg]);

      setInput('');

      setIsLoading(true);



      // Context: Only current user requests

      const userRequests = requests.filter(r => r.userId === currentUser.id || r.user_id === currentUser.id);

      const reply = await callAuroraAI(input, userRequests, apiKeys);

      

      setMessages(p => [...p, { role: 'system', text: reply }]);

      setIsLoading(false);

    };



    if (!showChat) return null;



    return (

      <div className="fixed bottom-20 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col h-[500px]">

        <div className="p-4 text-white flex justify-between items-center rounded-t-2xl" style={{ background: `linear-gradient(135deg, ${COLORS.slateBlue}, ${COLORS.primaryRed})` }}>

          <div className="flex items-center gap-2 font-bold"><Sparkles size={18} /> {t('auroraAI')}</div>

          <button onClick={() => setShowChat(false)}><XCircle size={20} /></button>

        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">

          {messages.map((m, i) => (

            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'text-white' : 'bg-white border text-slate-700'}`} style={m.role === 'user' ? { backgroundColor: COLORS.brightBlue } : {}}>

                {m.text}

              </div>

            </div>

          ))}

          {isLoading && <div className="text-slate-400 text-xs p-2 flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> {t('auroraThinking')}</div>}

          <div ref={endRef} />

        </div>

        <form onSubmit={handleSend} className="p-3 border-t flex gap-2">

          <input value={input} onChange={e=>setInput(e.target.value)} placeholder={t('askAboutVacations')} className="flex-1 p-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-400"/>

          <button type="submit" className="p-2 bg-blue-500 text-white rounded-lg"><Send size={16}/></button>

        </form>

      </div>

    );

  };



  // --- API KEY MODAL ---

  const KeyModal = () => {

    if(!showConfig) return null;

    const [keys, setKeys] = useState(apiKeys);

    return (

      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">

        <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">

          <h3 className="font-bold text-lg">{t('apiKeyConfig')}</h3>

          {keys.map((k, i) => (

            <input key={i} type="password" value={k} onChange={e=>{const n=[...keys];n[i]=e.target.value;setKeys(n)}} placeholder={`${t('apiKey')} ${i+1}`} className="w-full p-2 border rounded" />

          ))}

          <div className="flex justify-end gap-2">

            <button onClick={()=>setShowConfig(false)} className="px-4 py-2 text-slate-500">{t('cancel')}</button>

            <button onClick={()=>handleSaveKeys(keys)} className="px-4 py-2 bg-blue-600 text-white rounded">{t('save')}</button>

          </div>

        </div>

      </div>

    );

  };



  // --- LAYOUT ---

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: COLORS.primaryRed }} />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Helper function to check if profile is complete
  const isProfileComplete = (profile) => {
    if (!profile) return false;
    // Profile is complete if it has a full name (at least 2 characters) and a leader
    const hasFullName = profile.name && profile.name.trim().length >= 2;
    const hasLeader = profile.leader_name && profile.leader_name.trim().length > 0;
    return hasFullName && hasLeader;
  };

  // Check URL parameters for magic link or password reset
  const urlParams = new URLSearchParams(window.location.search);
  const magicToken = urlParams.get('token');
  const type = urlParams.get('type');
  const path = window.location.pathname;

  // Handle /magic route for magic link verification
  if (path === '/magic' && magicToken) {
    return (
      <MagicLinkVerify
        token={magicToken}
        onSuccess={handleAuthSuccess}
        onError={(error) => {
          console.error('Magic link verification error:', error);
        }}
      />
    );
  }

  // Handle legacy /auth/verify route for backward compatibility
  if (path === '/auth/verify' && magicToken && type === 'magic') {
    return (
      <MagicLinkVerify
        token={magicToken}
        onSuccess={handleAuthSuccess}
        onError={(error) => {
          console.error('Magic link verification error:', error);
        }}
      />
    );
  }

  // Show password reset confirmation page
  if (path === '/auth/reset-password' && magicToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #e42935 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-32 h-16 mx-auto mb-4 flex items-center justify-center">
              <img 
                src="https://salmon-sea-0b3caa70f.1.azurestaticapps.net/src/fic/Logo-Forte_Full_logo-H.png" 
                alt="FORTE" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.darkGray }}>
              Reset Password
            </h1>
          </div>
          <PasswordResetConfirm
            token={magicToken}
            onSuccess={() => {
              // Redirect to login after successful password reset
              window.location.href = '/';
            }}
            onBack={() => {
              window.location.href = '/';
            }}
          />
        </div>
      </div>
    );
  }

  // Show auth if not logged in
  if (!session || !currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Show profile completion if profile is incomplete
  if (!isProfileComplete(currentUser)) {
    return (
      <ProfileCompletion 
        profile={currentUser} 
        onComplete={async (updatedProfile) => {
          // Reload the profile to get the latest data
          const { data: profile } = await api.getProfile(currentUser.id);
          if (profile) {
            setCurrentUser(profile);
          }
        }}
      />
    );
  }

  return (

    <div className="min-h-screen flex font-sans bg-slate-50 text-slate-800">

      {/* Language Toggle Button - Top Right */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 px-4 py-2 bg-white hover:bg-slate-50 rounded-lg shadow-lg text-sm font-medium transition z-50 border border-slate-200"
        style={{ color: COLORS.darkGray }}
      >
        {language === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
      </button>

      {/* SIDEBAR: UPDATED STYLE */}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 text-white transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`} style={{ backgroundColor: COLORS.slateBlue }}>

        <div className="p-6 border-b border-slate-700 flex items-center justify-center">

           <div className="w-full h-20 bg-white rounded-lg p-2 flex items-center justify-center overflow-hidden">

              <img src="https://salmon-sea-0b3caa70f.1.azurestaticapps.net/src/fic/Logo-Forte_Full_logo-H.png" alt="FORTE" className="w-full h-full object-contain scale-125" />

           </div>

        </div>

        

        <nav className="p-4 space-y-2">

          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-slate-400'}`}>

            <Layout size={20} style={{ color: activeTab === 'dashboard' ? COLORS.brightBlue : 'inherit' }} /><span>{t('myDashboard')}</span>

          </button>

          <button onClick={() => { setActiveTab('new-request'); setEditingRequestId(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 ${activeTab === 'new-request' ? 'bg-white/10 text-white' : 'text-slate-400'}`}>

            <ClipboardList size={20} style={{ color: activeTab === 'new-request' ? COLORS.brightBlue : 'inherit' }} /><span>{t('request')}</span>

          </button>

          

          {(['Leader', 'HR', 'Project Manager'].includes(currentUser.role)) && (

            <button onClick={() => setActiveTab('approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 ${activeTab === 'approvals' ? 'bg-white/10 text-white' : 'text-slate-400'}`}>

              <CheckCircle size={20} style={{ color: activeTab === 'approvals' ? COLORS.brightBlue : 'inherit' }} />

              <span>{t('approvals')}</span>

            </button>

          )}



          {currentUser.role === 'Admin' && (

             <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 ${activeTab === 'admin' ? 'bg-white/10 text-white' : 'text-slate-400'}`}>

             <UserCog size={20} style={{ color: activeTab === 'admin' ? COLORS.brightBlue : 'inherit' }} />

             <span>{t('adminRBAC')}</span>

           </button>

          )}



          <div className="pt-4 mt-4 border-t border-slate-700">

            <button onClick={() => setShowChat(!showChat)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-white/10">

              <Sparkles size={20} style={showChat ? { color: COLORS.brightBlue } : {}} /><span className={showChat ? "text-white" : ""}>{t('auroraAI')}</span>

            </button>

            <button onClick={() => setShowConfig(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-white/10">

              <Settings size={20} /><span>{t('settings')}</span>

            </button>

          </div>

        </nav>



        {/* Logout Button */}

        <div className="absolute bottom-0 w-full p-4 bg-black/20">

          <button 

            onClick={handleLogout}

            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-white/10"

          >

            <LogOut size={20} />

            <span>{t('logout')}</span>

          </button>

        </div>

      </aside>



      {/* MAIN CONTENT */}

      <main className="flex-1 overflow-y-auto p-8 relative">

        <div className="max-w-5xl mx-auto">

          {/* Header Mobile */}

          <div className="md:hidden flex justify-between mb-4">

             <span className="font-bold text-slate-800">FORTE</span>

             <button onClick={()=>setSidebarOpen(!isSidebarOpen)}><Menu/></button>

          </div>



          {activeTab === 'dashboard' && (

            <div className="space-y-6">

              <header className="border-b pb-4 mb-6 border-slate-200">

                <h1 className="text-2xl font-bold" style={{ color: COLORS.darkGray }}>{t('hello')}, <span style={{ color: COLORS.primaryRed }}>{currentUser.name}</span></h1>

              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                 <Card className="p-6 border-l-4" style={{ borderLeftColor: COLORS.primaryRed }}>

                    <p className="text-sm text-slate-500">{t('availableDays')}</p>

                    <h3 className="text-3xl font-bold">{currentUser.balance || 0}</h3>

                 </Card>

                 <Card className="p-6 border-l-4" style={{ borderLeftColor: COLORS.brightBlue }}>

                    <p className="text-sm text-slate-500">{t('myRequests')}</p>

                    <h3 className="text-3xl font-bold">{requests.filter(r => r.userId === currentUser.id || r.user_id === currentUser.id).length}</h3>

                 </Card>

              </div>



              <h3 className="font-bold mt-8 mb-4 text-slate-600">{t('recentHistory')}</h3>

              <div className="space-y-3">

                {requests.filter(r => r.userId === currentUser.id || r.user_id === currentUser.id).map(req => (

                  <Card key={req.id} className="p-4 flex justify-between items-center hover:shadow-md transition">

                    <div>

                      <div className="flex items-center gap-2">

                        <span className="font-bold text-slate-700">{req.type}</span>

                        <StatusBadge status={req.status} />

                      </div>

                      <p className="text-sm text-slate-500">
                        {req.startDate} - {req.endDate}
                        {req.isPartialDay && req.startTime && req.endTime && (
                          <span className="ml-2 text-xs">({req.startTime} - {req.endTime})</span>
                        )}
                      </p>

                      {req.comments && <p className="text-xs text-slate-400 mt-1 italic">"{req.comments}"</p>}

                    </div>

                    {/* EDIT BUTTON: Only if Pending */}

                    {req.status.includes('Pending') && (

                      <button 

                        onClick={() => handleEditRequest(req)}

                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"

                        title={t('editRequest')}

                      >

                        <Edit size={18} />

                      </button>

                    )}

                  </Card>

                ))}

              </div>

            </div>

          )}



          {activeTab === 'new-request' && <NewRequestView />}

          {activeTab === 'approvals' && <ApprovalsView />}

          {activeTab === 'admin' && <AdminPanel />}

        </div>

        

        <AuroraChat />

        <KeyModal />

        

        {!showChat && (

          <button onClick={() => setShowChat(true)} className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg hover:scale-110 transition z-40 overflow-hidden border-2 border-white" style={{ backgroundColor: COLORS.brightBlue }}>

            <img src={auroraImage} alt="AURORA" className="w-full h-full object-cover" />

          </button>

        )}

      </main>

    </div>

  );

}

