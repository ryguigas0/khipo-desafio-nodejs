import { NextFunction, Request, Response } from "express";


export default function generalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.log("GENERAL ERROR")

    res.status(500).json({
        "error": err
    })
}
