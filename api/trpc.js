const express = require('express');
const { createExpressMiddleware } = require('@trpc/server/adapters/express');
const { appRouter } = require('../dist/server/routers.js');
const { createContext } = require('../dist/server/_core/context.js');

const app = express();

app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

module.exports = app;
module.exports.handler = app;
