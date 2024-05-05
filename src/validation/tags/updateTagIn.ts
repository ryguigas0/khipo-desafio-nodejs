import { Schema } from "express-validator"

let updateTagSchema: Schema = {
    projectId: {
        in: ["params"],
        notEmpty: {
            errorMessage: "No project ID provided!"
        },
        isInt: {
            options: {
                min: 0
            }
        }
    },
    taskId: {
        in: ["params"],
        notEmpty: {
            errorMessage: "No task ID provided!"
        },
        isInt: {
            options: {
                min: 0
            }
        }
    },
    tagId: {
        in: ["params"],
        notEmpty: {
            errorMessage: "No tag ID provided!"
        },
        isInt: {
            options: {
                min: 0
            }
        }
    },
    title: {
        in: ["body"],
        optional: true,
        notEmpty: {
            errorMessage: "Empty name"
        }
    }
}

export default updateTagSchema