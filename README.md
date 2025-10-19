# EquiOps

A comprehensive horse management system built with modern web technologies.

## Quick Start

### Local Development

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd equiops
   ```

2. **API Setup**:
   ```bash
   cd apps/api
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   npm install
   npm run migrate
   npm run generate
   npm run seed
   npm run dev
   ```

3. **Web Setup**:
   ```bash
   cd apps/web
   cp .env.local.example .env.local
   # Edit .env.local with your NEXT_PUBLIC_API_URL
   npm install
   npm run dev
   ```

4. **Access the application**:
   - API: http://localhost:4000
   - API Docs: http://localhost:4000/docs
   - Web App: http://localhost:3000

## API Application (`apps/api`)

The API application provides backend services for horse management, including database operations, business logic, and data validation.

### Features

- **Horse Management**: CRUD operations for horses with medical records
- **Prescription System**: Create and manage medication prescriptions
- **Vitals Tracking**: Record and track horse vitals from multiple sources
- **Vaccination Records**: Manage vaccination schedules and records
- **Administration Tracking**: Track medication administration with detailed records
- **Billing System**: Charge management and invoice generation
- **Import/Export**: CSV import for horses, export for vaccinations and administrations
- **Audit Logging**: Comprehensive audit trail for all data changes
- **Role-Based Access**: Role-based permissions for different user types
- **Rate Limiting**: Built-in rate limiting for API protection

### Prisma Commands

#### Database Migrations

- **Create and apply migration**: `npm run migrate`
- **Deploy migrations to production**: `npm run migrate:deploy`
- **Reset database (development only)**: `npm run migrate:reset`
- **Push schema changes without migration**: `npm run db:push`

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
- Create sample prescriptions for testing

#### Database Setup

1. Copy the environment file: `cp .env.example .env`
2. Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string
3. Run migrations: `npm run migrate`
4. Generate the Prisma client: `npm run generate`
5. (Optional) Seed the database: `npm run seed`

### API Endpoints

#### Health & System
- `GET /healthz` - Health check endpoint

#### Horse Management
- `GET /horses/:horseId/prescriptions` - Get prescriptions for a horse

#### Medical Records
- `POST /vitals` - Create vitals record
- `POST /vaccinations` - Create vaccination record
- `POST /prescriptions` - Create prescription with items
- `POST /administrations` - Record medication administration

#### Billing
- `POST /billing/charges` - Create charge
- `GET /billing/charges` - Get charges with filters
- `POST /billing/invoices` - Create invoice from charges
- `GET /billing/invoices/:id` - Get invoice details
- `GET /billing/invoices/:id/pdf` - Generate invoice PDF
- `PATCH /billing/invoices/:id` - Update invoice status

#### Import/Export
- `POST /import/horses-csv` - Import horses from CSV
- `GET /export/vaccinations.csv` - Export vaccinations to CSV
- `GET /export/administrations.csv` - Export administrations to CSV

### Authentication & Authorization

The API includes role-based access control with the following roles:
- **MANAGER**: Full access to all operations
- **VET**: Access to medical records (prescriptions, administrations, vaccinations)
- **BILLING**: Access to billing operations
- **USER**: Read-only access to most data

*Note: Current implementation uses mock authentication. In production, integrate with proper JWT/session-based authentication.*

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?sslmode=require"

# Server Configuration
PORT=4000

# CORS Configuration
WEB_ORIGIN="http://localhost:3000"

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Authentication (for future implementation)
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN="7d"

# PDF Generation
PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium-browser"
```

## Web Application (`apps/web`)

The web application provides a modern, mobile-first interface for horse management.

### Features

- **Vitals Quick Entry**: Mobile-optimized form for recording horse vitals
- **Dose Tasks**: Task management for medication administration
- **Billing Management**: Charge tracking and invoice creation
- **Real-time Updates**: Live data synchronization with API
- **Mobile-First Design**: Optimized for mobile devices
- **Error Handling**: Comprehensive error handling with fallbacks

### Pages

- `/` - Vitals Quick Entry page
- `/dose-tasks` - Medication administration tasks
- `/billing` - Billing and invoice management

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Authentication (for future implementation)
NEXT_PUBLIC_AUTH_DOMAIN="your-auth-domain.com"
NEXT_PUBLIC_AUTH_CLIENT_ID="your-client-id"
```

## Deployment

### API Deployment (Railway)

1. **Connect Repository**: Connect your GitHub repository to Railway
2. **Set Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `PORT`: 4000
   - `WEB_ORIGIN`: Your web app URL
3. **Deploy**: Railway will automatically build and deploy

### Web Deployment (Vercel)

1. **Connect Repository**: Connect your GitHub repository to Vercel
2. **Set Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your API URL (e.g., `https://your-api.railway.app`)
3. **Deploy**: Vercel will automatically build and deploy

### Database Setup (Production)

1. **Create PostgreSQL Database**: Use Railway, Supabase, or your preferred provider
2. **Run Migrations**: `npm run migrate:deploy`
3. **Seed Data** (optional): `npm run seed`

## Development

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

### Local Development Setup

1. **Database**: Start PostgreSQL locally or use a cloud service
2. **API**: Follow the API setup steps above
3. **Web**: Follow the web setup steps above
4. **Development**: Both services will hot-reload on changes

### Testing

- **API**: Use the Swagger UI at `/docs` for testing endpoints
- **Web**: Navigate through the application to test functionality
- **Integration**: Test the full flow from web to API

## Architecture

### Database Schema

The application uses Prisma with PostgreSQL and includes models for:
- **Horses**: Core horse information and medical alerts
- **Medications**: Drug information with routes and withholding periods
- **Prescriptions**: Veterinary prescriptions with multiple items
- **Administrations**: Medication administration tracking
- **Vaccinations**: Vaccination records and schedules
- **Vitals**: Health monitoring data from multiple sources
- **Movements**: Horse transportation and location tracking
- **Charges & Invoices**: Billing and financial management
- **Audit Logs**: Comprehensive change tracking

### Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable cross-origin resource sharing
- **Role-Based Access**: Granular permissions system
- **Input Validation**: Zod schema validation for all inputs
- **Audit Logging**: Complete audit trail for compliance

### Performance

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connection management
- **Caching**: Built-in caching for frequently accessed data
- **Rate Limiting**: Prevents resource exhaustion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.