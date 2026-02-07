import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "../shared/schema";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create default users
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

    console.log('✅ Users seeded');

    // Create sample memos
    const sampleMemos = [
      {
        memoId: 'MEM-2024-001',
        title: 'Q1 Budget Approval for Marketing Campaign',
        content: 'Requesting approval for the Q1 digital marketing budget allocation of $50,000.',
        initiator: 'Alice Initiator',
        department: 'Marketing',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending HOD',
        currentHandler: 'HOD',
        entity: 'Alpha10 Fund Management',
        workflow: [
          { role: 'HOD', status: 'Pending' },
          { role: 'Administrative Department', status: 'Pending' },
          { role: 'Operations', status: 'Pending' },
          { role: 'EAG', status: 'Pending' },
          { role: 'MD', status: 'Pending' },
        ],
        attachments: [{ originalName: 'budget_v1.pdf', url: '/uploads/budget_v1.pdf' }],
      },
      {
        memoId: 'MEM-2024-002',
        title: 'Procurement of New Laptops',
        content: 'Request to purchase 5 MacBook Pros for the design team.',
        initiator: 'Alice Initiator',
        department: 'Design',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Pending Operations',
        currentHandler: 'Operations',
        entity: 'Alpha10 Fund Management',
        workflow: [
          { role: 'HOD', status: 'Approved', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], comment: 'Approved, within budget.', signature: 'Bob HOD' },
          { role: 'Administrative Department', status: 'Approved', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], comment: 'Reviewed and compliant.', signature: 'Admin Dept' },
          { role: 'Operations', status: 'Pending' },
          { role: 'EAG', status: 'Pending' },
          { role: 'MD', status: 'Pending' },
        ],
        attachments: [{ originalName: 'quote_apple.pdf', url: '/uploads/quote_apple.pdf' }],
      }
    ];

    for (const memo of sampleMemos) {
      await db.insert(schema.memos).values(memo).onConflictDoNothing();
    }

    console.log('✅ Memos seeded');

    // Create sample issue
    await db.insert(schema.issues).values({
      issueId: 'ISS-001',
      title: 'Server Room Overheating',
      description: 'The main server room AC unit is malfunctioning.',
      cost: '$1200',
      cause: 'Compressor failure',
      date: '2024-10-25',
      department: 'IT',
      status: 'In Progress',
      entity: 'Alpha10 Advisory',
      assignedTo: ['IT', 'MD', 'Risk'],
      reviews: [
        { role: 'IT', comment: 'Assessed. Need replacement part.', date: '2024-10-26' }
      ]
    }).onConflictDoNothing();

    console.log('✅ Issues seeded');

    // Create sample ticket
    await db.insert(schema.tickets).values({
      ticketId: 'TKT-101',
      title: 'Email Access Issue',
      priority: 'High',
      description: 'Cannot access Outlook since password reset.',
      status: 'Open',
      assignedTo: 'IT',
      entity: 'Alpha10 Global Market Limited',
      comments: []
    }).onConflictDoNothing();

    console.log('✅ Tickets seeded');

    // Create audit log
    await db.insert(schema.auditLogs).values({
      action: 'System Init',
      user: 'System',
      role: 'System',
      details: 'System initialized with seed data'
    });

    console.log('✅ Audit logs seeded');
    console.log('\n🎉 Database seeding complete!');
    console.log('\n📝 Default credentials:');
    console.log('   Username: alice (or bob, charlie, dana, eve, frank, grace, harry)');
    console.log('   Password: password123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
