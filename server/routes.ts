import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { insertUserSchema, insertMemoSchema, insertIssueSchema, insertTicketSchema, insertRiskReportSchema, issues, tickets, riskReports } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import { z } from "zod";
import { sendEmailNotification, sendSMSNotification, type NotificationPayload } from "./notifications";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      '.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.svg',
      '.xlsx', '.xls', '.csv', '.txt', '.rtf',
      '.pptx', '.ppt', '.odt', '.ods', '.odp',
      '.zip', '.rar', '.7z',
      '.mp4', '.mp3', '.wav',
      '.html', '.xml', '.json',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Supported: PDF, Word, Excel, PowerPoint, Images, Archives, and more.`));
    }
  }
});

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
  // Trust proxy for Railway/Render/etc reverse proxies
  app.set('trust proxy', 1);

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  const express = await import('express');
  app.use('/uploads', express.default.static(uploadsDir));

  app.get("/api/download", (req: any, res) => {
    const filePath = req.query.path as string;
    const fileName = req.query.name as string;
    if (!filePath) {
      return res.status(400).json({ message: "Missing file path" });
    }
    const fullPath = path.join(process.cwd(), filePath);
    if (!fullPath.startsWith(uploadsDir)) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: "File not found" });
    }
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName || path.basename(fullPath))}"`);
    res.sendFile(fullPath);
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  app.post("/api/upload", requireAuth, upload.array('files', 20), (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const fileInfos = files.map(f => ({
        originalName: f.originalname,
        filename: f.filename,
        url: `/uploads/${f.filename}`,
        size: f.size
      }));
      res.json(fileInfos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

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
      const allMemos = await storage.getAllMemos();
      const year = new Date().getFullYear();
      const prefix = `MEM-${year}-`;
      let maxNum = 0;
      for (const m of allMemos) {
        if (m.memoId.startsWith(prefix)) {
          const num = parseInt(m.memoId.replace(prefix, ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      const memoId = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
      
      const memoData = {
        ...req.body,
        memoId,
        status: 'Pending HOD',
        currentHandler: 'HOD',
        entity: req.session.entity!,
        workflow: [
          { role: 'HOD', status: 'Pending' },
          { role: 'Administrative Department', status: 'Pending' },
          { role: 'Operations', status: 'Pending' },
          { role: 'EAG', status: 'Pending' },
          { role: 'MD', status: 'Pending' },
        ],
        attachments: req.body.attachments || []
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
      
      // Send notification to HOD (first approver)
      // Note: Entity filtering on users is not supported since users don't have a fixed entity.
      // All HOD users will be notified; they can only action memos in their selected entity.
      const hodUsers = await storage.getUsersByRole('HOD');
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

      // Send notification to next approver if memo is not fully approved
      if (nextStatus !== 'Approved' && nextHandler !== memo.currentHandler) {
        const nextApprovers = await storage.getUsersByRole(nextHandler);
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
      const { content, title, attachments } = req.body;
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

      const updateData: any = {
        content,
        status: 'Pending HOD',
        currentHandler: 'HOD',
        workflow: resetWorkflow
      };
      if (title) {
        updateData.title = title;
      }
      if (attachments) {
        updateData.attachments = attachments;
      }

      const updatedMemo = await storage.updateMemo(memo.id, updateData);

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

  app.patch("/api/memos/:id/treat", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'Finance') {
        return res.status(403).json({ message: "Only Finance department can mark memos as treated" });
      }

      const memo = await storage.getMemoByMemoId(req.params.id);
      if (!memo) {
        return res.status(404).json({ message: "Memo not found" });
      }

      if (memo.status !== 'Approved') {
        return res.status(400).json({ message: "Only approved memos can be marked as treated" });
      }

      const { comment } = req.body;

      const updatedMemo = await storage.updateMemo(memo.id, {
        status: 'Treated',
        treatedBy: currentUser.name,
        treatedDate: new Date().toISOString().split('T')[0],
        treatedComment: comment || ''
      });

      await storage.createAuditLog({
        action: 'Treat Memo',
        user: currentUser.name,
        role: currentUser.role,
        entity: req.session.entity,
        details: `Marked memo ${req.params.id} as treated`
      });

      res.json(updatedMemo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/memos/:id/attachments", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'IT') {
        return res.status(403).json({ message: "Only IT department can delete attachments" });
      }
      const memo = await storage.getMemo(parseInt(req.params.id));
      if (!memo) {
        return res.status(404).json({ message: "Memo not found" });
      }
      const { attachmentUrl } = req.body;
      const updatedAttachments = (memo.attachments || []).filter(
        (att: any) => att.url !== attachmentUrl
      );
      const updated = await storage.updateMemo(memo.id, { attachments: updatedAttachments });

      const filename = attachmentUrl.split('/').pop();
      if (filename) {
        const filePath = path.join(uploadsDir, filename);
        fs.unlink(filePath, () => {});
      }

      await storage.createAuditLog({
        action: 'Delete Attachment',
        user: currentUser.name,
        role: currentUser.role,
        entity: req.session.entity,
        details: `Deleted attachment from memo ${memo.memoId}`
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/memos", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'IT') {
        return res.status(403).json({ message: "Only IT department can delete all memos" });
      }
      const count = await storage.deleteAllMemos(req.session.entity!);

      await storage.createAuditLog({
        action: 'Delete All Memos',
        user: currentUser.name,
        role: currentUser.role,
        entity: req.session.entity,
        details: `Deleted ${count} memo(s) for entity ${req.session.entity}`
      });

      res.json({ message: `${count} memo(s) deleted successfully`, count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Issue routes
  app.get("/api/issues", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      const allIssues = await storage.getAllIssues(req.session.entity!);
      const issueViewRoles = ['IT', 'Risk'];
      if (currentUser && issueViewRoles.includes(currentUser.role)) {
        res.json(allIssues);
      } else {
        res.json(allIssues.filter(i => i.createdBy === currentUser?.name));
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/issues", requireAuth, async (req, res) => {
    try {
      const allIssuesAllEntities = await db.select({ issueId: issues.issueId }).from(issues);
      let maxNum = 0;
      for (const row of allIssuesAllEntities) {
        const match = row.issueId.match(/ISS-(\d+)/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
      const issueId = `ISS-${String(maxNum + 1).padStart(3, '0')}`;
      
      const currentUser = await storage.getUser(req.session.userId!);
      const issueData = {
        ...req.body,
        issueId,
        createdBy: currentUser?.name || 'Unknown',
        status: 'Open',
        entity: req.session.entity!,
        reviews: [],
        attachments: req.body.attachments || []
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

  app.get("/api/issues/:id", requireAuth, async (req, res) => {
    try {
      const issue = await storage.getIssue(parseInt(req.params.id));
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
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

  app.delete("/api/issues/:id/attachments", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'IT') {
        return res.status(403).json({ message: "Only IT department can delete attachments" });
      }
      const issue = await storage.getIssue(parseInt(req.params.id));
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      const { attachmentUrl } = req.body;
      const updatedAttachments = (issue.attachments || []).filter(
        (att: any) => att.url !== attachmentUrl
      );
      const updated = await storage.updateIssue(issue.id, { attachments: updatedAttachments });

      const filename = attachmentUrl.split('/').pop();
      if (filename) {
        const filePath = path.join(uploadsDir, filename);
        fs.unlink(filePath, () => {});
      }

      await storage.createAuditLog({
        action: 'Delete Attachment',
        user: currentUser.name,
        role: currentUser.role,
        entity: req.session.entity,
        details: `Deleted attachment from issue ${issue.issueId}`
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Ticket routes
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      const allTickets = await storage.getAllTickets(req.session.entity!);
      const ticketViewRoles = ['IT'];
      if (currentUser && ticketViewRoles.includes(currentUser.role)) {
        res.json(allTickets);
      } else {
        res.json(allTickets.filter(t => t.createdBy === currentUser?.name));
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getTicket(parseInt(req.params.id));
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/tickets/:id/attachments", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'IT') {
        return res.status(403).json({ message: "Only IT department can delete attachments" });
      }
      const ticket = await storage.getTicket(parseInt(req.params.id));
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      const { attachmentUrl } = req.body;
      const updatedAttachments = (ticket.attachments || []).filter(
        (att: any) => att.url !== attachmentUrl
      );
      const updated = await storage.updateTicket(ticket.id, { attachments: updatedAttachments });

      const filename = attachmentUrl.split('/').pop();
      if (filename) {
        const filePath = path.join(uploadsDir, filename);
        fs.unlink(filePath, () => {});
      }

      await storage.createAuditLog({
        action: 'Delete Attachment',
        user: currentUser.name,
        role: currentUser.role,
        entity: req.session.entity,
        details: `Deleted attachment from ticket ${ticket.ticketId}`
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      const allTicketsAllEntities = await db.select({ ticketId: tickets.ticketId }).from(tickets);
      let maxTicketNum = 0;
      for (const row of allTicketsAllEntities) {
        const match = row.ticketId.match(/TKT-(\d+)/);
        if (match) maxTicketNum = Math.max(maxTicketNum, parseInt(match[1], 10));
      }
      const ticketId = `TKT-${String(maxTicketNum + 1).padStart(3, '0')}`;
      
      const currentUser = await storage.getUser(req.session.userId!);
      const ticketData = {
        ...req.body,
        ticketId,
        status: 'Open',
        createdBy: currentUser?.name || 'Unknown',
        department: currentUser?.role || 'Unknown',
        entity: req.session.entity!,
        comments: [],
        attachments: req.body.attachments || []
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

  // Risk Report routes
  app.get("/api/risk-reports", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      const allReports = await storage.getAllRiskReports(req.session.entity!);
      const viewRoles = ['IT', 'Risk'];
      if (currentUser && viewRoles.includes(currentUser.role)) {
        res.json(allReports);
      } else {
        res.json(allReports.filter(r => r.createdBy === currentUser?.name));
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/risk-reports/:id", requireAuth, async (req, res) => {
    try {
      const report = await storage.getRiskReport(parseInt(req.params.id));
      if (!report) {
        return res.status(404).json({ message: "Risk report not found" });
      }
      const currentUser = await storage.getUser(req.session.userId!);
      if (currentUser && !['IT', 'Risk'].includes(currentUser.role) && report.createdBy !== currentUser.name) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/risk-reports", requireAuth, async (req, res) => {
    try {
      const { title, description, riskCategory, likelihood, impact, date, department, mitigationPlan, attachments } = req.body;
      if (!title || !description || !riskCategory || !likelihood || !impact || !date || !department || !mitigationPlan) {
        return res.status(400).json({ message: "Missing required fields: title, description, riskCategory, likelihood, impact, date, department, mitigationPlan" });
      }

      const allReportsAllEntities = await db.select({ reportId: riskReports.reportId }).from(riskReports);
      let maxNum = 0;
      for (const row of allReportsAllEntities) {
        const match = row.reportId.match(/RSK-(\d+)/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
      const reportId = `RSK-${String(maxNum + 1).padStart(3, '0')}`;

      const currentUser = await storage.getUser(req.session.userId!);
      const reportData = {
        title,
        description,
        riskCategory,
        likelihood,
        impact,
        date,
        department,
        mitigationPlan,
        reportId,
        createdBy: currentUser?.name || 'Unknown',
        status: 'Open',
        entity: req.session.entity!,
        reviews: [],
        attachments: attachments || [],
        assignedTo: ['IT', 'Risk']
      };

      const report = await storage.createRiskReport(reportData);

      await storage.createAuditLog({
        action: 'Create Risk Report',
        user: currentUser!.name,
        role: currentUser!.role,
        entity: req.session.entity,
        details: `Created risk report ${reportId}`
      });

      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/risk-reports/:id/review", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || !['IT', 'Risk'].includes(currentUser.role)) {
        return res.status(403).json({ message: "Only IT and Risk departments can review risk reports" });
      }

      const report = await storage.getRiskReport(parseInt(req.params.id));
      if (!report) {
        return res.status(404).json({ message: "Risk report not found" });
      }

      const { comment, status } = req.body;
      const newReviews = [...(report.reviews || []), {
        role: currentUser.role,
        comment: comment || '',
        date: new Date().toISOString().split('T')[0]
      }];

      const updates: any = { reviews: newReviews };
      if (status) updates.status = status;

      const updatedReport = await storage.updateRiskReport(report.id, updates);

      await storage.createAuditLog({
        action: 'Review Risk Report',
        user: currentUser.name,
        role: currentUser.role,
        entity: req.session.entity,
        details: `Reviewed risk report ${report.reportId}`
      });

      res.json(updatedReport);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/risk-reports/:id/attachments", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'IT') {
        return res.status(403).json({ message: "Only IT department can delete attachments" });
      }
      const report = await storage.getRiskReport(parseInt(req.params.id));
      if (!report) {
        return res.status(404).json({ message: "Risk report not found" });
      }
      const { attachmentUrl } = req.body;
      const updatedAttachments = (report.attachments || []).filter(
        (att: any) => att.url !== attachmentUrl
      );
      const updated = await storage.updateRiskReport(report.id, { attachments: updatedAttachments });

      const filename = attachmentUrl.split('/').pop();
      if (filename) {
        const filePath = path.join(uploadsDir, filename);
        fs.unlink(filePath, () => {});
      }

      await storage.createAuditLog({
        action: 'Delete Attachment',
        user: currentUser.name,
        role: currentUser.role,
        entity: req.session.entity,
        details: `Deleted attachment from risk report ${report.reportId}`
      });

      res.json(updated);
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
