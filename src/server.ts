import express, { Request, Response } from 'express';

import { Controller } from './controllers/controllerInterface';

import userController from "./controllers/userController"
import authController from "./controllers/authController"
import projectController from './controllers/projectController';
import generalErrorHandler from './middlewares/generalErrorHandler';

import { port } from './env';
import tasksController from './controllers/tasksController';
import memberController from './controllers/memberController';



const app = express();

app.use(express.json())

let controllers: Controller[] = [
  userController,
  authController,
  projectController,
  tasksController,
  memberController
]

for (let i = 0; i < controllers.length; i++) {
  const controller = controllers[i];
  app.use(controller.route, controller.controller)
}

app.use(generalErrorHandler)

app.listen(port, () => {
  console.log(`[server]: server running at 0.0.0.0:${port}`);
});
