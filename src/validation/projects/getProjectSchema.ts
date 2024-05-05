import { Schema } from "express-validator";

let getProjectSchema: Schema = {
  projectId: {
    in: ["params"],
    notEmpty: {
      errorMessage: "Project ID not provided"
    }
  }
};

export default getProjectSchema;
