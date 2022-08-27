const { Router } = require("express");
const { authenticated } = require("../../middlewares/auth");
const adminController = require('../../controllers/admin/adminPost');

const router = new Router();

//  @desc   Dashboard
//  @route  GET /dashboard
router.get("/", authenticated, adminController.getDashboard);

// @desc Add Post
// @route GET /dashboard/add-post
router.get('/add-post', authenticated, adminController.getAddPost)

// @desc Dashboard Edit post
// @route GET /dashboard/edit-post
router.get('/edit-post/:id', authenticated, adminController.getEditPost)

// @desc Dashboard Delete Post
// @route GET /dashboard/delete-post
router.get('/delete-post/:id', authenticated, adminController.deletePost)

// @desc Dashboard Handle Post Creation
// @route POST /dashboard/add-post
router.post('/add-post', authenticated, adminController.createPost)

// @desc Handle Edit post
// @route POST /dashboard/edit-post
router.post('/edit-post/:id', authenticated, adminController.editPost)

// @desc Dashboard Handle Image Upload
// @route POST /dashboard/image-upload
router.post('/image-upload', authenticated, adminController.uploadImage)

//  @desc   Dashboard Handle Search
//  @route  POST /dashboard/search
router.post("/search", authenticated, adminController.handleDashSearch);


module.exports = router;