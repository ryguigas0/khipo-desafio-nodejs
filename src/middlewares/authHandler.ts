import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { jwtSecret } from "../env";

export interface TokenRequest extends Request {
  claims?: any;
}

export default function authenticateToken(
  req: TokenRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];

  if (authHeader === undefined) return tokenError(res, "Missing JWT Token");

  const token = authHeader.split(" ")[1];

  if (token === null) return tokenError(res, "Missing JWT Token");

  jwt.verify(token, jwtSecret, function (err, claims) {
    if (err) return tokenError(res, "Invalid Token");

    req.claims = claims as JwtPayload;
    next();
  });
}

function tokenError(res: Response, message: string) {
  res.status(401).json({
    error: message
  });
}
