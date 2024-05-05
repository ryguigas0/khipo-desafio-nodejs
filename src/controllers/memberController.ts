import express, { Router, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import { ResponseException } from "../errors/ResponseException";
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";
import memberSchema from "../validation/members/memberSchema";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { userListView, userView } from "../views/userView";
import {
  addMember,
  listMembers,
  removeMember
} from "../services/memberService";
import { isOwner, isOwnerOrMember } from "../services/projectService";

const controller: Router = express.Router();
const route = "/projects";

controller.use(authenticateToken);

controller.post(
  "/:projectId/members/",
  checkSchema(memberSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      if (!(await isOwner(projectId, userId)))
        throw new ResponseException(
          "Only project owners can remove members!",
          404
        );

      const memberEmail = req.body.memberEmail;

      const user = await addMember(memberEmail, projectId);

      res.status(200).json(userView(user));
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return next(
          new ResponseException("Member is already registered!", 400)
        );
      }
      next(error);
    }
  }
);

controller.delete(
  "/:projectId/members/",
  checkSchema(memberSchema),
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      if (!(await isOwner(projectId, userId)))
        throw new ResponseException(
          "Only project owners can remove members!",
          404
        );

      const memberEmail = req.body.memberEmail;

      await removeMember(memberEmail, projectId);

      res.status(200).json({ ok: "Removed member!" });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return next(new ResponseException("Member not found!", 404));
      }
      next(error);
    }
  }
);

controller.get(
  "/:projectId/members/",
  async (req: TokenRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.claims.userId);

      const projectId = Number.parseInt(req.params.projectId);

      if (!(await isOwnerOrMember(projectId, userId)))
        throw new ResponseException(
          "Only owners or members can see member list!",
          403
        );

      const members = await listMembers(projectId);

      res.status(200).json(userListView(members));
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return next(new ResponseException("Member not found!", 404));
      }
      next(error);
    }
  }
);

export default { controller, route } as Controller;
