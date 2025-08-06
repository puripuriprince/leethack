import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('User Service is running!');
});

app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
}); 