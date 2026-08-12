import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { ENV } from './config/env';

const app = express();

// Configure CORS
const allowedOrigins = ENV.FRONTEND_URL.split(',').map((url) => url.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl/Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || ENV.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Logging
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health & API mount
app.use('/api', routes);

// Centralized 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
