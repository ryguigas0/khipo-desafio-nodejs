import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { jwtSecret } from "../env";
import { ResponseException } from "../errors/ResponseException";

export interface TokenRequest extends Request {
  claims?: any;
}

export default function authenticateToken(
  req: TokenRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];

  if (authHeader === undefined)
    throw new ResponseException("Missing JWT token", 401);

  const token = authHeader.split(" ")[1];

  if (token === null) throw new ResponseException("Missing JWT token", 401);

  jwt.verify(token, jwtSecret, function (err, claims) {
    if (err) throw new ResponseException("Invalid token", 401);

    req.claims = claims as JwtPayload;
  });

  next();
}
