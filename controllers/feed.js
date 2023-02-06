const fs = require("fs");
const path = require("path");

const Post = require("../models/post");
const User = require("../models/user");
const { validationResult } = require("express-validator");

const postPerPage = 5;

exports.getPosts = (req, res, next) => {
  const { page } = req.params;
  let totalDocuments;

  Post.find()
    .countDocuments((total) => {
      totalDocuments = total;

      return Post.find()
        .skip((page - 1) * postPerPage)
        .limit(postPerPage);
    })
    .then((posts) => {
      res.status(200).json({ msg: "Posts fetched!", posts, totalDocuments });
    })
    .catch();
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);

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
    creator: req.userId,
  });

  post
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.push(post);

      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        msg: "Post created!",
        post: result,
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

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ msg: "Validation failed", errors: errors.array() });
  }

  let { postId, title, content, imageUrl } = req.params;

  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = new Error("No file picked!");
    error.statusCode = 422;

    throw error;
  }

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found!");
        error.statusCode = 404;
        throw error;
      }

      if (post.creator.toString() !== req.userId) {
        const error = new Error("Unauthorized!");
        error.statusCode = 401;
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;

      return post.save();
    })
    .then((result) => {
      res.status(200).json({ msg: "Post updated", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const { postId } = req.params;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found!");
        error.statusCode = 404;
        throw error;
      }

      if (post.creator.toString() !== req.userId) {
        const error = new Error("Unauthorized!");
        error.statusCode = 401;
        throw error;
      }

      clearImage(post.imageUrl);

      return Post.findByIdAndRemove(postId);
    })
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);
      return user.save();
    })
    .then((result) => {
      res.status(200).json({ msg: "Post deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
