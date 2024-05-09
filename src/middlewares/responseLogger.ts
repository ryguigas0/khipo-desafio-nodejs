import { NextFunction, Request, Response } from "express";
import { config, createLogger, format, transport, transports } from "winston"

const logger = createLogger({
    levels: config.syslog.levels,
    level: 'info',
    format: format.combine(
        format.cli(),
        format.colorize(),
        format.timestamp(),
        format.splat(),
        format.simple()
    ),
    transports: [new transports.Console()]
});

export default function responseLogger(
    req: Request,
    res: Response,
    next: NextFunction
) {
    // console.log({ req, res })
    logger.log(
        isErrorStatus(res.statusCode) ? 'error' : 'info',
        '[%s] %s -> %s',
        req.method,
        req.url,
        res.statusCode
    )
    next()
}

function isErrorStatus(statusCode: number) {
    return statusCode >= 400 && statusCode <= 599
}