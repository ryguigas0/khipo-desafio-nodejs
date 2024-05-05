import { Schema } from "express-validator";

let updateProjectSchema: Schema = {
  projectId: {
    in: ["params"],
    notEmpty: true
  },
  name: {
    in: ["body"],
    optional: true,
    notEmpty: true
  },
  description: {
    in: ["body"],
    optional: true,
    notEmpty: true
  }
};

export default updateProjectSchema;
