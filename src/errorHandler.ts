import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextFunction, Request, Response } from "express";


export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.log("IM running")

    if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            res.status(400).json({"errors": [
                {
                    "type": "field",
                    "value": req.body.email,
                    "msg": "Email already registered!",
                    "path": "password",
                    "location": "body"
                }
            ]})
        }
    }
}
