import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || '8080';

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome home!');
});

app.listen(port, () => {
  console.log(`[server]: server running at 0.0.0.0:${port}`);
});
