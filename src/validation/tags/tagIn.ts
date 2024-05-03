import { Schema } from "express-validator"

let tagSchema: Schema = {
    title: {
        in: ["body"],
        notEmpty: {
            errorMessage: "Empty name"
        }
    }
}

export default tagSchema