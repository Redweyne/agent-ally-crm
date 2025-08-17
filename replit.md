# Overview

Redweyne is a customer relationship management (CRM) system designed specifically for real estate agents. The application helps agents manage their prospects (both buyers and sellers), track interactions, manage property deals, and monitor sales performance through an intuitive dashboard interface.

## Recent Enhancements (August 2025)

The CRM has been significantly enhanced with business-focused features to maximize agent productivity and revenue tracking:

### Latest Updates (August 17, 2025)
- **Navigation Restructure**: Optimized mobile navigation for agent workflow efficiency
  - **Bottom Navigation**: Replaced "Liste" with "Carte" (placeholder for future map view)
  - **Top Navigation**: "Prospects" tab now displays comprehensive prospect list with mobile cards
  - **Unified Prospect Management**: Consolidated prospect viewing into single, feature-rich tab
  - **Fixed Date Validation**: Resolved prospect editing errors with proper date string handling
- **Advanced Mobile Enhancements**: Implemented cutting-edge mobile UX for professional field agents
  - **Swipe-to-Action Cards**: Swipe left on prospect cards to reveal call/SMS/RDV buttons with haptic feedback
  - **Pull-to-Refresh**: Native mobile gesture to refresh prospect lists with visual feedback
  - **Voice Notes Integration**: Speech-to-text for hands-free note taking during calls (French language support)
  - **Template Messages**: Pre-written SMS/WhatsApp templates with automatic personalization
  - **Quick Actions FAB**: Floating action button for rapid prospect creation and common tasks
  - **Enhanced Touch Targets**: All interactive elements meet 44px minimum with haptic feedback on actions
  - **Conditional Navigation**: Top tabs (Tableau, Prospect, Pipeline, Opps) only visible when in "Accueil" view
- **Complete Mobile-First Optimization**: Comprehensive mobile UX for one-handed smartphone use
  - Mobile prospect cards with swipe gestures replacing traditional tables
  - Mobile filter drawer consolidating all search/filter controls
  - Pipeline board with vertical stacking and enhanced touch targets
  - Enhanced mobile CSS with proper touch targets, form inputs, and safe area support
  - Responsive breakpoints: mobile cards (<sm), desktop table (≥sm)
- **Migration Completion**: Successfully migrated multi-role CRM from Replit Agent to standard Replit environment
  - PostgreSQL database provisioned and schema deployed with Drizzle migrations
  - Demo data initialized with 3 users, 25 prospects, and 12 leads
  - All Node.js dependencies (592 packages) installed and resolved
  - Express server running on port 5000 with authentication and automation systems operational
  - Login credentials: admin/demo123, alice.martin/demo123, ben.leroy/demo123

### Core Business Features
- **Demo Data & Authentication**: Fixed demo accounts (admin/demo123, agent1/demo123, agent2/demo123) with realistic prospect data
- **Business Value Features**: Mandate Pending status, exact source tracking, ROI calculator, Hot Lead auto-detection
- **Advanced Filtering**: Budget range filters, "Call Today" view, sorting by value/score/date
- **Contact Management**: Timeline tracking, WhatsApp integration, pre-filled messages, PDF export capabilities

### Professional UI & UX
- **Dark Mode Support**: Professional light/dark theme toggle with full CSS variable system
- **Smart Notifications**: Real-time notifications panel for calls due, hot leads, and follow-ups
- **Mobile Components**: Express mode for mobile prospect management
- **Agency Branding**: Customizable colors, logos, and fonts for white-label deployment
- **Enhanced Dashboards**: Improved KPI cards, charts, and prospect pipeline visualization

### Technical Improvements
- **Database Enhancements**: Added lead scoring, contact timeline, ROI tracking fields
- **Demo Data System**: Automatic initialization of realistic demo data on startup
- **Component Architecture**: Modular CRM components for easy customization
- **Performance**: Optimized filtering, sorting, and real-time updates

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built with React and TypeScript, utilizing modern React patterns and hooks. The UI is built with shadcn/ui components, providing a consistent and professional design system. The application uses Wouter for client-side routing and TanStack Query for server state management and caching. The frontend follows a component-based architecture with reusable UI components and business logic separated into custom hooks.

## Backend Architecture
The server is built with Express.js and follows a RESTful API design pattern. The application uses a three-tier architecture:
- **Routes Layer**: Handles HTTP requests and responses
- **Storage Layer**: Abstracts database operations through a storage interface
- **Database Layer**: PostgreSQL with Drizzle ORM for type-safe database operations

Authentication is implemented using Passport.js with local strategy and session-based authentication. Password hashing is handled using Node.js crypto module with scrypt.

## Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM providing type-safe database operations and migrations. The database schema includes:
- **Users table**: Stores agent information with role-based access
- **Prospects table**: Contains comprehensive prospect data including contact information, property details, budget, and interaction history
- **Session store**: PostgreSQL-backed session storage for authentication

## Authentication and Authorization
Session-based authentication is implemented with:
- Local username/password strategy via Passport.js
- Secure password hashing using scrypt with random salt
- Role-based access control (admin/agent roles)
- Session persistence in PostgreSQL
- CSRF protection through session management

## Build and Deployment
The application uses Vite for frontend bundling and development, with esbuild for server-side bundling. The project supports both development and production environments with appropriate optimizations and error handling.

# External Dependencies

## Database Services
- **PostgreSQL**: Primary database for storing all application data
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

## Authentication
- **Passport.js**: Authentication middleware with local strategy
- **Express Session**: Session management with PostgreSQL store
- **Connect PG Simple**: PostgreSQL session store adapter

## UI Framework
- **shadcn/ui**: Complete UI component library built on Radix UI
- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography

## State Management
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema validation

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds