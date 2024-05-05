import { Schema } from "express-validator";

let tokenCredentialsSchema: Schema = {
  email: {
    in: ["body"],
    errorMessage: "Invalid email",
    notEmpty: {
      errorMessage: "No email provided"
    },
    isEmail: {
      errorMessage: "Invalid email"
    }
  },
  password: {
    in: ["body"],
    notEmpty: {
      errorMessage: "No password was provided"
    }
  }
};

export default tokenCredentialsSchema;
