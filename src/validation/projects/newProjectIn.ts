import { Schema } from "express-validator"

let newProjectIn: Schema = {
    name: {
        in: ["body"],
        notEmpty: true
    },
    description: {
        in: ["body"],
        optional: true,
        notEmpty: true,
        isString: true
    }
}

export default newProjectIn