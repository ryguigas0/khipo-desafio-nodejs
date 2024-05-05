import { Schema } from "express-validator";

let updateTaskSchema: Schema = {
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
  title: {
    in: ["body"],
    optional: true,
    notEmpty: {
      errorMessage: "Missing task name"
    },
    isString: true,
    isLength: {
      errorMessage: "Task title too long (max 255)",
      options: {
        max: 255
      }
    }
  },
  description: {
    in: ["body"],
    optional: true,
    notEmpty: {
      errorMessage: "Empty description"
    },
    isString: true
  },
  assignedMemberId: {
    in: ["body"],
    optional: true,
    isInt: {
      options: {
        min: 0
      }
    }
  },
  status: {
    optional: true,
    in: ["body"],
    isIn: {
      options: [["done", "ongoing", "pending"]],
      errorMessage: "Task status is not 'done', 'ongoing' or 'pending'"
    }
  }
};

export default updateTaskSchema;
