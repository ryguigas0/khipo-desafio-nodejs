import express, { Router, Request, Response, NextFunction } from "express";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import tokenCredentials from "../validation/auth/TokenCredentials";
import tokenView from "../views/tokenView";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import authenticateToken, { TokenRequest } from "../middlewares/authHandler";

import { jwtDuration, jwtSecret } from "../env";
import { validatePassword } from "../services/userService";

const controller: Router = express.Router();
const route = "/auth";

controller.get(
  "/token",
  checkSchema(tokenCredentials),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await validatePassword(email, password);
      const claims = {
        userId: user.id
      };

      const accessToken = jwt.sign(claims, jwtSecret, {
        expiresIn: jwtDuration
      });

      res.status(201).send(tokenView(accessToken, jwtDuration));
    } catch (error) {
      next(error);
    }
  }
);

controller.get("/public", (req: Request, res: Response) => {
  res.send("Public page");
});

controller.get(
  "/protected",
  authenticateToken,
  (req: TokenRequest, res: Response) => {
    console.log(req.claims);
    res.send("private page");
  }
);

export default { controller, route } as Controller;
