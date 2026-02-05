import { create } from 'zustand';
import { addDays, format } from 'date-fns';

export type Entity = 'Alpha10 Fund Management' | 'Alpha10 Advisory' | 'Alpha10 Global Market Limited';

export type Role = 'Initiator' | 'HOD' | 'Operations' | 'EAG' | 'MD' | 'Finance' | 'IT' | 'Risk';

export type User = {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  entity?: Entity;
};

export type MemoStatus = 'Draft' | 'Pending HOD' | 'Pending Operations' | 'Pending EAG' | 'Pending MD' | 'Pending Finance' | 'Approved' | 'Rejected';

export type Memo = {
  id: string;
  title: string;
  content: string;
  initiator: string;
  department: string;
  date: string;
  status: MemoStatus;
  currentHandler: Role;
  entity: Entity;
  workflow: {
    role: Role;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
    date?: string;
    comment?: string;
    signature?: string;
  }[];
  attachments: string[];
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  cost: string;
  cause: string;
  date: string;
  department: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  assignedTo: Role[]; // IT, MD, Risk
  entity: Entity;
  reviews: {
    role: Role;
    comment?: string;
    date?: string;
  }[];
};

export type Ticket = {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo: 'IT';
  entity: Entity;
  comments: {
    user: string;
    text: string;
    date: string;
  }[];
};

interface AppState {
  currentEntity: Entity | null;
  setEntity: (entity: Entity | null) => void;

  currentUser: User;
  users: User[];
  memos: Memo[];
  issues: Issue[];
  tickets: Ticket[];
  
  setCurrentUser: (role: Role) => void;
  createMemo: (memo: Omit<Memo, 'id' | 'status' | 'currentHandler' | 'workflow' | 'entity'>) => void;
  approveMemo: (id: string, comment: string, signature: string) => void;
  rejectMemo: (id: string, comment: string) => void;
  
  createIssue: (issue: Omit<Issue, 'id' | 'status' | 'reviews' | 'entity'>) => void;
  reviewIssue: (id: string, comment: string) => void;
  
  createTicket: (ticket: Omit<Ticket, 'id' | 'status' | 'comments' | 'entity'>) => void;
  updateTicketStatus: (id: string, status: Ticket['status'], comment?: string) => void;
  resubmitMemo: (id: string, newContent: string) => void;
  notifications: { id: string; message: string; date: string; read: boolean }[];
  addNotification: (message: string) => void;
  markNotificationRead: (id: string) => void;
  
