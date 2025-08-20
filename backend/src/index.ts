import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import patientRoutes from './routes/patients';
import callRoutes from './routes/calls';
import voiceRoutes from './routes/voice';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { prisma } from './utils/prisma';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration (supports multiple origins and Vercel previews)
const allowedOriginsRaw = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const hostname = new URL(origin).hostname;
        const isExplicitAllowed = allowedOriginsRaw.includes(origin);
        const isVercelPreview = /vercel\.app$/i.test(hostname);
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        if (isExplicitAllowed || isVercelPreview || isLocalhost) return callback(null, true);
      } catch {
        // fallthrough
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Mount voice webhook BEFORE JSON parser to preserve raw body for signature verification
app.use('/api/voice', express.raw({ type: '*/*' }), voiceRoutes);

// Body parsing middleware (for all other routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
	res.json({ ok: true, env: process.env.NODE_ENV, mockVapi: process.env.MOCK_VAPI === 'true' })
})

// API routes
app.use('/api/patients', patientRoutes);
app.use('/api/calls', callRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
