# NexusFlow - Enterprise Workflow Automation

## Overview

NexusFlow is an enterprise workflow automation platform designed for internal operations at Alpha10 group companies. The application provides four core workflow modules:

1. **Memo Approvals** - Multi-step approval workflows with role-based routing (Initiator → HOD → EAG → Finance → MD → Operations)
2. **Procurement** - Uses the same memo workflow (Initiator → HOD → EAG → Finance → MD → Operations)
3. **Issue Tracker** - Sequential approval workflow (Initiator → Risk → MD) with approve/reject at each step
4. **IT Tickets** - IT support ticket management (Initiator → IT) with priority levels and status tracking
5. **Risk Reports** - Sequential approval workflow (Initiator → Risk → MD) with approve/reject at each step

The platform supports three distinct business entities (Alpha10 Fund Management, Alpha10 Advisory, Alpha10 Global Market Limited) with entity-scoped data isolation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: Zustand for global client state
- **Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **Session Management**: express-session with in-memory storage
- **Authentication**: Session-based auth with bcrypt password hashing
- **API Structure**: RESTful endpoints under `/api` prefix

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (requires DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Drizzle Kit for schema migrations (`npm run db:push`)

### Key Design Decisions

**Monorepo Structure**: Single repository with clear separation:
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared types and database schema

**Entity-Scoped Multi-tenancy**: Data is filtered by selected business entity at the application level rather than database level. Users select an entity at login which scopes all subsequent queries.

**Role-Based Workflow**: Each module has its own approval chain:
- Memos/Procurement: Initiator → HOD → EAG → Finance → MD → Operations
- Issue Tracker: Initiator → Risk → MD
- Risk Reports: Initiator → Risk → MD
- IT Tickets: Initiator → IT
Each step captures approver signature/comments. IT role has read access to all modules.

**IT Backend Visibility**: IT users can view all data across memos, procurement, issues, risk reports, and IT tickets for administrative oversight.

**Unified Build**: Production build bundles both frontend (Vite) and backend (esbuild) into `dist/` directory for single-process deployment.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with Zod schema validation

### Authentication
- **bcrypt**: Password hashing for user authentication
- **express-session**: Server-side session management

### Notifications
- **Resend**: Email notifications via Replit connector integration (server/notifications.ts)
- **Browser Notifications**: Desktop push notifications using browser Notification API (client/src/lib/notifications.ts)
- **SMS (Twilio)**: SMS notifications via Replit connector integration (server/notifications.ts) - sends to approvers with phone numbers

### UI/Charting
- **Recharts**: Data visualization for dashboard analytics
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React**: Icon library

### Development
- **Vite**: Frontend dev server with HMR
- **tsx**: TypeScript execution for Node.js
- **Drizzle Kit**: Database migration tooling