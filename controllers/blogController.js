const Blog = require("../models/Blog");
const { formateDate } = require("../utils/jalali");
const { truncate } = require("../utils/helpers");
const { sendEmail } = require('../utils/mailer');
const { get500 } = require('./errorController');
const User = require("../models/User")
const Yup = require('Yup');
const captchapng = require("captchapng");

let CAPTCHA_NUM;

exports.alert = (req , data) => {
    let title = data.title || '',
        message = data.message || '',
        type = data.type || 'info',
        button = data.button || null,
        timer = data.timer || 3000;

    req.flash('sweetalert' , { title , message , type , button , timer});
}

exports.toast = (req,data) => {
    let title = data.title || "",
        icon = data.icon || "info",
        timer = data.timer || 3000

    req.flash('sweettoast', {title, icon, timer})
} 

exports.getIndex = async(req, res) => {
    const page = +req.query.page || 1;
    const postPerPage = 2;
    // this.toast(req, {
    //     title : "خوش آمدید",
    //     icon : 'success',
    //     timer : 3000
    // })
    this.alert(req, {
        title : 'موفقیت آمیز',
        message : 'ثبت نام شما موفقیت آمیز بود',
        type : 'success',
        button : 'متوجه شدم'
    });
    try {
        // const numberOfPosts = await Blog.find({
        //     status: "public",
        // }).countDocuments();

        // const posts = await Blog.find({ status: "public" })
        //     .sort({
        //         createdAt: "desc",
        //     })
        //     .skip((page - 1) * postPerPage)
        //     .limit(postPerPage);

        const posts = await Blog.paginate({status : "public"}, {page , sort : {createdAt : 1}, limit : postPerPage})
        res.render("index", {
            pageTitle: "وبلاگ",
            path: "/",
            posts,
            formateDate,
            truncate,
            isLoggedIn: req.isAuthenticated(),
            alertData : req.flash("sweetalert"),
            toastData : req.flash("sweettoast")
        })

        // const posts = await Blog.find({status : "public"}).populate("user").exec()
        // const user = await User.findById("62b456e74ed16a17ec3a3bcc").populate("blogs", "title body").exec()

        // return res.json({user})

        // res.render("index", {
        //     pageTitle: "وبلاگ",
        //     path: "/",
        //     posts,
        //     formateDate,
        //     truncate,
        //     currentPage: page,
        //     nextPage: page + 1,
        //     previousPage: page - 1,
        //     hasNextPage: postPerPage * page < numberOfPosts,
        //     hasPreviousPage: page > 1,
        //     lastPage: Math.ceil(numberOfPosts / postPerPage),
        //     isLoggedIn: req.isAuthenticated()
        // });
        //? Smooth Scrolling
    } catch (err) {
        console.log(err);
        res.render("errors/500");
    }
};

exports.getSinglePost = async(req, res) => {
    try {
        const post = await Blog.findOne({ _id: req.params.id }).populate(
            "user"
        );

        console.log(post)

        if (!post) return res.redirect("errors/404");

        res.render("post", {
            pageTitle: post.title,
            path: "/post",
            post,
            formateDate,
            isLoggedIn: req.isAuthenticated()

        });
    } catch (err) {
        console.log(err);
        res.render("errors/500");
    }
};

exports.getContactPage = (req, res) => {
    res.render("contact", {
        pageTitle: "تماس با ما",
        path: "/contact",
        message: req.flash("success_msg"),
        error: req.flash("error"),
        errors: [],
    });
};

exports.handleContactPage = async(req, res) => {
    const errorArr = [];

    const { fullname, email, message, captcha } = req.body;

    const schema = Yup.object().shape({
        fullname: Yup.string().required("نام و نام خانوادگی الزامی می باشد"),
        email: Yup.string()
            .email("آدرس ایمیل صحیح نیست")
            .required("آدرس ایمیل الزامی می باشد"),
        message: Yup.string().required("پیام اصلی الزامی می باشد"),
    });

    try {
        await schema.validate(req.body, { abortEarly: false });


        if (parseInt(captcha) === CAPTCHA_NUM) {
            console.log('Email hasent sent yet....')
            sendEmail(
                email,
                fullname,
                "پیام از طرف وبلاگ",
                `${message} <br/> ایمیل کاربر : ${email}`
            );

            console.log('Email has benn sent')

            req.flash("success_msg", "پیام شما با موفقیت ارسال شد");

            return res.render("contact", {
                pageTitle: "تماس با ما",
                path: "/contact",
                message: req.flash("success_msg"),
                error: req.flash("error"),
                errors: errorArr,
            });
        }

        req.flash("error", "کد امنیتی صحیح نیست");

        res.render("contact", {
            pageTitle: "تماس با ما",
            path: "/contact",
            message: req.flash("success_msg"),
            error: req.flash("error"),
            errors: errorArr,
        });
    } catch (err) {
        err.inner.forEach((e) => {
            errorArr.push({
                name: e.path,
                message: e.message,
            });
        });
        res.render("contact", {
            pageTitle: "تماس با ما",
            path: "/contact",
            message: req.flash("success_msg"),
            error: req.flash("error"),
            errors: errorArr,
        });
    }
};

exports.getCaptcha = (req, res) => {
    CAPTCHA_NUM = parseInt(Math.random() * 9000 + 1000);
    const p = new captchapng(80, 30, CAPTCHA_NUM);
    p.color(0, 0, 0, 0);
    p.color(80, 80, 80, 255);

    const img = p.getBase64();
    const imgBase64 = Buffer.from(img, "base64");

    res.send(imgBase64);
};


exports.search = async(req, res) => {
    const page = +req.query.page || 1;
    const postPerPage = 5;

    try {
        const numberOfPosts = await Blog.find({
            status: "public",
            $text: { $search: req.body.search },
        }).countDocuments();

        const posts = await Blog.find({
                status: "public",
                $text: { $search: req.body.search },
            })
            .sort({
                createdAt: "desc",
            })
            .skip((page - 1) * postPerPage)
            .limit(postPerPage);

        res.render("index", {
            pageTitle: "نتایج جستجوی شما",
            path: "/",
            posts,
            formateDate,
            truncate,
            currentPage: page,
            nextPage: page + 1,
            previousPage: page - 1,
            hasNextPage: postPerPage * page < numberOfPosts,
            hasPreviousPage: page > 1,
            lastPage: Math.ceil(numberOfPosts / postPerPage),
            isLoggedIn: req.isAuthenticated()
        });
        //? Smooth Scrolling
    } catch (err) {
        console.log(err);
        get500(req, res)
    }
}