# Pharmacy AI Voice Calling System

A comprehensive AI-powered voice calling system MVP designed for specialty pharmacies to automate patient communications for delivery confirmations and medication updates.

## 🏗️ Architecture Overview

This project follows a clean, scalable architecture with:

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Node.js/Express with TypeScript and PostgreSQL
- **Database**: PostgreSQL with Prisma ORM
- **Voice Integration**: Ready for Vapi integration
- **Deployment**: Configured for Vercel (frontend) + Railway/Render (backend)

## 📁 Project Structure

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
│   ├── public/              # Static assets
│   └── package.json
├── backend/                  # Node.js/Express backend API
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Data models (Prisma)
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   ├── database/
│   │   ├── migrations/      # Database migrations
│   │   └── seeds/           # Database seed files
│   ├── prisma/              # Prisma schema and config
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Git installed

### 1. Clone and Setup

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

### 2. Database Setup

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

### 3. Environment Configuration

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/pharmacy_calls"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
VAPI_API_KEY=your_vapi_key_here
VAPI_WEBHOOK_SECRET=your_webhook_secret_here
JWT_SECRET=your_jwt_secret_here_change_in_production
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Start Development Servers

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

## 📊 Database Schema

### Core Entities

#### Patients
- `id`: Unique identifier
- `name`: Patient full name
- `phone`: Phone number (unique)
- `address`: Patient address
- `medicationInfo`: JSON field for medication details
- `createdAt`, `updatedAt`: Timestamps

#### Calls
- `id`: Unique identifier
- `patientId`: Reference to patient
- `status`: Call status (PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED)
- `callSid`: Vapi call identifier
- `summary`: Call summary
- `structuredData`: JSON field for call data
- `createdAt`, `completedAt`: Timestamps

#### Call Logs
- `id`: Unique identifier
- `callId`: Reference to call
- `eventType`: Type of event (CALL_STARTED, CALL_ENDED, TRANSCRIPT, etc.)
- `data`: JSON field for event data
- `timestamp`: Event timestamp

#### Pharmacists (Future Use)
- `id`: Unique identifier
- `name`: Pharmacist name
- `email`: Email address
- `pharmacyId`: Pharmacy identifier
- `createdAt`, `updatedAt`: Timestamps

## 🔌 API Endpoints

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

### Voice (Vapi Webhooks)
- `POST /api/voice/webhook` - Handle Vapi webhook events

## 🎨 Frontend Features

### Dashboard
- Real-time statistics (patients, calls, success rate)
- Quick action buttons
- Recent activity feed

### Patient Management
- Patient list with search and pagination
- Add/edit patient forms
- Patient call history

### Call Interface
- Trigger AI calls for patients
- Monitor call status in real-time
- View call transcripts and summaries

### Components
- Responsive design with Tailwind CSS
- Reusable UI components
- Form validation with react-hook-form
- State management with React Query

## 🔧 Development Scripts

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

## 🚀 Deployment

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
- Set secure `JWT_SECRET`
- Configure production `DATABASE_URL`
- Add your Vapi API credentials

## 🔐 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation with Zod
- Environment variable protection
- Webhook signature verification (ready for Vapi)

## 🧪 Testing

```bash
# Backend testing (when implemented)
cd backend
npm test

# Frontend testing (when implemented)
cd frontend
npm test
```

## 📝 API Documentation

### Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": {...},
  "pagination": {...}, // For paginated responses
  "error": "Error message" // For error responses
}
```

### Error Handling
- Consistent HTTP status codes
- Detailed error messages
- Validation error details
- Stack traces in development mode

## 🔮 Future Enhancements

- [ ] User authentication and authorization
- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics and reporting
- [ ] Multi-pharmacy support
- [ ] Mobile app development
- [ ] Integration with pharmacy management systems
- [ ] Advanced AI conversation flows
- [ ] Call recording and playback
- [ ] Automated follow-up scheduling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the API endpoints and examples

## 🏥 Healthcare Compliance

This system is designed with healthcare data privacy in mind:
- Secure data handling practices
- Environment variable protection
- Input validation and sanitization
- Audit logging capabilities

**Note**: Ensure compliance with HIPAA and other relevant healthcare regulations in your deployment.
