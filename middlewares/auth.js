exports.redirectIfNotAdmin = (req, res, next) => {
    if(req.isAuthenticated() && req.user.role == "admin"){
        return next();
    }

    return res.redrect('/405')
}

exports.redirectIfAuthenticated = (req, res, next) => {
    if(!req.isAuthenticated()){
        return next()
    }

    return res.redirect('/')
}

exports.redirectIfNotAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()){
        return next()
    }

    res.redirect('/')
}