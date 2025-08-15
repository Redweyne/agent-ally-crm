# Overview

Redweyne is a customer relationship management (CRM) system designed specifically for real estate agents. The application helps agents manage their prospects (both buyers and sellers), track interactions, manage property deals, and monitor sales performance through an intuitive dashboard interface.

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