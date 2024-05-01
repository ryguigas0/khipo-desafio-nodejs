import express, { Request, Response } from 'express';

import { Controller } from './controllers/controllerInterface';

import userController from "./controllers/userController"
// import authController from "./controllers/authController"
import errorHandler from './errorHandler';



const app = express();
const port = process.env.PORT || '8080';

app.use(express.json())

let controllers: Controller[] = [
  userController,
  // authController
]

for (let i = 0; i < controllers.length; i++) {
  const controller = controllers[i];
  app.use(controller.route, controller.controller)
}

app.use(errorHandler)

app.listen(port, () => {
  console.log(`[server]: server running at 0.0.0.0:${port}`);
});
