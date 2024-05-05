import { Schema } from "express-validator";

let deleteProjectSchema: Schema = {
  projectId: {
    in: ["params"],
    notEmpty: {
      errorMessage: "Project ID not provided"
    }
  }
};

export default deleteProjectSchema;
