import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import wineRoutes from './routes/wineRoutes.js';
import usersRoutes from './routes/userRoutes.js';
import movementRoutes from './routes/movementRoutes.js';
import { authenticate } from './middlewares/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/wines', authenticate, wineRoutes);
app.use('/api/users', authenticate, usersRoutes);
app.use('/api/movements', authenticate, movementRoutes);

export default app;