import { NextFunction, Request, Response } from "express";
import { ResponseException } from "../errors/ResponseException";

export default function generalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = err instanceof ResponseException ? err.statusCode : 500;

  res.status(statusCode).json({
    error: err.message
  });

  next();
}
