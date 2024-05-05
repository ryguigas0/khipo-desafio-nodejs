import { Schema } from "express-validator";

let deleteTaskSchema: Schema = {
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
  }
};

export default deleteTaskSchema;
