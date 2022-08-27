const Blog = require("../../models/Blog");
const fs = require('fs')
const { formateDate } = require('../../utils/jalali');
const { get500, get404 } = require('../errorController');
const { storage, fileFilter } = require('../../utils/multer');

const multer = require('multer');
const sharp = require('sharp');
const appRoot = require('app-root-path')
const shortid = require('shortid');

exports.getDashboard = async(req, res, next) => {
    try {
        const page = +req.query.page || 1;
        const blogs = await Blog.paginate({ user: req.user._id }, { page, sort: { createdAt: 1 }, limit: 2 })

        res.set(
            "Cache-Control",
            "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
        );

        // return res.json({ blogs })

        res.render("admin/blogs", {
            pageTitle: "بخش مدیریت | داشبورد",
            path: "/dashboard",
            layout: "./layouts/dashLayout",
            fullname: req.user.fullname,
            blogs,
            formateDate
        })

        // const postPerPage = 10;

        // const numberOfPosts = await Blog.find({ user: req.user._id }).countDocuments()

        // const blogs = await Blog.find({ user: req.user.id })
        //     .skip((page - 1) * postPerPage)
        //     .limit(postPerPage)

        // res.render("admin/blogs", {
        //     pageTitle: "بخش مدیریت | داشبورد",
        //     path: "/dashboard",
        //     layout: "./layouts/dashLayout",
        //     fullname: req.user.fullname,
        //     blogs,
        //     formateDate,
        //     currentPage: page,
        //     nextPage: page + 1,
        //     previousPage: page - 1,
        //     hasNextPage: postPerPage * page < numberOfPosts,
        //     hasPreviousPage: page > 1,
        //     lastPage: Math.ceil(numberOfPosts / postPerPage)
        // });
    } catch (err) {
        console.log(err);
        get500(req, res)
    }
};

exports.getAddPost = (req, res) => {
    res.render("admin/addPost", {
        pageTitle: "بخش مدیریت | ساخت پست جدید",
        path: "/dashboard/add-post",
        layout: "./layouts/dashLayout",
        fullname: req.user.fullname,
    });
};

exports.createPost = async(req, res) => {
    const errorArr = [];

    const thumbnail = req.files ? req.files.thumbnail : {};
    const filename = `${shortid.generate()}_${thumbnail.name}`
    const uploadPath = `${appRoot}/public/uploads/thumbnails/${filename}`

    try {
        req.body = {...req.body, thumbnail }

        await Blog.postValidation(req.body)

        await sharp(thumbnail.data)
            .jpeg({ quality: 40 })
            .toFile(uploadPath)
            .catch(err => console.log(err))

        await Blog.create({...req.body, user: req.user.id, thumbnail: filename });
        res.redirect("/dashboard");
    } catch (err) {

        console.log(err);
        err.inner.forEach((e) => {
            errorArr.push({
                name: e.path,
                message: e.message,
            });
        });

        res.render("admin/addPost", {
            pageTitle: "بخش مدیریت | ساخت پست جدید",
            path: "/dashboard/add-post",
            layout: "./layouts/dashLayout",
            fullname: req.user.fullname,
            errors: errorArr
        });
    }
};

exports.getEditPost = async(req, res) => {

    // const post = await Blog.findById(req.params.id)
    const post = await Blog.findOne({
        _id: req.params.id
    })

    if (!post) {
        get404(req, res);
    }

    if (post.user.toString() != req.user._id) {
        return res.redirect('/dashboard');
    } else {
        res.render("admin/editPost", {
            pageTitle: "بخش مدیریت | ویرایش پست ",
            path: "/dashboard/add-post",
            layout: "./layouts/dashLayout",
            fullname: req.user.fullname,
            post
        });
    }
};

exports.editPost = async(req, res) => {
    const errorArr = [];

    const thumbnail = req.files ? req.files.thumbnail : {};
    const filename = `${shortid.generate()}_${thumbnail.name}`;
    const uploadImage = `${appRoot}/public/uploads/thumbnails/${filename}`

    const post = await Blog.findOne({ _id: req.params.id })
    try {
        if (thumbnail.name) await Blog.postValidation({...req.body, thumbnail })
        else await Blog.postValidation({...req.body, thumbnail: { name: 'fake', size: 0, mimetype: 'image/jpeg' } })

        if (!post) {
            get404(req, res);
        }

        if (post.user.toString() != req.user._id) {
            return res.redirect("/dashboard");
        } else {
            if (thumbnail.name) {
                fs.unlink(`${appRoot}/public/uploads/thumbnails/${post.thumbnail}`, async err => {
                    if (err) console.log(err)
                    else {
                        await sharp(thumbnail.data)
                            .jpeg({ quality: 40 })
                            .toFile(uploadImage)
                            .catch(err => console.log(err))
                    }
                })
            }

            const { title, body, status } = req.body;
            post.title = title;
            post.body = body;
            post.status = status;
            post.thumbnail = thumbnail.name ? filename : post.thumbnail
            await post.save();

            return res.redirect('/dashboard')
        }

    } catch (err) {

        console.log(err);
        err.inner.forEach((e) => {
            errorArr.push({
                name: e.path,
                message: e.message,
            });
        });

        res.render("admin/editPost", {
            pageTitle: "بخش مدیریت | ویرایش پست ",
            path: "/dashboard/edit-post",
            layout: "./layouts/dashLayout",
            fullname: req.user.fullname,
            errors: errorArr,
            post
        });
    }
}


exports.deletePost = async(req, res) => {
    try {
        const result = await Blog.findByIdAndRemove(req.params.id);
        console.log(result);
        return res.redirect('/dashboard')
    } catch (err) {
        console.log(err);
        get500(req, res)
    }
}

exports.uploadImage = (req, res) => {
    // const filename = `${uuid()}.jpg`;

    const upload = multer({
        limits: { fileSize: '5000000' },
        // dest: 'uploads/',
        // storage: storage,
        fileFilter: fileFilter
    }).single('image');



    upload(req, res, async err => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).send('حجم عکس ارسالی نباید بیشتر از 5 مگابایت باشد.')
            }
            res.status(400).send(err)
        } else {
            if (req.file) {
                const filename = `${shortid.generate()}_${req.file.originalname}`;
                await sharp(req.file.buffer).jpeg({
                        quality: 50
                    })
                    .toFile(`./public/uploads/${filename}`)
                    .catch(err => console.log(err))
                res.status(200).send(`http://localhost:3000/uploads/${filename}`)
            } else {
                res.send('جهت آپلود باید عکسی را انتخاب کنید.')
            }

        }
    })

};

exports.handleDashSearch = async(req, res) => {
    try {
        const page = +req.query.page || 1;
        const postPerPage = 10;

        const numberOfPosts = await Blog.find({
            user: req.user._id,
            $text: { $search: req.body.search },
        }).countDocuments();
        const blogs = await Blog.find({
                user: req.user.id,
                $text: { $search: req.body.search },
            })
            .skip((page - 1) * postPerPage)
            .limit(postPerPage);

        res.render("admin/blogs", {
            pageTitle: "بخش مدیریت | داشبورد",
            path: "/dashboard",
            layout: "./layouts/dashLayout",
            fullname: req.user.fullname,
            blogs,
            formateDate,
            currentPage: page,
            nextPage: page + 1,
            previousPage: page - 1,
            hasNextPage: postPerPage * page < numberOfPosts,
            hasPreviousPage: page > 1,
            lastPage: Math.ceil(numberOfPosts / postPerPage)
        });
    } catch (err) {
        console.log(err);
        get500(req, res)
    }
}