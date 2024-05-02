import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";
import { ResponseException } from "./ResponseException";

export function handlePrismaError(fieldName: string, err: PrismaClientKnownRequestError | PrismaClientUnknownRequestError): ResponseException {
    if (err instanceof PrismaClientKnownRequestError) {
        return handleKnownPrismaError(fieldName, err)
    } else {
        return handleUnknownPrismaError(fieldName, err)
    }
}

function handleKnownPrismaError(fieldName: string, err: PrismaClientKnownRequestError): ResponseException {
    switch (err.code) {
        case "P2002":
            return new ResponseException(`${fieldName} already registered!`, 400)
        case "P2025":
            return new ResponseException(`${fieldName} not found!`, 404)
        default:
            return new ResponseException(`Unknown error at ${fieldName}`, 500)
    }
}

function handleUnknownPrismaError(fieldName: string, err: PrismaClientUnknownRequestError): ResponseException {
    return new ResponseException(`Unknown error at ${fieldName}: ${err.message}`, 500)
}