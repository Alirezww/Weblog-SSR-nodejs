const { get500, get404 } = require("../errorController");
const User = require('../../models/User')
const { formateDate } = require('../../utils/jalali')
const Blog = require("../../models/Blog");

exports.getUsers = async(req, res) => {
    try {
        const page = +req.query.page || 1;

        const users = await User.paginate({}, { page, sort: { createdAt: 1 }, limit: 2 })

        // res.json({ users })
        res.render("admin/users", {
            pageTitle: "بخش مدیریت | کاربران",
            path: "/users",
            layout: "./layouts/dashLayout",
            fullname: req.user.fullname,
            users,
            formateDate
        })

    } catch (err) {
        console.log(err)
        get500()
    }
}

exports.getAddUser = (req, res) => {
    res.render('admin/addUser', {
        pageTitle: 'ساخت کاربر - جدید',
        path: '/dashboard/add-user',
        layout: './layouts/dashLayout',
        fullname: req.user.fullname
    })
}

exports.addUser = async(req, res) => {
    const errors = [];
    try {
        await User.userValidation(req.body);
        await User.create(req.body)
        res.redirect('/dashboard/users')
    } catch (err) {
        console.log(err)

        err.inner.forEach(e => {
            errors.push({
                message: e.message,
                path: e.path
            })
        });

        res.render('admin/addUser', {
            pageTitle: 'خطا هنگام ایجاد کاربر',
            fullname: req.user.fullname,
            layout: './layouts/dashLayout',
            path: '/dashboard/add-user',
            errors,
        })
    }
}

exports.getEditUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) {
            get404(req, res);
        }

        if (user._id.toString() != req.user._id) {
            return res.redirect('/dashboard/users')
        }

        res.render('admin/editUser', {
            pageTitle: 'ویرایش پست',
            path: '/dashboard/edit-post',
            layout: './layouts/dashLayout',
            fullname: req.user.fullname,
            user
        })
    } catch (err) {
        console.log(err)
        get500(req, res)
    }
}

exports.editUser = async(req, res) => {
    const errors = [];
    const user = await User.findById(req.params.id)

    try {
        await User.userValidation(req.body)

        if (!user) {
            get404(req, res)
        }

        if (user._id.toString() != req.user._id) {
            return res.redirect('/dashboard/users')
        } else {
            const { fullname, email, password } = req.body
            user.fullname = fullname
            user.email = email
            user.password = password

            await user.save()

            return res.redirect('/dashboard/users')
        }
    } catch (err) {
        console.log(err)
        err.inner.forEach(e => {
            errors.push({
                message: e.message,
                path: e.path
            })
        })

        res.render('admin/editUser', {
            pageTitle: 'ویرایش پست',
            path: '/dashboard/edit-user',
            layout: './layouts/dashLayout',
            fullname: req.user.fullname,
            errors,
            user
        })
    }
}

exports.deleteUser = async(req, res) => {
    try {
        const user = await User.findByIdAndRemove(req.params.id)
        console.log(user)
        res.redirect('/dashboard/users')
    } catch (err) {
        console.log(err)
        get500(req, res)
    }
}