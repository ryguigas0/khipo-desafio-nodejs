import { Schema } from "express-validator";

let listTasksIn: Schema = {
  projectId: {
    in: ["params"],
    notEmpty: {
      errorMessage: "Project ID not provided"
    }
  },
  status: {
    in: ["query"],
    optional: true,
    isIn: {
      options: [["done", "ongoing", "pending"]],
      errorMessage: "Task status is not 'done', 'ongoing' or 'pending'"
    }
  },
  "tags.*": {
    in: ["query"],
    optional: true,
    isString: true
  }
};

export default listTasksIn;
