import { Schema } from "express-validator"

let newTagSchema: Schema = {
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
    title: {
        in: ["body"],
        notEmpty: {
            errorMessage: "Empty name"
        }
    }
}

export default newTagSchema