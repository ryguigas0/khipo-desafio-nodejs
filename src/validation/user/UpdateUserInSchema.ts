import { Schema } from "express-validator";

const updateUserInSchema: Schema = {
  userId: {
    in: ["params"],
    notEmpty: {
      errorMessage: "User ID not provided"
    },
    isInt: {
      options: {
        min: 0
      }
    }
  },
  name: {
    in: ["body"],
    optional: true
  },
  email: {
    in: ["body"],
    optional: true,
    isEmail: {
      errorMessage: "Invalid email"
    }
  },
  oldPassword: {
    optional: true,
    in: ["body"],
    notEmpty: {
      errorMessage: "Empty password"
    },
    isLength: {
      errorMessage: "Invalid old password length is lower than 8",
      options: {
        min: 8
      }
    }
  },
  newPassword: {
    optional: true,
    in: ["body"],
    notEmpty: {
      errorMessage: "Empty password"
    },
    isLength: {
      errorMessage: "Invalid new password length is lower than 8",
      options: {
        min: 8
      }
    }
  }
};

export default updateUserInSchema;
