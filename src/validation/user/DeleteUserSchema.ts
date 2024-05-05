import { Schema } from "express-validator";

let deleteUserSchema: Schema = {
  userId: {
    in: ["params"],
    notEmpty: {
      errorMessage: "User ID not provided"
    }
  }
};

export default deleteUserSchema;
