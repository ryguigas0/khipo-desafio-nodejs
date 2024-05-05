import { Schema } from "express-validator";

let listProjectsIn: Schema = {
  owned: {
    in: ["query"],
    optional: true,
    isBoolean: {
      options: {
        strict: true
      }
    }
  },
  member: {
    in: ["query"],
    optional: true,
    isBoolean: {
      options: {
        strict: true
      }
    }
  }
};

export default listProjectsIn;
