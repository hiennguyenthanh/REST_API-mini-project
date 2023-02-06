const router = require("express").Router();
const { body } = require("express-validator");

const authController = require("../controllers/auth");

router.put(
  "/signup",
  [
    body("email")
      .notEmpty()
      .withMessage("Please fill in email")
      .isEmail()
      .withMessage("Please enter a valid email"),
    body("name")
      .notEmpty()
      .withMessage("Please fill in name")
      .isString()
      .isLength({ min: 3 })
      .withMessage("Name must be at least 5 characters"),
    body("password")
      .notEmpty()
      .withMessage("Please fill in password")
      .isLength({ min: 6 }),
  ],
  authController.signup
);

router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Please fill in email")
      .isEmail()
      .withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Please fill in password"),
  ],
  authController.login
);

module.exports = router;
