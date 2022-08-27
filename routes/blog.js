const { Router } = require("express");

const indexController = require('../controllers/blogController');

const router = new Router();

//  @desc   Weblog Index Page
//  @route  GET /
router.get("/", indexController.getIndex);

//  @desc   Weblog Post Page
//  @route  GET /post/:id
router.get("/post/:id", indexController.getSinglePost);

//  @desc   Weblog Contact Page
//  @route  GET /contact
router.get("/contact", indexController.getContactPage);

//  @desc   Weblog Numric Captcha
//  @route  GET /captcha.png
router.get("/captcha.png", indexController.getCaptcha);

//  @desc   Handle Contact Page
//  @route  POST /contact
router.post("/contact", indexController.handleContactPage);

//  @desc   Handle search Page
//  @route  POST /search
router.post("/search", indexController.search);



module.exports = router;