  auditLogs: { id: string; action: string; user: string; role: string; details: string; timestamp: string; entity?: Entity }[];
  addAuditLog: (action: string, details: string) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  createUser: (name: string, role: Role) => void;
  deleteUser: (id: string) => void;
  resetPassword: (id: string) => void;
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Alice Initiator', role: 'Initiator', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
  { id: '2', name: 'Bob HOD', role: 'HOD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: '3', name: 'Charlie Ops', role: 'Operations', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
  { id: '4', name: 'Dana EAG', role: 'EAG', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dana' },
  { id: '5', name: 'Eve MD', role: 'MD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve' },
  { id: '6', name: 'Frank Finance', role: 'Finance', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank' },
  { id: '7', name: 'Grace IT', role: 'IT', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace' },
  { id: '8', name: 'Harry Risk', role: 'Risk', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harry' },
];

const INITIAL_MEMOS: Memo[] = [
  {
    id: 'MEM-2024-001',
    title: 'Q1 Budget Approval for Marketing Campaign',
    content: 'Requesting approval for the Q1 digital marketing budget allocation of $50,000.',
    initiator: 'Alice Initiator',
    department: 'Marketing',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'Pending HOD',
    currentHandler: 'HOD',
    entity: 'Alpha10 Fund Management',
    workflow: [
      { role: 'HOD', status: 'Pending' },
      { role: 'Operations', status: 'Pending' },
      { role: 'EAG', status: 'Pending' },
      { role: 'MD', status: 'Pending' },
      { role: 'Finance', status: 'Pending' },
    ],
    attachments: ['budget_v1.pdf'],
  },
  {
    id: 'MEM-2024-002',
    title: 'Procurement of New Laptops',
    content: 'Request to purchase 5 MacBook Pros for the design team.',
    initiator: 'Alice Initiator',
    department: 'Design',
    date: format(addDays(new Date(), -2), 'yyyy-MM-dd'),
    status: 'Pending EAG',
    currentHandler: 'EAG',
    entity: 'Alpha10 Fund Management',
    workflow: [
      { role: 'HOD', status: 'Approved', date: format(addDays(new Date(), -1), 'yyyy-MM-dd'), comment: 'Approved, within budget.', signature: 'Bob HOD' },
      { role: 'Operations', status: 'Approved', date: format(addDays(new Date(), -1), 'yyyy-MM-dd'), comment: 'Stock available from preferred vendor.', signature: 'Charlie Ops' },
      { role: 'EAG', status: 'Pending' },
      { role: 'MD', status: 'Pending' },
      { role: 'Finance', status: 'Pending' },
    ],
    attachments: ['quote_apple.pdf'],
  }
];

export const useStore = create<AppState>((set, get) => ({
  currentEntity: null,
  setEntity: (entity) => set({ currentEntity: entity }),

  currentUser: MOCK_USERS[0],
  users: MOCK_USERS,
  memos: INITIAL_MEMOS,
  issues: [
    {
      id: 'ISS-001',
      title: 'Server Room Overheating',
      description: 'The main server room AC unit is malfunctioning.',
      cost: '$1200',
      cause: 'Compressor failure',
      date: '2024-10-25',
      department: 'IT',
      status: 'In Progress',
      assignedTo: ['IT', 'MD', 'Risk'],
      entity: 'Alpha10 Advisory',
      reviews: [
        { role: 'IT', comment: 'Assessed. Need replacement part.', date: '2024-10-26' }
      ]
    }
  ],
  tickets: [
    {
      id: 'TKT-101',
      title: 'Email Access Issue',
      priority: 'High',
      description: 'Cannot access Outlook since password reset.',
      status: 'Open',
      assignedTo: 'IT',
      entity: 'Alpha10 Global Market Limited',
      comments: []
    }
  ],

  setCurrentUser: (role) => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) set({ currentUser: user });
  },

  createMemo: (memoData) => set((state) => {
    const newMemoId = `MEM-${new Date().getFullYear()}-${String(state.memos.length + 1).padStart(3, '0')}`;
    state.addAuditLog('Create Memo', `Memo ${newMemoId} created: ${memoData.title}`);
    return {
    memos: [...state.memos, {
      ...memoData,
      id: newMemoId,
      status: 'Pending HOD',
      currentHandler: 'HOD',
      entity: state.currentEntity || 'Alpha10 Fund Management',
      workflow: [
        { role: 'HOD', status: 'Pending' },
        { role: 'Operations', status: 'Pending' },
        { role: 'EAG', status: 'Pending' },
        { role: 'MD', status: 'Pending' },
        { role: 'Finance', status: 'Pending' },
      ],
      attachments: [],
    }]
  };
  }),

  approveMemo: (id, comment, signature) => set((state) => {
    const memo = state.memos.find(m => m.id === id);
    if (!memo) return state;

    const currentStepIndex = memo.workflow.findIndex(w => w.role === memo.currentHandler);
    if (currentStepIndex === -1) return state;

    const newWorkflow = [...memo.workflow];
    newWorkflow[currentStepIndex] = {
      ...newWorkflow[currentStepIndex],
      status: 'Approved',
      date: format(new Date(), 'yyyy-MM-dd'),
      comment,
      signature
    };

    const nextStepIndex = currentStepIndex + 1;
    let nextHandler: Role = memo.currentHandler;
    let nextStatus: MemoStatus = memo.status;

    if (nextStepIndex < newWorkflow.length) {
      nextHandler = newWorkflow[nextStepIndex].role;
      nextStatus = `Pending ${nextHandler}` as MemoStatus;
      state.addNotification(`Memo ${memo.id} forwarded to ${nextHandler}`);
    } else {
      nextStatus = 'Approved';
      state.addNotification(`Memo ${memo.id} has been fully approved!`);
    }

    return {
      memos: state.memos.map(m => m.id === id ? {
        ...m,
        workflow: newWorkflow,
        currentHandler: nextHandler,
        status: nextStatus
      } : m)
    };
  }),

  rejectMemo: (id, comment) => set((state) => {
    const memo = state.memos.find(m => m.id === id);
    if (memo) state.addNotification(`Memo ${memo.id} was rejected by ${state.currentUser.role}`);
    
    return {
      memos: state.memos.map(memo => {
        if (memo.id !== id) return memo;
        const currentStepIndex = memo.workflow.findIndex(w => w.role === memo.currentHandler);
        const newWorkflow = [...memo.workflow];
        newWorkflow[currentStepIndex] = {
          ...newWorkflow[currentStepIndex],
          status: 'Rejected',
          date: format(new Date(), 'yyyy-MM-dd'),
          comment
        };
        
        return {
          ...memo,
          workflow: newWorkflow,
          status: 'Rejected'
        };
      })
    };
  }),

  createIssue: (issue) => set(state => ({
    issues: [...state.issues, { ...issue, id: `ISS-${state.issues.length + 1}`, status: 'Open', reviews: [], entity: state.currentEntity || 'Alpha10 Fund Management' }]
  })),

  reviewIssue: (id, comment) => set(state => ({
    issues: state.issues.map(i => i.id === id ? { 
      ...i, 
      reviews: [...i.reviews, { role: state.currentUser.role, comment, date: format(new Date(), 'yyyy-MM-dd') }] 
    } : i)
  })),

  createTicket: (ticket) => set(state => ({
    tickets: [...state.tickets, { ...ticket, id: `TKT-${state.tickets.length + 100}`, status: 'Open', comments: [], entity: state.currentEntity || 'Alpha10 Fund Management' }]
  })),

  updateTicketStatus: (id, status, comment) => set(state => ({
    tickets: state.tickets.map(t => {
      if (t.id !== id) return t;
      const newComments = comment ? [...t.comments, { user: state.currentUser.name, text: comment, date: format(new Date(), 'yyyy-MM-dd') }] : t.comments;
      return { ...t, status, comments: newComments };
    })
  })),

  notifications: [],
  addNotification: (message) => set(state => ({
    notifications: [{ id: Math.random().toString(), message, date: new Date().toISOString(), read: false }, ...state.notifications]
  })),
  markNotificationRead: (id) => set(state => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  resubmitMemo: (id, newContent) => set(state => {
    state.addAuditLog('Resubmit Memo', `Memo ${id} resubmitted by initiator`);
    state.addNotification(`Memo ${id} has been resubmitted`);
    return {
      memos: state.memos.map(m => m.id === id ? {
        ...m,
        content: newContent,
        status: 'Pending HOD',
        currentHandler: 'HOD',
        workflow: m.workflow.map(w => ({ ...w, status: 'Pending', date: undefined, comment: undefined, signature: undefined }))
      } : m)
    };
  }),

  auditLogs: [
    { id: 'LOG-001', action: 'System Init', user: 'System', role: 'System', details: 'System initialized with mock data', timestamp: new Date().toISOString() }
  ],
  
  addAuditLog: (action, details) => set(state => ({
    auditLogs: [{
      id: `LOG-${Date.now()}`,
      action,
      user: state.currentUser.name,
      role: state.currentUser.role,
      details,
      timestamp: new Date().toISOString(),
      entity: state.currentEntity || undefined
    }, ...state.auditLogs]
  })),

  updateUser: (id, updates) => set(state => ({
    users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
    currentUser: state.currentUser.id === id ? { ...state.currentUser, ...updates } : state.currentUser
  })),

  createUser: (name, role) => set(state => ({
    users: [...state.users, {
      id: (state.users.length + 1).toString(),
      name,
      role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    }]
  })),

  deleteUser: (id) => set(state => ({
    users: state.users.filter(u => u.id !== id)
  })),

  resetPassword: (id) => set(state => {
    const user = state.users.find(u => u.id === id);
    if (user) {
      state.addAuditLog('Password Reset', `Password reset for user ${user.name} by administrator`);
    }
    return {};
  })
}));
