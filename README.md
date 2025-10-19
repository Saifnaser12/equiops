# EquiOps Monorepo

A modern monorepo built with pnpm workspaces, featuring a Next.js web application, Fastify API server, and shared packages.

## 🏗️ Architecture

```
equiops/
├── apps/
│   ├── web/          # Next.js 14 web application
│   └── api/          # Fastify API server with Prisma & Zod
├── packages/
│   ├── ui/           # Shared UI components
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared configuration files
└── .github/workflows/ # CI/CD workflows
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- PostgreSQL (for API)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd equiops
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Copy example environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

4. Set up the database:
```bash
# Generate Prisma client
pnpm --filter @equiops/api db:generate

# Run database migrations (development)
pnpm db:migrate

# Or deploy migrations (production)
pnpm --filter @equiops/api db:migrate:deploy

# Reset database (development only)
pnpm --filter @equiops/api db:migrate:reset
```

## 🛠️ Development

### Running the applications

**Start all applications:**
```bash
pnpm dev
```

**Start individual applications:**
```bash
# Web application (Next.js)
pnpm --filter web dev

# API server (Fastify)
pnpm --filter @equiops/api dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all applications in development mode |
| `pnpm build` | Build all packages and applications |
| `pnpm lint` | Run ESLint on all packages |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm format` | Format code with Prettier |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |

## 📦 Packages

### Apps

- **`web`** - Next.js 14 application with TypeScript, Tailwind CSS, and App Router
- **`@equiops/api`** - Fastify API server with Prisma ORM, Zod validation, and Swagger documentation

### Packages

- **`@equiops/ui`** - Shared React UI components
- **`@equiops/types`** - Shared TypeScript types and Zod schemas
- **`@equiops/config`** - Shared configuration for TypeScript, ESLint, and Prettier

## 🔧 Configuration

### TypeScript

Each package extends from `@equiops/config/tsconfig` with appropriate configurations:
- `base.json` - Base TypeScript configuration
- `node.json` - Node.js applications
- `react.json` - React applications
- `nextjs.json` - Next.js applications

### ESLint

Shared ESLint configurations in `@equiops/config/eslint`:
- `base.js` - Base configuration with TypeScript support
- `node.js` - Node.js specific rules
- `nextjs.js` - Next.js and React specific rules

### Prettier

Code formatting is configured via `.prettierrc` and `.prettierignore` at the root level.

## 🗄️ Database

The API uses Prisma with PostgreSQL and includes a comprehensive schema for equine management:

- **Horses** - Core horse records with identification and medical alerts
- **Medications** - Drug catalog with generic/brand names and withholding periods
- **Prescriptions** - Veterinary prescriptions with detailed dosing instructions
- **Administrations** - Medication administration tracking with batch/lot numbers
- **Vaccinations** - Vaccination records with product and batch tracking
- **Vitals** - Health monitoring data from manual or device sources
- **Movements** - Horse transportation and location tracking
- **Pretravel Checks** - Pre-transport health and documentation verification
- **Audit Log** - Complete change tracking for all entities

Database operations are available through:

```bash
# Generate Prisma client
pnpm --filter @equiops/api db:generate

# Create and apply migrations (development)
pnpm db:migrate

# Deploy migrations (production)
pnpm --filter @equiops/api db:migrate:deploy

# Open Prisma Studio
pnpm db:studio

# Reset database (development only)
pnpm --filter @equiops/api db:migrate:reset

# Push schema changes without migrations (development)
pnpm --filter @equiops/api db:push
```

## 📚 API Documentation

When the API server is running, visit:
- **Swagger UI**: http://localhost:3001/docs
- **Health Check**: http://localhost:3001/health

## 🧪 Testing

The project includes GitHub Actions CI that runs on every push and pull request:

- TypeScript type checking
- ESLint linting
- Build verification

## 🏃‍♂️ Running in Production

1. Build all packages:
```bash
pnpm build
```

2. Start the API server:
```bash
pnpm --filter @equiops/api start
```

3. Start the web application:
```bash
pnpm --filter web start
```

## 📁 Project Structure

```
apps/
├── web/
│   ├── src/app/          # Next.js App Router pages
│   ├── src/components/   # React components
│   ├── public/           # Static assets
│   └── package.json
└── api/
    ├── src/
    │   ├── routes/       # API route handlers
    │   └── index.ts      # Fastify server setup
    ├── prisma/           # Database schema and migrations
    └── package.json

packages/
├── ui/
│   ├── src/              # React components
│   └── package.json
├── types/
│   ├── src/              # TypeScript types and schemas
│   └── package.json
└── config/
    ├── tsconfig/         # TypeScript configurations
    ├── eslint/           # ESLint configurations
    └── package.json
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting: `pnpm lint && pnpm typecheck`
4. Commit your changes
5. Push to your branch and create a pull request

## 📄 License

This project is licensed under the MIT License.