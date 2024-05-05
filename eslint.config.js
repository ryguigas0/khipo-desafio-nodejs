module.exports = {
  root: true,
  files: ["src/**/*.js"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": 0,
    "perfer-const": 0,
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        args: "none"
      }
    ],
    "prettier/prettier": 2
  }
};
