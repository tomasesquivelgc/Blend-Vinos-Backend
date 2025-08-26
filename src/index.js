import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import wineRoutes from './routes/wineRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/wines', wineRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});