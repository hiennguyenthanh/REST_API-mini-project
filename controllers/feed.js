const Post = require("../models/post");
const validatorResult = require("express-validator");

exports.createPost = (req, res, next) => {
  const errors = validatorResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ msg: "Validation failed", errors: errors.array() });
  }

  if (!req.file) {
    const error = new Error("Please upload atleast one image!");
    error.statusCode = 422;
    throw error;
  }

  const { title, content } = req.body;
  const imageUrl = req.file.path;

  const post = new Post({
    title,
    content,
    imageUrl,
    creator: { name: "Hien" },
  });

  post
    .save()
    .then((res) => {
      res.status(201).json({
        msg: "Post created!",
        post: res,
      });
    })
    .catch((err) => {
      res.status(402).json({ msg: "Bad request" });
    });
};

exports.getPostById = (req, res, next) => {
  const { postId } = req.params;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found!");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ msg: "Post fetched", post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
