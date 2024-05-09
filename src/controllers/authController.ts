import express, { Router, Request, Response, NextFunction } from "express";
import { Controller } from "./controllerInterface";
import { checkSchema, validationResult } from "express-validator";
import tokenCredentialsSchema from "../validation/auth/tokenCredentialsSchema";
import tokenView from "../views/tokenView";
import jwt from "jsonwebtoken";
// import authenticateToken, { TokenRequest } from "../middlewares/authHandler";

import { jwtDuration, jwtSecret } from "../env";
import { validatePassword } from "../services/userService";

const controller: Router = express.Router();
const route = "/auth";

controller.post(
  "/token",
  checkSchema(tokenCredentialsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await validatePassword(email, password);
      const claims = {
        userId: user.id,
        userName: user.name
      };

      const accessToken = jwt.sign(claims, jwtSecret, {
        expiresIn: jwtDuration
      });

      res.status(201).send(tokenView(accessToken, jwtDuration));
      next()
    } catch (error) {
      next(error);
    }
  }
);

// controller.get("/public", (req: Request, res: Response) => {
//   res.send("Public page");
// });

// controller.get(
//   "/protected",
//   authenticateToken,
//   (req: TokenRequest, res: Response) => {
//     console.log(req.claims);
//     res.send("private page");
//   }
// );

export default { controller, route } as Controller;
