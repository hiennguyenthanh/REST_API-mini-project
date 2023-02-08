const fs = require("fs");
const path = require("path");

const io = require("../socket");
const Post = require("../models/post");
const User = require("../models/user");
const { validationResult } = require("express-validator");

const postPerPage = 5;

exports.getPosts = async (req, res, next) => {
  const { page } = req.params;
  try {
    const totalDocuments = await Post.find().countDocuments();

    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((page - 1) * postPerPage)
      .limit(postPerPage);

    res.status(200).json({ msg: "Posts fetched!", posts, totalDocuments });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
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

  try {
    await post.save();

    const user = await User.findById(req.userId);

    user.posts.push(post);

    await user.save();

    io.getIO().emit("posts", { action: "create", post });

    res.status(201).json({
      msg: "Post created!",
      post,
    });
  } catch (err) {
    res.status(402).json({ msg: "Bad request" });
  }
};

exports.getPostById = async (req, res, next) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Post not found!");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ msg: "Post fetched", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
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

  try {
    const post = await Post.findById(postId);

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

    await post.save();

    io.emit("posts", { action: "update", post });

    res.status(200).json({ msg: "Post updated", post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);

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

    await Post.findByIdAndRemove(postId);

    const user = await User.findById(req.userId);
    user.posts.pull(postId);

    await user.save();
    io.emit("posts", { action: "delete", postId });
    res.status(200).json({ msg: "Post deleted" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
