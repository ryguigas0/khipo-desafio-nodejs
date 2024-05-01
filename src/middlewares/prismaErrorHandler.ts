import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextFunction, Request, Response } from "express";


export default function prismaErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof PrismaClientKnownRequestError) {
        console.log("PRISMA ERROR")
        switch (err.code) {
            case "P2002":
                res.status(400).json({
                    "errors": [
                        {
                            "type": "field",
                            "value": req.body.email,
                            "msg": "Email already registered!",
                            "path": "password",
                            "location": "body"
                        }
                    ]
                })
                break;

            case "P2025":
                res.status(404).json({
                    "errors": [
                        {
                            "type": "field",
                            "value": req.body.email,
                            "msg": "Email not found!",
                            "path": "password",
                            "location": "body"
                        }
                    ]
                })
                break;
            default:
                next(err)
                break;
        }
    } else {
        next(err)
    }
}
