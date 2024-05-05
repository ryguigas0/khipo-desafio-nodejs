import { Schema } from "express-validator"

let newTaskIn: Schema = {
    projectId: {
        in: ["params"],
        notEmpty: {
            errorMessage: "Project ID not provided"
        }
    },
    title: {
        in: ["body"],
        notEmpty: {
            errorMessage: "Missing task name"
        },
        isString: true,
        isLength: {
            errorMessage: "Task title too long (max 255)",
            options: {
                max: 255,
            }
        }
    },
    description: {
        in: ["body"],
        optional: true,
        notEmpty: {
            errorMessage: "Empty description"
        },
        isString: true
    },
    assignedMemberId: {
        in: ["body"],
        optional: true,
        isInt: {
            options: {
                min: 0
            }
        }
    },
    "tags.*": {
        optional: true,
        notEmpty: true,
        isString: true
    }
}

export default newTaskIn