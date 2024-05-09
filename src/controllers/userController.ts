import express, { Router, Request, Response, NextFunction } from "express";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import { userListView, userView } from "../views/userView";
import newUserSchema from "../validation/user/NewUserSchema";
import updateUserSchema from "../validation/user/UpdateUserSchema";
import deleteUserSchema from "../validation/user/DeleteUserSchema";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser
} from "../services/userService";

const route = "/users";
const controller: Router = express.Router();

controller.post(
  "/",
  checkSchema(newUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const user = await createUser(name, email, password);

      res.status(201).send(userView(user));
      next()
    } catch (error: any) {
      next(error);
    }
  }
);

controller.put(
  "/",
  checkSchema(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.params.userId);

      const { name, email, newEmail, oldPassword, newPassword } = req.body;

      const user = await updateUser(
        email,
        newEmail,
        name,
        oldPassword,
        newPassword
      );

      res.status(200).send(userView(user));
      next()
    } catch (error) {
      next(error);
    }
  }
);

// ---------------------
// ADMIN ONLY ROUTES
// -----------------------

controller.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const users = await listUsers();

  res.status(200).send(userListView(users));
  next()
});

controller.delete(
  "/:userId",
  checkSchema(deleteUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = Number.parseInt(req.params.userId);

      await deleteUser(userId);

      res.status(200).send({ ok: "Deleted user!" });
      next()
    } catch (error) {
      next(error);
    }
  }
);

export default { controller, route } as Controller;
