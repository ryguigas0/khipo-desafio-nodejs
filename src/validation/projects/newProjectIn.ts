import { Schema } from "express-validator"

let newProjectIn: Schema = {
    name: {
        in: ["body"],
        notEmpty: true
    },
    description: {
        in: ["body"],
        optional: true,
        notEmpty: true
    },
    "members.*": {
        in: ["body"],
        optional: true,
        isInt: {
            options: {
                min: 0
            }
        }
    }
}

export default newProjectIn