# NexusFlow - Enterprise Workflow Automation

## Overview

NexusFlow is an enterprise workflow automation platform designed for internal operations at Alpha10 group companies. The application provides three core workflow modules:

1. **Memo Approvals** - Multi-step approval workflows with role-based routing (HOD → Operations → EAG → MD → Finance)
2. **Issue Tracker** - Internal issue reporting and resolution tracking with department assignments
3. **IT Tickets** - IT support ticket management with priority levels and status tracking

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

**Role-Based Workflow**: Memos follow a configurable approval chain with roles (Initiator, HOD, Operations, EAG, MD, Finance, IT, Risk). Each step captures approver signature and comments.

**Unified Build**: Production build bundles both frontend (Vite) and backend (esbuild) into `dist/` directory for single-process deployment.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with Zod schema validation

### Authentication
- **bcrypt**: Password hashing for user authentication
- **express-session**: Server-side session management

### UI/Charting
- **Recharts**: Data visualization for dashboard analytics
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React**: Icon library

### Development
- **Vite**: Frontend dev server with HMR
- **tsx**: TypeScript execution for Node.js
- **Drizzle Kit**: Database migration tooling