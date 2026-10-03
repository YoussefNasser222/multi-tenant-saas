import { INestApplication, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from '@common/filters';
import type { NextFunction, Request, Response } from 'express';

const DEFAULT_ORIGINS = [
  'https://medical-clinic-saas.vercel.app',
  // ── Local development ──────────────────────────────────────────────────────
  // مسموح بيها دايمًا بغض النظر عن NODE_ENV عشان المطور يقدر يختبر
  // الفرونت على localhost حتى لو الباك اند شغال بـ production mode
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
];

// روابط الـ Preview اللي Vercel بيولّدها تلقائيًا لكل فرع/كومِت شكلها مش ثابت
// (مثلًا multi-tenant-saas-git-main-3bdduo-bits-projects.vercel.app أو
// multi-tenant-saas-csbix6iud-3bdduo-bits-projects.vercel.app) فمينفعش نحطهم
// كـ exact match. بنقبل أي رابط تحت نفس الـ Vercel team/project بتاعنا تلقائيًا.
const PREVIEW_ORIGIN_PATTERN =
  /^https:\/\/multi-tenant-saas-[a-z0-9-]+-3bdduo-bits-projects\.vercel\.app$/;

function allowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ORIGINS, ...fromEnv]));
}

function isOriginAllowed(origin: string, allowlist: string[]): boolean {
  return allowlist.includes(origin) || PREVIEW_ORIGIN_PATTERN.test(origin);
}

/** Minimal security headers (no extra dependency needed). */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.removeHeader('X-Powered-By');
  // Auth responses carry tokens → never cache. Everything else revalidates (ETag/304)
  // and is never shared between users by an intermediary cache.
  if (req.path.startsWith('/auth')) {
    res.setHeader('Cache-Control', 'no-store');
  } else if (req.method === 'GET' && !res.getHeader('Cache-Control')) {
    res.setHeader('Cache-Control', 'private, no-cache');
  }
  next();
}

/**
 * Single place that configures the Nest app.
 * IMPORTANT: it is used by BOTH `main.ts` (long-running server) and `api/index.js` (Vercel serverless).
 * Before, the serverless entry skipped the ValidationPipe / exception filter / CORS entirely.
 */
export function configureApp(app: INestApplication) {
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable?.('x-powered-by');
  // Vercel / reverse proxies: needed so the throttler sees the real client IP.
  expressApp.set?.('trust proxy', 1);

  app.use(securityHeaders);

  const allowlist = allowedOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      // requests بدون Origin header (server-to-server، curl، Postman) بنسمحلها
      if (!origin || isOriginAllowed(origin, allowlist)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  return app;
}
