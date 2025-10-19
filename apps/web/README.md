# EquiOps Web Application

A mobile-first web application for horse management, built with Next.js and Tailwind CSS.

## Features

### Vitals Quick Entry
- Mobile-first responsive design
- Quick entry form for horse vitals
- Real-time validation and error handling
- Toast notifications for user feedback
- Integration with EquiOps API

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- EquiOps API running (see `apps/api/`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## API Integration

The web application integrates with the EquiOps API for:
- Vitals recording (`POST /vitals`)
- Future endpoints for vaccinations, administrations, etc.

Make sure the API server is running before using the web application.

## Mobile-First Design

The application is designed with mobile-first principles:
- Touch-friendly interface
- Responsive layout that works on all screen sizes
- Optimized for quick data entry on mobile devices
- Clean, minimal design focused on usability

## Technology Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Hot Toast** - Toast notifications
- **App Router** - Next.js 13+ routing system