import { db } from "./storage";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";

export async function initializeDatabase() {
  console.log("Checking database tables...");

  // Fix audit_logs column name mismatch (created_at -> timestamp)
  try {
    await db.execute(sql`ALTER TABLE audit_logs RENAME COLUMN created_at TO "timestamp"`);
    console.log("Migrated audit_logs: renamed created_at to timestamp");
  } catch (e: any) {
    // Column already renamed or table doesn't exist yet - either is fine
  }

  // Fix audit_logs details column nullability
  try {
    await db.execute(sql`ALTER TABLE audit_logs ALTER COLUMN details SET NOT NULL`);
  } catch (e: any) {}

  // Add createdBy and department columns to tickets
  try {
    await db.execute(sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_by TEXT`);
    await db.execute(sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS department TEXT`);
  } catch (e: any) {}

  // Add createdBy column to issues
  try {
    await db.execute(sql`ALTER TABLE issues ADD COLUMN IF NOT EXISTS created_by TEXT`);
  } catch (e: any) {}

  // Add treated columns to memos table
  try {
    await db.execute(sql`ALTER TABLE memos ADD COLUMN IF NOT EXISTS treated_by TEXT`);
    await db.execute(sql`ALTER TABLE memos ADD COLUMN IF NOT EXISTS treated_date TEXT`);
    await db.execute(sql`ALTER TABLE memos ADD COLUMN IF NOT EXISTS treated_comment TEXT`);
  } catch (e: any) {}

  // Create risk_reports table if it doesn't exist (added after initial deployment)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS risk_reports (
        id SERIAL PRIMARY KEY,
        report_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        risk_category TEXT NOT NULL,
        likelihood TEXT NOT NULL,
        impact TEXT NOT NULL,
        mitigation_plan TEXT NOT NULL,
        date TEXT NOT NULL,
        department TEXT NOT NULL,
        created_by TEXT,
        status TEXT NOT NULL,
        entity TEXT NOT NULL,
        risk_assigned_to JSON NOT NULL,
        risk_reviews JSON NOT NULL,
        risk_attachments JSON NOT NULL DEFAULT '[]'::json,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS risk_reports_entity_idx ON risk_reports (entity)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS risk_reports_status_idx ON risk_reports (status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS risk_reports_entity_status_idx ON risk_reports (entity, status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS risk_reports_created_at_idx ON risk_reports (created_at)`);
  } catch (e: any) {}

  try {
    await db.select().from(schema.users).limit(1);
    console.log("Database tables exist.");
    return;
  } catch (err: any) {
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('undefined table') || msg.includes('no such table')) {
      console.log("Tables not found. Creating tables...");
    } else {
      console.error("Unexpected DB error, attempting table creation anyway:", err.message);
    }
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      entity TEXT,
      avatar TEXT,
      email TEXT,
      phone TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS memos (
      id SERIAL PRIMARY KEY,
      memo_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      initiator TEXT NOT NULL,
      department TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      current_handler TEXT NOT NULL,
      entity TEXT NOT NULL,
      workflow JSON NOT NULL,
      attachments JSON NOT NULL DEFAULT '[]'::json,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      issue_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      cost TEXT NOT NULL,
      cause TEXT NOT NULL,
      date TEXT NOT NULL,
      department TEXT NOT NULL,
      created_by TEXT,
      status TEXT NOT NULL,
      entity TEXT NOT NULL,
      assigned_to JSON NOT NULL,
      reviews JSON NOT NULL,
      issue_attachments JSON NOT NULL DEFAULT '[]'::json,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      ticket_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      priority TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_to TEXT NOT NULL,
      created_by TEXT,
      department TEXT,
      entity TEXT NOT NULL,
      comments JSON NOT NULL,
      ticket_attachments JSON NOT NULL DEFAULT '[]'::json,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS risk_reports (
      id SERIAL PRIMARY KEY,
      report_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      risk_category TEXT NOT NULL,
      likelihood TEXT NOT NULL,
      impact TEXT NOT NULL,
      mitigation_plan TEXT NOT NULL,
      date TEXT NOT NULL,
      department TEXT NOT NULL,
      created_by TEXT,
      status TEXT NOT NULL,
      entity TEXT NOT NULL,
      risk_assigned_to JSON NOT NULL,
      risk_reviews JSON NOT NULL,
      risk_attachments JSON NOT NULL DEFAULT '[]'::json,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      "user" TEXT NOT NULL,
      role TEXT NOT NULL,
      entity TEXT,
      details TEXT NOT NULL,
      "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      email_enabled BOOLEAN DEFAULT TRUE NOT NULL,
      sms_enabled BOOLEAN DEFAULT FALSE NOT NULL,
      browser_enabled BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS memos_entity_idx ON memos (entity)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS memos_status_idx ON memos (status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS issues_entity_idx ON issues (entity)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS issues_status_idx ON issues (status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS tickets_entity_idx ON tickets (entity)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets (status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS tickets_priority_idx ON tickets (priority)`);

  console.log("Tables created. Seeding default users...");

  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    { username: 'alice', password: hashedPassword, name: 'Alice Initiator', role: 'Initiator', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', email: 'alice@alpha10.com', phone: '+1 (555) 001-0001' },
    { username: 'bob', password: hashedPassword, name: 'Bob HOD', role: 'HOD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', email: 'bob@alpha10.com', phone: '+1 (555) 001-0002' },
    { username: 'admin_dept', password: hashedPassword, name: 'Admin Department', role: 'Administrative Department', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminDept', email: 'admin.dept@alpha10.com', phone: '+1 (555) 001-0009' },
    { username: 'charlie', password: hashedPassword, name: 'Charlie Ops', role: 'Operations', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', email: 'charlie@alpha10.com', phone: '+1 (555) 001-0003' },
    { username: 'dana', password: hashedPassword, name: 'Dana EAG', role: 'EAG', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dana', email: 'dana@alpha10.com', phone: '+1 (555) 001-0004' },
    { username: 'eve', password: hashedPassword, name: 'Eve MD', role: 'MD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve', email: 'eve@alpha10.com', phone: '+1 (555) 001-0005' },
    { username: 'frank', password: hashedPassword, name: 'Frank Finance', role: 'Finance', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank', email: 'frank@alpha10.com', phone: '+1 (555) 001-0006' },
    { username: 'grace', password: hashedPassword, name: 'Grace IT', role: 'IT', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace', email: 'grace@alpha10.com', phone: '+1 (555) 001-0007' },
    { username: 'harry', password: hashedPassword, name: 'Harry Risk', role: 'Risk', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harry', email: 'harry@alpha10.com', phone: '+1 (555) 001-0008' },
  ];

  for (const user of users) {
    await db.insert(schema.users).values(user).onConflictDoNothing();
  }

  await db.insert(schema.auditLogs).values({
    action: 'System Init',
    user: 'System',
    role: 'System',
    details: 'System initialized with seed data'
  });

  console.log("Database initialized and seeded successfully!");
}
