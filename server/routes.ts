import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertMemoSchema, insertIssueSchema, insertTicketSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import { z } from "zod";
import { sendEmailNotification, sendSMSNotification, type NotificationPayload } from "./notifications";

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    entity?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, entity } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.entity = entity;
      
      await storage.createAuditLog({
        action: 'Login',
        user: user.name,
        role: user.role,
        entity: entity,
        details: `User logged in to ${entity}`
      });

      res.json({ user: { ...user, password: undefined }, entity });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { ...user, password: undefined }, entity: req.session.entity });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User management routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userData = {
        ...req.body,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.body.name}`
      };
      
      const user = await storage.createUser(userData);
      
      await storage.createAuditLog({
        action: 'Create User',
        user: (await storage.getUser(req.session.userId!))!.name,
        role: (await storage.getUser(req.session.userId!))!.role,
        entity: req.session.entity,
        details: `Created user ${user.name} with role ${user.role}`
      });
      
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, req.body);
      
      await storage.createAuditLog({
        action: 'Update User',
        user: (await storage.getUser(req.session.userId!))!.name,
        role: (await storage.getUser(req.session.userId!))!.role,
        entity: req.session.entity,
        details: `Updated user ${user?.name}`
      });
      
      res.json(user ? { ...user, password: undefined } : null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      await storage.deleteUser(id);
      
      await storage.createAuditLog({
        action: 'Delete User',
        user: (await storage.getUser(req.session.userId!))!.name,
        role: (await storage.getUser(req.session.userId!))!.role,
        entity: req.session.entity,
        details: `Deleted user ${user?.name}`
      });
      
      res.json({ message: "User deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users/:id/reset-password", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const hashedPassword = await bcrypt.hash('password123', 10);
      await storage.updateUser(id, { password: hashedPassword });
      
      const user = await storage.getUser(id);
      await storage.createAuditLog({
        action: 'Password Reset',
        user: (await storage.getUser(req.session.userId!))!.name,
        role: (await storage.getUser(req.session.userId!))!.role,
        entity: req.session.entity,
        details: `Reset password for user ${user?.name}`
      });
      
      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Memo routes
  app.get("/api/memos", requireAuth, async (req, res) => {
    try {
      const memos = await storage.getAllMemos(req.session.entity!);
      res.json(memos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/memos/:id", requireAuth, async (req, res) => {
    try {
      const memo = await storage.getMemoByMemoId(req.params.id);
      res.json(memo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/memos", requireAuth, async (req, res) => {
    try {
      const memoCount = (await storage.getAllMemos(req.session.entity!)).length;
      const memoId = `MEM-${new Date().getFullYear()}-${String(memoCount + 1).padStart(3, '0')}`;
      
      const memoData = {
        ...req.body,
        memoId,
        status: 'Pending HOD',
        currentHandler: 'HOD',
        entity: req.session.entity!,
        workflow: [
          { role: 'HOD', status: 'Pending' },
          { role: 'Operations', status: 'Pending' },
          { role: 'EAG', status: 'Pending' },
          { role: 'MD', status: 'Pending' },
          { role: 'Finance', status: 'Pending' },
        ],
        attachments: []
      };
      
      const memo = await storage.createMemo(memoData);
      
      const currentUser = await storage.getUser(req.session.userId!);
      
      await storage.createAuditLog({
        action: 'Create Memo',
        user: currentUser!.name,
        role: currentUser!.role,
        entity: req.session.entity,
        details: `Created memo ${memoId}: ${memo.title}`
      });
      
      // Send notification to HOD (first approver) - only for the memo's entity
      const hodUsers = await storage.getUsersByRole('HOD', req.session.entity);
      for (const hod of hodUsers) {
        // Send email notification
        try {
          await sendEmailNotification({
            type: 'memo_created',
            title: 'New Memo Requires Your Approval',
            message: `A new memo "${memo.title}" has been submitted and requires your review and approval.`,
            recipientEmail: hod.email,
            recipientName: hod.name,
            memoId: memoId,
            entity: req.session.entity
          });
        } catch (err) {
          console.error('Failed to send email to HOD:', err);
        }
        
        // Send SMS notification if phone number exists
        if (hod.phone) {
          try {
            await sendSMSNotification(
              hod.phone,
              `[Alpha10 World] New memo "${memo.title}" requires your approval. Ref: ${memoId}`
            );
          } catch (err) {
            console.error('Failed to send SMS to HOD:', err);
          }
        }
      }
      
      res.json(memo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/memos/:id/approve", requireAuth, async (req, res) => {
    try {
      const { comment, signature } = req.body;
      const memo = await storage.getMemoByMemoId(req.params.id);
      
      if (!memo) {
        return res.status(404).json({ message: "Memo not found" });
      }

      const currentStepIndex = memo.workflow.findIndex((w: any) => w.role === memo.currentHandler);
      const newWorkflow = [...memo.workflow];
      newWorkflow[currentStepIndex] = {
        ...newWorkflow[currentStepIndex],
        status: 'Approved',
        date: new Date().toISOString().split('T')[0],
        comment,
        signature
      };

      const nextStepIndex = currentStepIndex + 1;
      let nextHandler = memo.currentHandler;
      let nextStatus = memo.status;

      if (nextStepIndex < newWorkflow.length) {
        nextHandler = newWorkflow[nextStepIndex].role;
        nextStatus = `Pending ${nextHandler}`;
      } else {
        nextStatus = 'Approved';
      }

      const updatedMemo = await storage.updateMemo(memo.id, {
        workflow: newWorkflow,
        currentHandler: nextHandler,
        status: nextStatus
      });

      const currentUser = await storage.getUser(req.session.userId!);
      
      await storage.createAuditLog({
        action: 'Approve Memo',
        user: currentUser!.name,
        role: currentUser!.role,
        entity: req.session.entity,
        details: `Approved memo ${req.params.id}`
      });

      // Send notification to next approver if memo is not fully approved - only for the memo's entity
      if (nextStatus !== 'Approved' && nextHandler !== memo.currentHandler) {
        const nextApprovers = await storage.getUsersByRole(nextHandler, memo.entity);
        for (const approver of nextApprovers) {
          // Send email notification
          try {
            await sendEmailNotification({
              type: 'memo_approved',
              title: 'Memo Requires Your Approval',
              message: `Memo "${memo.title}" has been approved by ${currentUser!.name} (${currentUser!.role}) and now requires your review and approval.`,
              recipientEmail: approver.email,
              recipientName: approver.name,
              memoId: memo.memoId,
              entity: req.session.entity
            });
          } catch (err) {
            console.error(`Failed to send email to ${nextHandler}:`, err);
          }
          
          // Send SMS notification if phone number exists
          if (approver.phone) {
            try {
              await sendSMSNotification(
                approver.phone,
                `[Alpha10 World] Memo "${memo.title}" requires your approval. Approved by ${currentUser!.name}. Ref: ${memo.memoId}`
              );
            } catch (err) {
              console.error(`Failed to send SMS to ${nextHandler}:`, err);
            }
          }
        }
      }

      res.json(updatedMemo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/memos/:id/reject", requireAuth, async (req, res) => {
    try {
      const { comment } = req.body;
      const memo = await storage.getMemoByMemoId(req.params.id);
      
      if (!memo) {
        return res.status(404).json({ message: "Memo not found" });
      }

      const currentStepIndex = memo.workflow.findIndex((w: any) => w.role === memo.currentHandler);
      const newWorkflow = [...memo.workflow];
      newWorkflow[currentStepIndex] = {
        ...newWorkflow[currentStepIndex],
        status: 'Rejected',
        date: new Date().toISOString().split('T')[0],
        comment
      };

      const updatedMemo = await storage.updateMemo(memo.id, {
        workflow: newWorkflow,
        status: 'Rejected'
      });

      await storage.createAuditLog({
        action: 'Reject Memo',
        user: (await storage.getUser(req.session.userId!))!.name,
        role: (await storage.getUser(req.session.userId!))!.role,
        entity: req.session.entity,
        details: `Rejected memo ${req.params.id}`
      });

      res.json(updatedMemo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/memos/:id/resubmit", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      const memo = await storage.getMemoByMemoId(req.params.id);
      
      if (!memo) {
        return res.status(404).json({ message: "Memo not found" });
      }

      const resetWorkflow = memo.workflow.map((w: any) => ({
        ...w,
        status: 'Pending',
        date: undefined,
        comment: undefined,
        signature: undefined
      }));

      const updatedMemo = await storage.updateMemo(memo.id, {
        content,
        status: 'Pending HOD',
        currentHandler: 'HOD',
        workflow: resetWorkflow
      });

      await storage.createAuditLog({
        action: 'Resubmit Memo',
        user: (await storage.getUser(req.session.userId!))!.name,
        role: (await storage.getUser(req.session.userId!))!.role,
        entity: req.session.entity,
        details: `Resubmitted memo ${req.params.id}`
      });

      res.json(updatedMemo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Issue routes
  app.get("/api/issues", requireAuth, async (req, res) => {
    try {
      const issues = await storage.getAllIssues(req.session.entity!);
      res.json(issues);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/issues", requireAuth, async (req, res) => {
    try {
      const issueCount = (await storage.getAllIssues(req.session.entity!)).length;
      const issueId = `ISS-${String(issueCount + 1).padStart(3, '0')}`;
      
      const issueData = {
        ...req.body,
        issueId,
        status: 'Open',
        entity: req.session.entity!,
        reviews: []
      };
      
      const issue = await storage.createIssue(issueData);
      
      await storage.createAuditLog({
        action: 'Create Issue',
        user: (await storage.getUser(req.session.userId!))!.name,
        role: (await storage.getUser(req.session.userId!))!.role,
        entity: req.session.entity,
        details: `Created issue ${issueId}: ${issue.title}`
      });
      
      res.json(issue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/issues/:id/review", requireAuth, async (req, res) => {
    try {
      const { comment } = req.body;
      const issue = await storage.getIssue(parseInt(req.params.id));
      
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const currentUser = await storage.getUser(req.session.userId!);
      const newReviews = [
        ...issue.reviews,
        {
          role: currentUser!.role,
          comment,
          date: new Date().toISOString().split('T')[0]
        }
      ];

      const updatedIssue = await storage.updateIssue(issue.id, {
        reviews: newReviews
      });

      await storage.createAuditLog({
        action: 'Review Issue',
        user: currentUser!.name,
        role: currentUser!.role,
        entity: req.session.entity,
        details: `Reviewed issue ${issue.issueId}`
      });

      res.json(updatedIssue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Ticket routes
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getAllTickets(req.session.entity!);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      const ticketCount = (await storage.getAllTickets(req.session.entity!)).length;
      const ticketId = `TKT-${String(ticketCount + 100).padStart(3, '0')}`;
      
      const ticketData = {
        ...req.body,
        ticketId,
        status: 'Open',
        entity: req.session.entity!,
        comments: []
      };
      
      const ticket = await storage.createTicket(ticketData);
      
      await storage.createAuditLog({
        action: 'Create Ticket',
        user: (await storage.getUser(req.session.userId!))!.name,
        role: (await storage.getUser(req.session.userId!))!.role,
        entity: req.session.entity,
        details: `Created ticket ${ticketId}: ${ticket.title}`
      });
      
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/tickets/:id/status", requireAuth, async (req, res) => {
    try {
      const { status, comment } = req.body;
      const ticket = await storage.getTicket(parseInt(req.params.id));
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const currentUser = await storage.getUser(req.session.userId!);
      let newComments = ticket.comments;
      
      if (comment) {
        newComments = [
          ...ticket.comments,
          {
            user: currentUser!.name,
            text: comment,
            date: new Date().toISOString().split('T')[0]
          }
        ];
      }

      const updatedTicket = await storage.updateTicket(ticket.id, {
        status,
        comments: newComments
      });

      await storage.createAuditLog({
        action: 'Update Ticket',
        user: currentUser!.name,
        role: currentUser!.role,
        entity: req.session.entity,
        details: `Updated ticket ${ticket.ticketId} status to ${status}`
      });

      res.json(updatedTicket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Audit log routes
  app.get("/api/audit-logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getAllAuditLogs(req.session.entity);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification settings routes
  app.get("/api/notification-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getNotificationSettings(req.session.userId!);
      res.json(settings || {
        email: 'true',
        sms: 'false',
        desktop: 'true',
        phoneNumber: '+1 (555) 000-0000',
        emailAddress: 'user@alpha10.com'
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notification-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.updateNotificationSettings(req.session.userId!, req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
