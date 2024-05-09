import express from "express";
import cors from 'cors'

import { Controller } from "./controllers/controllerInterface";

import userController from "./controllers/userController";
import authController from "./controllers/authController";
import projectController from "./controllers/projectController";
import generalErrorHandler from "./middlewares/generalErrorHandler";

import { port } from "./env";
import tasksController from "./controllers/tasksController";
import memberController from "./controllers/memberController";
import tagsController from "./controllers/tagsController";
import responseLogger from "./middlewares/responseLogger";

const app = express();

app.use(express.json());
app.use(cors({
  origin: true
}))

let controllers: Controller[] = [
  userController,
  authController,
  projectController,
  tasksController,
  memberController,
  tagsController
];

for (let i = 0; i < controllers.length; i++) {
  const controller = controllers[i];
  app.use(controller.route, controller.controller);
}

app.use(generalErrorHandler);
app.use(responseLogger);

app.listen(port, () => {
  console.log(`server running at 0.0.0.0:${port}`);
});
