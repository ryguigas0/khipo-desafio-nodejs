import { Schema } from "express-validator";

let deleteTagIn: Schema = {
  projectId: {
    in: ["params"],
    notEmpty: {
      errorMessage: "Project ID not provided"
    }
  },
  taskId: {
    in: ["params"],
    notEmpty: {
      errorMessage: "Task ID not provided"
    }
  },
  tagId: {
    in: ["params"],
    notEmpty: {
      errorMessage: "Tag ID not provided"
    }
  }
};

export default deleteTagIn;
