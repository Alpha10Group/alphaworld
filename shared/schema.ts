import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, serial, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const entityEnum = z.enum(['Alpha10 Fund Management', 'Alpha10 Advisory', 'Alpha10 Global Market Limited']);
export const roleEnum = z.enum(['Initiator', 'HOD', 'Administrative Department', 'Operations', 'EAG', 'MD', 'Finance', 'IT', 'Risk']);
export const memoStatusEnum = z.enum(['Draft', 'Pending HOD', 'Pending Administrative Department', 'Pending Operations', 'Pending EAG', 'Pending MD', 'Approved', 'Rejected']);
export const issueStatusEnum = z.enum(['Open', 'In Progress', 'Resolved']);
export const ticketStatusEnum = z.enum(['Open', 'In Progress', 'Resolved', 'Closed']);
export const ticketPriorityEnum = z.enum(['Low', 'Medium', 'High', 'Critical']);

export type Entity = z.infer<typeof entityEnum>;
export type Role = z.infer<typeof roleEnum>;
export type MemoStatus = z.infer<typeof memoStatusEnum>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  entity: text("entity"),
  avatar: text("avatar"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memos = pgTable("memos", {
  id: serial("id").primaryKey(),
  memoId: text("memo_id").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  initiator: text("initiator").notNull(),
  department: text("department").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull(),
  currentHandler: text("current_handler").notNull(),
  entity: text("entity").notNull(),
  workflow: json("workflow").notNull().$type<Array<{
    role: string;
    status: string;
    date?: string;
    comment?: string;
    signature?: string;
  }>>(),
  attachments: json("attachments").notNull().$type<Array<{ originalName: string; url: string }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("memos_entity_idx").on(table.entity),
  index("memos_status_idx").on(table.status),
  index("memos_entity_status_idx").on(table.entity, table.status),
  index("memos_created_at_idx").on(table.createdAt),
]);

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  issueId: text("issue_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  cost: text("cost").notNull(),
  cause: text("cause").notNull(),
  date: text("date").notNull(),
  department: text("department").notNull(),
  createdBy: text("created_by"),
  status: text("status").notNull(),
  entity: text("entity").notNull(),
  assignedTo: json("assigned_to").notNull().$type<string[]>(),
  reviews: json("reviews").notNull().$type<Array<{
    role: string;
    comment?: string;
    date?: string;
  }>>(),
  attachments: json("issue_attachments").notNull().$type<Array<{ originalName: string; url: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("issues_entity_idx").on(table.entity),
  index("issues_status_idx").on(table.status),
  index("issues_entity_status_idx").on(table.entity, table.status),
  index("issues_created_at_idx").on(table.createdAt),
]);

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketId: text("ticket_id").notNull().unique(),
  title: text("title").notNull(),
  priority: text("priority").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  assignedTo: text("assigned_to").notNull(),
  createdBy: text("created_by"),
  department: text("department"),
  entity: text("entity").notNull(),
  comments: json("comments").notNull().$type<Array<{
    user: string;
    text: string;
    date: string;
  }>>(),
  attachments: json("ticket_attachments").notNull().$type<Array<{ originalName: string; url: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("tickets_entity_idx").on(table.entity),
  index("tickets_status_idx").on(table.status),
  index("tickets_priority_idx").on(table.priority),
  index("tickets_entity_status_idx").on(table.entity, table.status),
  index("tickets_created_at_idx").on(table.createdAt),
]);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  user: text("user").notNull(),
  role: text("role").notNull(),
  entity: text("entity"),
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("audit_logs_entity_idx").on(table.entity),
  index("audit_logs_timestamp_idx").on(table.timestamp),
]);

export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  email: text("email").notNull().default('false'),
  sms: text("sms").notNull().default('false'),
  desktop: text("desktop").notNull().default('true'),
  phoneNumber: text("phone_number").default(''),
  emailAddress: text("email_address").default(''),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMemoSchema = createInsertSchema(memos).omit({
  id: true,
  memoId: true,
  status: true,
  currentHandler: true,
  workflow: true,
  createdAt: true,
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  issueId: true,
  status: true,
  reviews: true,
  createdAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketId: true,
  status: true,
  comments: true,
  createdAt: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Memo = typeof memos.$inferSelect;
export type InsertMemo = z.infer<typeof insertMemoSchema>;

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
