import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, desc } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";
import type { 
  User, InsertUser, 
  Memo, InsertMemo,
  Issue, InsertIssue,
  Ticket, InsertTicket,
  AuditLog,
  NotificationSettings, InsertNotificationSettings
} from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string, entity?: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  
  // Memos
  getAllMemos(entity: string): Promise<Memo[]>;
  getMemo(id: number): Promise<Memo | undefined>;
  getMemoByMemoId(memoId: string): Promise<Memo | undefined>;
  createMemo(memo: InsertMemo): Promise<Memo>;
  updateMemo(id: number, updates: Partial<Memo>): Promise<Memo | undefined>;
  
  // Issues
  getAllIssues(entity: string): Promise<Issue[]>;
  getIssue(id: number): Promise<Issue | undefined>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: number, updates: Partial<Issue>): Promise<Issue | undefined>;
  
  // Tickets
  getAllTickets(entity: string): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined>;
  
  // Audit Logs
  getAllAuditLogs(entity?: string): Promise<AuditLog[]>;
  createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog>;
  
  // Notification Settings
  getNotificationSettings(userId: number): Promise<NotificationSettings | undefined>;
  updateNotificationSettings(userId: number, settings: Partial<NotificationSettings>): Promise<NotificationSettings>;
}

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async getUsersByRole(role: string, entity?: string): Promise<User[]> {
    if (entity) {
      return await db.select().from(schema.users).where(
        and(eq(schema.users.role, role), eq(schema.users.entity, entity))
      );
    }
    return await db.select().from(schema.users).where(eq(schema.users.role, role));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  // Memos
  async getAllMemos(entity: string): Promise<Memo[]> {
    return await db.select().from(schema.memos)
      .where(eq(schema.memos.entity, entity))
      .orderBy(desc(schema.memos.createdAt));
  }

  async getMemo(id: number): Promise<Memo | undefined> {
    const [memo] = await db.select().from(schema.memos).where(eq(schema.memos.id, id));
    return memo;
  }

  async getMemoByMemoId(memoId: string): Promise<Memo | undefined> {
    const [memo] = await db.select().from(schema.memos).where(eq(schema.memos.memoId, memoId));
    return memo;
  }

  async createMemo(insertMemo: InsertMemo): Promise<Memo> {
    const [memo] = await db.insert(schema.memos).values(insertMemo).returning();
    return memo;
  }

  async updateMemo(id: number, updates: Partial<Memo>): Promise<Memo | undefined> {
    const [memo] = await db.update(schema.memos)
      .set(updates)
      .where(eq(schema.memos.id, id))
      .returning();
    return memo;
  }

  // Issues
  async getAllIssues(entity: string): Promise<Issue[]> {
    return await db.select().from(schema.issues)
      .where(eq(schema.issues.entity, entity))
      .orderBy(desc(schema.issues.createdAt));
  }

  async getIssue(id: number): Promise<Issue | undefined> {
    const [issue] = await db.select().from(schema.issues).where(eq(schema.issues.id, id));
    return issue;
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const [issue] = await db.insert(schema.issues).values(insertIssue).returning();
    return issue;
  }

  async updateIssue(id: number, updates: Partial<Issue>): Promise<Issue | undefined> {
    const [issue] = await db.update(schema.issues)
      .set(updates)
      .where(eq(schema.issues.id, id))
      .returning();
    return issue;
  }

  // Tickets
  async getAllTickets(entity: string): Promise<Ticket[]> {
    return await db.select().from(schema.tickets)
      .where(eq(schema.tickets.entity, entity))
      .orderBy(desc(schema.tickets.createdAt));
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(schema.tickets).where(eq(schema.tickets.id, id));
    return ticket;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(schema.tickets).values(insertTicket).returning();
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const [ticket] = await db.update(schema.tickets)
      .set(updates)
      .where(eq(schema.tickets.id, id))
      .returning();
    return ticket;
  }

  // Audit Logs
  async getAllAuditLogs(entity?: string): Promise<AuditLog[]> {
    if (entity) {
      return await db.select().from(schema.auditLogs)
        .where(eq(schema.auditLogs.entity, entity))
        .orderBy(desc(schema.auditLogs.timestamp));
    }
    return await db.select().from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.timestamp));
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const [auditLog] = await db.insert(schema.auditLogs).values(log).returning();
    return auditLog;
  }

  // Notification Settings
  async getNotificationSettings(userId: number): Promise<NotificationSettings | undefined> {
    const [settings] = await db.select().from(schema.notificationSettings)
      .where(eq(schema.notificationSettings.userId, userId));
    return settings;
  }

  async updateNotificationSettings(userId: number, updates: Partial<NotificationSettings>): Promise<NotificationSettings> {
    // First try to update
    const [existing] = await db.select().from(schema.notificationSettings)
      .where(eq(schema.notificationSettings.userId, userId));
    
    if (existing) {
      const [settings] = await db.update(schema.notificationSettings)
        .set(updates)
        .where(eq(schema.notificationSettings.userId, userId))
        .returning();
      return settings;
    }
    
    // If doesn't exist, create
    const [settings] = await db.insert(schema.notificationSettings)
      .values({ userId, ...updates })
      .returning();
    return settings;
  }
}

export const storage = new PostgresStorage();
