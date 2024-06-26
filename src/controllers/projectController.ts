import express, { Router, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";
import { projectListView, projectView } from "../views/projectView";
import listProjectsSchema from "../validation/projects/listProjectsSchema";
import newProjectSchema from "../validation/projects/newProjectSchema";
import deleteProjectSchema from "../validation/projects/deleteProjectSchema";
import updateProjectSchema from "../validation/projects/updateProjectSchema";
import getProjectSchema from "../validation/projects/getProjectSchema";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from "../services/projectService";

const controller: Router = express.Router();
const route = "/projects";

controller.use(authenticateToken);

controller.post(
  "/",
  checkSchema(newProjectSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId: userOwnerId } = req.claims;
    const { name, description } = req.body;

    try {
      const projModel = await createProject(userOwnerId, name, description);

      res.status(200).json(projectView(projModel));
      next();
    } catch (error) {
      next(error);
    }
  }
);

controller.put(
  "/:projectId",
  checkSchema(updateProjectSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userOwnerId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      const { name, description } = req.body;

      const updatedProject = await updateProject(
        userOwnerId,
        projectId,
        name,
        description
      );

      res.status(200).send(projectView(updatedProject));
      next();
    } catch (error) {
      next(error);
    }
  }
);

controller.delete(
  "/:projectId",
  checkSchema(deleteProjectSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userOwnerId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      await deleteProject(userOwnerId, projectId);

      res.status(200).send({ ok: "Deleted project!" });
      next();
    } catch (error) {
      next(error);
    }
  }
);

controller.get(
  "/:projectId",
  checkSchema(getProjectSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      const project = await getProject(projectId, userId);

      res.status(200).send(projectView(project));
      next();
    } catch (error) {
      next(error);
    }
  }
);

controller.get(
  "/",
  checkSchema(listProjectsSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = Number.parseInt(req.claims.userId);
    const { name } = req.query;

    const projects = await listProjects(userId, name as string);

    res.status(200).json(projectListView(projects));
    next();
  }
);

export default { controller, route } as Controller;
