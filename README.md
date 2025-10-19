# Workspace

This workspace contains the API application with Prisma integration.

## API Application

The API application is located in `apps/api/` and includes:

- Prisma ORM for database management
- PostgreSQL database support
- Comprehensive schema for horse management system

### Prisma Commands

Navigate to the API directory and run the following commands:

```bash
cd apps/api
```

#### Database Migration Commands

- **Create and apply migration**: `npm run migrate`
- **Deploy migrations to production**: `npm run migrate:deploy`
- **Reset database and apply all migrations**: `npm run migrate:reset`
- **Push schema changes to database**: `npm run db:push`

#### Prisma Client Commands

- **Generate Prisma client**: `npm run generate`
- **Open Prisma Studio**: `npm run studio`

#### Database Seeding

- **Seed database with sample data**: `npm run seed`

The seed script will:
- Upsert a horse named "Desert Comet" and log its ID
- Upsert three medications:
  - Flunixin (routes: IV, IM)
  - Omeprazole (routes: PO)
  - Dexamethasone (routes: IV, IM, PO)

#### Database Setup

1. Copy the environment file: `cp .env.example .env`
2. Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string
3. Run migrations: `npm run migrate`
4. Generate the Prisma client: `npm run generate`
5. (Optional) Seed the database: `npm run seed`

### Environment Variables

Create a `.env` file in `apps/api/` based on `.env.example`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?sslmode=require"
```

### Schema Overview

The Prisma schema includes models for:

- **Horse**: Core horse information and identification
- **Medication**: Drug information and specifications
- **Prescription**: Veterinary prescriptions with items
- **PrescriptionItem**: Individual medication items in prescriptions
- **Administration**: Medication administration records
- **Vaccination**: Vaccination records
- **Vitals**: Health monitoring data
- **Movement**: Horse transportation records
- **PretravelCheck**: Pre-travel health checks
- **AuditLog**: System audit trail

### Seed Data

The application includes a seed script (`scripts/seed.ts`) that populates the database with initial data:

- **Horse**: "Desert Comet"
- **Medications**: 
  - Flunixin (IV, IM routes)
  - Omeprazole (PO route)
  - Dexamethasone (IV, IM, PO routes)

Run `npm run seed` to populate your database with this sample data.