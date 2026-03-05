import { create } from 'zustand';

export type Entity = 'Alpha10 Fund Management' | 'Alpha10 Advisory' | 'Alpha10 Global Market Limited';
export type Role = 'Initiator' | 'HOD' | 'Administrative Department' | 'Operations' | 'EAG' | 'MD' | 'Finance' | 'IT' | 'Risk';

export type User = {
  id: number;
  name: string;
  username: string;
  role: Role;
  avatar: string;
  entity?: Entity;
  email?: string;
  phone?: string;
};

export type MemoStatus = 'Draft' | 'Pending HOD' | 'Pending Administrative Department' | 'Pending Operations' | 'Pending EAG' | 'Pending Finance' | 'Pending MD' | 'Approved' | 'Rejected' | 'Treated';

export type Memo = {
  id: number;
  memoId: string;
  memoType: 'Memo' | 'Procurement';
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
  attachments: Array<{ originalName: string; url: string }>;
  treatedBy?: string;
  treatedDate?: string;
  treatedComment?: string;
};

export type Issue = {
  id: number;
  issueId: string;
  title: string;
  description: string;
  cost: string;
  cause: string;
  date: string;
  department: string;
  createdBy?: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  assignedTo: Role[];
  entity: Entity;
  reviews: {
    role: Role;
    comment?: string;
    date?: string;
  }[];
  attachments: Array<{ originalName: string; url: string }>;
};

export type Ticket = {
  id: number;
  ticketId: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo: 'IT';
  createdBy?: string;
  department?: string;
  entity: Entity;
  comments: {
    user: string;
    text: string;
    date: string;
  }[];
  attachments: Array<{ originalName: string; url: string }>;
  createdAt: string;
};

export type RiskReport = {
  id: number;
  reportId: string;
  title: string;
  description: string;
  riskCategory: string;
  likelihood: string;
  impact: string;
  date: string;
  department: string;
  mitigationPlan: string;
  createdBy: string;
  status: 'Open' | 'Under Review' | 'Resolved';
  assignedTo: string[];
  entity: Entity;
  reviews: {
    role: string;
    comment?: string;
    date?: string;
  }[];
  attachments: Array<{ originalName: string; url: string }>;
};

interface AppState {
  currentEntity: Entity | null;
  currentUser: User | null;
  setEntity: (entity: Entity | null) => void;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentEntity: null,
  currentUser: null,
  setEntity: (entity) => set({ currentEntity: entity }),
  setCurrentUser: (user) => set({ currentUser: user }),
  logout: () => set({ currentEntity: null, currentUser: null }),
}));
