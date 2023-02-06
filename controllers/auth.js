const User = require("../models/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("validation failed");
    error.statusCode = 422;
    error.data = errors.data;
    throw error;
  }

  const { email, password, name } = req.body;

  User.findOne({ email }).then((user) => {
    if (user) {
      const error = new Error("Registed email address!");
      error.statusCode = 400;
      throw error;
    }
    bcrypt
      .hash(password, 12)
      .then((hashedPassword) => {
        const user = new User({
          email,
          password: hashedPassword,
          name,
        });

        return user.save();
      })
      .then((user) => {
        res.status(201).json({ msg: "User created!", userId: user._id });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }

        next(err);
      });
  });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  let tempUser;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = new Error("User with this email not found!");
        error.statusCode = 401;
        throw error;
      }
      tempUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong password!");
        error.statusCode = 401;
        throw error;
      }

      const token = jwt.sign(
        {
          email: tempUser.email,
          userId: tempUser._id.toString(),
        },
        "secret",
        { expiresIn: "3h" }
      );

      res.status(200).json({ token, userId: tempUser._id.toString() });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUserStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not exist!");
        error.statusCode = 404;
        throw error;
      }
      res
        .status(200)
        .json({ msg: "User's status fetched!", status: user.status });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateUserStatus = (req, res, next) => {
  const { status } = req.body;
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not exist!");
        error.statusCode = 404;
        throw error;
      }
      user.status = status;
      return user.save();
    })
    .then((result) => {
      res.status(200).json({ msg: "User's status updated!" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
