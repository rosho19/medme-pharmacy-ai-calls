# Pharmacy AI Voice Calling System

A comprehensive AI-powered voice calling system designed for specialty pharmacies to automate patient communications for delivery confirmations and medication updates.

## Architecture

This project uses a modern full-stack architecture:

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Node.js/Express with TypeScript and PostgreSQL
- **Database**: PostgreSQL with Prisma ORM
- **Voice Integration**: Vapi integration for AI voice calls
- **Deployment**: Configured for Vercel (frontend) + Railway/Render (backend)

## Project Structure

```
pharmacy-ai-calls/
├── frontend/                 # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/             # Next.js 14 app directory
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── forms/       # Form components
│   │   │   ├── layout/      # Layout components
│   │   │   └── providers/   # Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript type definitions
│   └── package.json
├── backend/                  # Node.js/Express backend API
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   ├── database/
│   │   └── seeds/           # Database seed files
│   ├── prisma/              # Prisma schema and migrations
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or Neon DB)
- Git installed

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd pharmacy-ai-calls

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Database Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment file and configure
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/pharmacy_calls"

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed
```

### Environment Configuration

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/pharmacy_calls"
SHADOW_DATABASE_URL="postgresql://username:password@localhost:5432/pharmacy_calls_shadow"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
VAPI_API_KEY=your_vapi_key_here
VAPI_ASSISTANT_ID=your_vapi_assistant_id
VAPI_WEBHOOK_SECRET=your_webhook_secret_here
VAPI_WEBHOOK_URL=http://localhost:3001/api/voice/webhook
```

#### Frontend (.env.example)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Development

```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend server
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health

## Database Schema

### Core Entities

#### Patients
- `id`: Unique identifier
- `name`: Patient full name
- `phone`: Phone number (unique)
- `address`: Patient address
- `medicationInfo`: JSON field for medication details
- `callPreferences`: JSON field for calling preferences
- `createdAt`, `updatedAt`: Timestamps

#### Calls
- `id`: Unique identifier
- `patientId`: Reference to patient
- `status`: Call status (PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED)
- `callSid`: Vapi call identifier
- `summary`: Call summary
- `structuredData`: JSON field for call data
- `scheduledCallId`: Reference to scheduled call (optional)
- `createdAt`, `completedAt`: Timestamps

#### Call Logs
- `id`: Unique identifier
- `callId`: Reference to call
- `eventType`: Type of event (CALL_STARTED, CALL_ENDED, TRANSCRIPT, etc.)
- `data`: JSON field for event data
- `timestamp`: Event timestamp

#### Scheduled Calls
- `id`: Unique identifier
- `patientId`: Reference to patient
- `startAt`: When to start calling
- `retryIntervalMinutes`: Minutes between retry attempts
- `maxAttempts`: Maximum number of attempts
- `attemptsMade`: Current number of attempts
- `nextAttemptAt`: When to make the next attempt
- `status`: Schedule status (SCHEDULED, RUNNING, COMPLETED, FAILED, CANCELLED)
- `voicemailTemplate`: Custom voicemail template
- `createdAt`, `updatedAt`: Timestamps

#### Call Attempts
- `id`: Unique identifier
- `scheduledCallId`: Reference to scheduled call
- `attemptNumber`: Which attempt this is
- `callId`: Reference to actual call (optional)
- `startedAt`: When attempt started
- `endedAt`: When attempt ended
- `outcome`: Attempt outcome (IN_PROGRESS, ANSWERED, NO_ANSWER, BUSY, VOICEMAIL_LEFT, FAILED, CANCELLED)
- `notes`: Additional notes

#### Pharmacists
- `id`: Unique identifier
- `name`: Pharmacist name
- `email`: Email address
- `pharmacyId`: Pharmacy identifier
- `createdAt`, `updatedAt`: Timestamps

## API Endpoints

### Patients
- `GET /api/patients` - List patients with pagination and search
- `GET /api/patients/:id` - Get single patient with call history
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Calls
- `GET /api/calls` - List calls with filtering
- `GET /api/calls/:id` - Get single call with logs
- `POST /api/calls` - Trigger new AI call
- `PATCH /api/calls/:id/status` - Update call status
- `DELETE /api/calls/:id` - Delete call

### Scheduled Calls
- `GET /api/schedules` - List scheduled calls
- `GET /api/schedules/:id` - Get single scheduled call
- `POST /api/schedules` - Create new scheduled call
- `POST /api/schedules/:id/cancel` - Cancel scheduled call

### Voice (Vapi Webhooks)
- `POST /api/voice/webhook` - Handle Vapi webhook events

## Frontend Features

### Dashboard
- Real-time statistics (patients, calls, success rate)
- Quick action buttons
- Recent activity feed

### Patient Management
- Patient list with search and pagination
- Add/edit patient forms
- Patient call history

### Call Management
- Trigger AI calls for patients
- Monitor call status in real-time
- View call transcripts and summaries

### Scheduled Calls
- Create scheduled call campaigns
- Monitor retry attempts
- Track call outcomes

### Components
- Responsive design with Tailwind CSS
- Reusable UI components
- Form validation with react-hook-form
- State management with React Query

## Development Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway/Render)
1. Connect your GitHub repository
2. Set environment variables
3. Configure PostgreSQL database
4. Deploy automatically on push to main branch

### Environment Variables for Production
- Update `FRONTEND_URL` to your production frontend URL
- Configure production `DATABASE_URL`
- Add your Vapi API credentials

## Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "data": {...},
  "pagination": {...}, // For paginated responses
  "error": "Error message" // For error responses
}
```

## License

This project is licensed under the MIT License.