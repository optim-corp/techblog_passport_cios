var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const fetch = require('node-fetch')
const passport = require("passport")
const session = require("express-session")
const CIOSStrategy = require("@optim-corp/passport-cios")

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboardcat',
  resave: true,
  saveUninitialized: true
}))

/**
 * Passport設定
 */
passport.use(new CIOSStrategy({
        clientID: "", // TODO: ここにClientIDを入力
        clientSecret: "", // TODO: ここにClientSecretを入力
        callbackURL: "http://localhost:3000/oauth2/callback",
        scope: "openid profile user.profile", 
      },
    (accessToken, refreshToken, res, profile, cb) => {
        return cb(null, res)
    }
))
passport.serializeUser(function(user, done) { done(null, user); });
passport.deserializeUser(function(user, done) { done(null, user); });

app.use(passport.initialize())
app.use(passport.session());

app.get("/login/cios", passport.authenticate("cios"))
app.get("/oauth2/callback", passport.authenticate("cios", { failureRedirect: "/" }), (req, res) => {
    req.session.access_token = req.user.access_token    // AccessToken
    req.session.refresh_token = req.user.refresh_token  // Refresh Token
    return res.redirect("/")    // Redirect
},)
app.get("/logout", (req, res)=>{
    req.session.access_token = null    // AccessToken
    req.session.refresh_token = null  // Refresh Token
    return res.redirect("/")    // Redirect
})

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/me', async (req,res)=>{

  // OAuth認可を一度も受けていない場合エラーを返す
  if (!req.session.access_token) {
    console.error("not login");
    const error = {
      "error": "not login"
    }
    return res.status(401).json(error)
  }

  // "/me"を叩く
  const response = await fetch('https://accounts.optimcloudapis.com/v2/me',{
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+ req.session.access_token
    }
  })
  return res.json(await response.json())
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
