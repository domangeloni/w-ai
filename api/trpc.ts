import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import { appRouter } from '../server/routers';
import { createContext } from '../server/_core/context';

const app = express();

app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
export const handler = app;
