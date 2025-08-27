import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import wineRoutes from './routes/wineRoutes.js';
import { authenticate } from './middlewares/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/wines', authenticate, wineRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});