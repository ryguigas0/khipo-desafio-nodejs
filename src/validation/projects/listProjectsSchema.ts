import { Schema } from "express-validator";

let listProjectsSchema: Schema = {
  name: {
    in: ["query"],
    optional: true,
    isString: true,
    notEmpty: true
  }
};

export default listProjectsSchema;
