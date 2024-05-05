import { Schema } from "express-validator";

let newUserInSchema: Schema = {
  name: {
    in: ["body"],
    notEmpty: {
      errorMessage: "Empty name"
    }
  },
  email: {
    in: ["body"],
    errorMessage: "Invalid email",
    notEmpty: {
      errorMessage: "Empty email"
    },
    isEmail: {
      errorMessage: "Invalid email"
    }
  },
  password: {
    in: ["body"],
    notEmpty: {
      errorMessage: "Empty password"
    },
    isLength: {
      errorMessage: "Invalid password length is lower than 8",
      options: {
        min: 8
      }
    }
  }
};

export default newUserInSchema;
