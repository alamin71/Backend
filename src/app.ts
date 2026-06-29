import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import router from './routes';
import { Morgan } from './shared/morgan';
import globalErrorHandler from './globalErrorHandler/globalErrorHandler';
import { notFound } from './app/middleware/notFound';
import { welcome } from './utils/welcome';
import config from './config';
import path from 'path';
const app: Application = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

//body parser
const allowedOrigins = config.allowed_origins
  ? config.allowed_origins.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'otp-token'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//file retrieve
app.use(express.static('uploads'));
app.use(express.static('public'));

//router
app.use('/api/v1', router);
//live response
app.get('/', (req: Request, res: Response) => {
  res.send(welcome());
});

//global error handle
app.use(globalErrorHandler);

//handle not found route;
app.use(notFound);

export default app;
