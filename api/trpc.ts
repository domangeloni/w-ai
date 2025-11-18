import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../server/routers';
import { createContext } from '../server/_core/context';

const app = express();

app.use(
  '/',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;

export const config = {
  api: {
    bodyParser: false,
  },
};
