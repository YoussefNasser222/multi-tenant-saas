// api/index.js  (Vercel serverless entry)
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');
const { AppModule } = require('../dist/app.module');
const { configureApp } = require('../dist/app.setup');

const server = express();
let cachedAppPromise;

function bootstrap() {
  if (!cachedAppPromise) {
    cachedAppPromise = (async () => {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
      // Same pipes / filters / CORS / security headers as main.ts
      configureApp(app);
      await app.init();
      return server;
    })().catch((err) => {
      // don't cache a failed bootstrap forever (e.g. transient DB error on cold start)
      cachedAppPromise = undefined;
      throw err;
    });
  }
  return cachedAppPromise;
}

module.exports = async (req, res) => {
  const app = await bootstrap();
  app(req, res);
};
