import { Schema } from "express-validator";

let newProjectSchema: Schema = {
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
};

export default newProjectSchema;
