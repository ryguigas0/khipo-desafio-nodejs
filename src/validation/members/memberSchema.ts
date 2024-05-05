import { Schema } from "express-validator";

let memberSchema: Schema = {
  projectId: {
    in: ["params"],
    notEmpty: true
  },
  memberEmail: {
    in: ["body"],
    notEmpty: true,
    isEmail: true
  }
};

export default memberSchema;
