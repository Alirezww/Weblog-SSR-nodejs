const passport = require("passport");
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const User = require("../models/User");
const { sendEmail } = require("../utils/mailer");
const { get404 } = require('./errorController');

exports.login = (req, res) => {
    res.set(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );

    res.render("login", {
        pageTitle: "ورود به بخش مدیریت",
        path: "/login",
        message: req.flash("success_msg"),
        error: req.flash("error"),
    });
};

exports.handleLogin = async(req, res, next) => {
    console.log(req.body['g-recaptcha-response']);

    if (!req.body['g-recaptcha-response']) {
        req.flash('error', 'اعتبارسنجی گپچا گوگل الزامی می باشد.')
        return res.redirect('/users/login');
    }

    const secretKey = process.env.CAPTCHA_SECRET
    const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body['g-recaptcha-response']}&remoteip=${req.connection.remoteAddress}`;

    const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        },
    })

    const json = await response.json();

    console.log(json)

    if (json.success) {
        passport.authenticate('local', {
            // successRedirect : '/dashboard',
            failureRedirect: '/users/login',
            failureFlash: true
        })(req, res, next)
    } else {
        req.flash('error', 'در اعتبارسنجی کپچا گوگل مشکلی پیش آمده است.')
        res.redirect('/users/login')
    }
};

exports.rememberMe = (req, res) => {
    if (req.body.remember) {
        req.session.cookie.originalMaxAge = 24 * 60 * 60 * 1000; // 1 day 24
    } else {
        req.session.cookie.expire = null;
    }

    res.redirect("/dashboard");
};

exports.logout = (req, res) => {

    // The first way
    req.session = null
    req.logout()
    res.set(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.redirect('/users/login');

    // The second way
    // req.logout();
    // req.session.destroy(() => {
    //     res.redirect('/users/login');
    // });

};

exports.register = (req, res) => {
    res.render("register", {
        pageTitle: "ثبت نام کاربر جدید",
        path: "/register",
    });
};

exports.createUser = async(req, res) => {
    const errors = [];
    try {
        await User.userValidation(req.body);
        const { fullname, email, password } = req.body;

        const user = await User.findOne({ email });
        if (user) {
            errors.push({ message: "کاربری با این ایمیل موجود است" });
            return res.render("register", {
                pageTitle: "ثبت نام کاربر",
                path: "/register",
                errors,
            });
        }

        await User.create({ fullname, email, password });

        //? Send Email Welcome
        sendEmail(email, fullname, 'به وبلاک ما خوش اومدی',
            'خیلی خوشحالیم که به ما وبلاگر های خفن ملحق شدی!')

        req.flash("success_msg", "ثبت نام موفقیت آمیز بود.");
        res.redirect("/users/login");
    } catch (err) {
        console.log(err);
        err.inner.forEach((e) => {
            errors.push({
                name: e.path,
                message: e.message,
            });
        });

        return res.render("register", {
            pageTitle: "ثبت نام کاربر",
            path: "/register",
            errors,
        });
    }
};

exports.forgetPassword = async(req, res) => {
    res.render('forgetPass', {
        pageTitle: 'فراموشی کلمه عبور',
        path: '/login',
        message: req.flash('success_msg'),
        error: req.flash('error')
    })
}

exports.handleForgetPassword = async(req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email })

    if (!user) {
        req.flash('error', 'کاربری با این ایمیل در پایگاه داده ثبت نیست.')

        return res.render('forgetPass', {
            pageTitle: 'فراموشی کلمه عبور',
            path: '/login',
            message: req.flash('success_msg'),
            error: req.flash('error')
        })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
    const resetLink = `http://localhost:3000/users/reset-password/${token}`;

    sendEmail(
        user.email,
        user.fullname,
        'فراموشی رمز عبور',
        `
          جهت تغییر رمز عبور فعلی روی لینک زیر کلیک کنید.
          
          <a href="${resetLink}">لینک تغییر رمز عبور</a>`)

    req.flash('success_msg', 'ایمیل حاوی لینک با موفقیت ذخیره شد.')

    return res.render('forgetPass', {
        pageTitle: 'فراموشی کلمه عبور',
        path: '/login',
        message: req.flash('success_msg'),
        error: req.flash('error')
    })
};

exports.resetPassword = async(req, res) => {
    const token = req.params.token;

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decodedToken);
    } catch (err) {
        console.log(err);
        if (!decodedToken) {
            return res.redirect("/404");
        }
    }

    res.render("resetPass", {
        pageTitle: "تغییر پسورد",
        path: "/login",
        message: req.flash("success_msg"),
        error: req.flash("error"),
        userId: decodedToken.userId,
    });
};

exports.handleResetPassword = async(req, res) => {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        req.flash("error", "کلمه های عبور یکسان نیستند");

        return res.render("resetPass", {
            pageTitle: "تغییر پسورد",
            path: "/login",
            message: req.flash("success_msg"),
            error: req.flash("error"),
            userId: req.params.id,
        });
    }

    const user = await User.findOne({ _id: req.params.id });

    if (!user) {
        return res.redirect("/404");
    }

    user.password = password;
    await user.save();

    req.flash("success_msg", "پسورد شما با موفقیت بروزرسانی شد");
    res.redirect("/users/login");
};