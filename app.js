var createError = require('http-errors');
var env  = require('dotenv').config();
const nodemailer = require('nodemailer');
var events = require('events');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const helmet = require("helmet");

var bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
var sql = require('mysql');
var fs = require('fs');

var hbs = require('hbs');
var bcrypt = require('bcryptjs');
var securePin = require('secure-pin');
var passport = require('passport');
var localStrategy = require('passport-local'),Strategy;
var session = require('express-session');
var MySQLStore = require ('express-mysql-session')(session);
//var flash = require('express-flash-messages');
const  flash  = require('express-flash-messages');


var db = require('./db.js');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


var mainfTemplate = fs.readFileSync(__dirname + '/views/spagenav.hbs', 'utf8');
hbs.registerPartial('spagenav', mainfTemplate); 



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

var options = {
	host: "localhost",
	user: "root",
	password: '',
	database: "getaway"
}

var sessionStore = new MySQLStore(options);
  
app.use(session({
  secret: 'keybaby',
  resave: false,
  store: sessionStore,
  saveUninitialized: false,
  /**cookie:
    #secure: true**/
  }));
  
  // setup flash
/*app.use(
  flash({
    sessionKeyName: 'express-flash-message',
    // below are optional property you can pass in to track
    onAddFlash: (type, message) => {},
    onConsumeFlash: (type: string, messages: string[]) => {},
  })
);*/


  //passport
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// middle ware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(expressValidator());

app.use(function(req, res, next){
  res.locals.isAuthenticated = req.isAuthenticated();
  next(); 
});

app.use('/', indexRouter);
app.use('/users', usersRouter); 




passport.use(new localStrategy(function(username, password, done){
		console.log(username);
		console.log(password);
		const db = require('./db.js');

	db.query('SELECT user_id, password, verification FROM get_away_users WHERE Username = ?', [username], function (err, results, fields){
		if (err) {done(err)};
		console.log(results)
		if (results.length === 0){
			done(null, false, {
				message: 'This Email does not exist'
			});
		}else {
			const hash = results[0].password.toString();
			bcrypt.compare(password, hash, function(err, response){
				if (results[0].verification === 'No'){
					done(null, false, {
						message: "Please verify your email."
					})
				}else{
					if (response === true){
						return done(null, {user_id: results[0].user_id});
						
					}else{
						return done(null, false,{
							message:'Incorrect  Password'
						});
					}
				}
			});			
		}
      
    });
   
}));


app.use('/', indexRouter);
app.use('/users', usersRouter);


/// catch 404 and forward to error handler
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
module.exports.dirname = path.dirname(__filename);