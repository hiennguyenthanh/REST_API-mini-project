const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const bodyParser = require("body-parser");
const path = require("path");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const isAuth = require("./middleware/is-auth");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", isAuth, feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const { msg } = error;
  const data = error.data;
  res.status(statusCode).json({ msg, data });
});

try {
  await mongoose.connect(
    "mongodb+srv://hien:enhLohCjm8Vk3hSP@cluster0.mwbdzpd.mongodb.net/messages"
  );
  app.listen(3000, () => {
    console.log("Listening on port 3000");
  });
} catch (error) {
  console.log(error);
}
