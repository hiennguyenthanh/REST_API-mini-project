const router = require("express").Router();
const { body } = require("express-validator");

const feedController = require("../controllers/feed");

router.post(
  "/post",
  [
    body("title").isString().isLength({ min: 10, max: 100 }),
    body("content").isString().isLength({ min: 10, max: 100 }),
  ],
  feedController.createPost
);

router.get("/post", feedController.getPosts);

router.get("/post/:postId", feedController.getPostById);

router.put(
  [
    body("title").isString().isLength({ min: 10, max: 100 }),
    body("content").isString().isLength({ min: 10, max: 100 }),
  ],
  feedController.updatePost
);

router.delete("/post/:postId", feedController.deletePost);

module.exports = router;
