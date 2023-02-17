'use strict';

var express = require('express');
var router = express.Router();


var passport = require('passport'); 
var securePin = require('secure-pin');
var charSet = new securePin.CharSet();
charSet.addLowerCaseAlpha().addUpperCaseAlpha().addNumeric().randomize();

var { check, validationResult } = require('express-validator');
var bcrypt = require('bcryptjs');

var db = require('../db.js');
//var getfunc = require('../functions.js');

const saltRounds = bcrypt.genSaltSync(10);


/* GET REQUESTS. */


//get homepage
router.get('/', authentificationMiddleware(), function(req, res, next) {
	var title = "IG NIG. LTD."
	res.render('dashboard', { title: title });
});


//get login
router.get('/login', function(req, res, next) {
	
	const flashMessages = res.locals.getMessages( );
	if( flashMessages.error ){
		res.render( 'login', {
			showErrors: true,
			errors: flashMessages.error
		});
	}else{
		var message = 'LOG IN';
		var title = "IG NIG. LTD."
		res.render('login', { title: title, mess: message });
	}
});

/* STORE KEEPER GET REQUEST SECTION. */

//GET INVENTORY,
router.get('/stock', authentificationMiddleware(), function(req, res, next) {
	var message = 'STOCK';
	var title = "IG NIG. LTD."
	var currentUser = req.session.passport.user.user_id;
	isaRestrictedUser(currentUser)
	db.query('SELECT * FROM get_away_users WHERE user_id = ?', [currentUser], function ( err, results, fields ){
		if( err ) throw err;
		if(results[0].user_type !== 'Administrator' || results[0].user_type !== 'Store Keeper'){
			res.redirect('/404');
		}else{
			db.query('SELECT description, closing-stock FROM stock ', function ( err, results, fields ){
				var stock = results;
				res.render('request-product', { 
					title: title,
					mess: message,
					remaining_stock: stock
				});
			});
		}
	});
});



/* STORE KEEPER GET REQUEST SECTION. */


/* ADMIN GET REQUEST SECTION. */


//ADD A USER.
router.get('/add-user', authentificationMiddleware(), function(req, res, next) {
	var message = 'ADD USER';
	var title = "IG NIG. LTD."
	var currentUser = req.session.passport.user.user_id;
	isaRestrictedUser(currentUser)
	db.query('SELECT * FROM get_away_users WHERE user_id = ?', [currentUser], function ( err, results, fields ){
		if( err ) throw err;
		if(results[0].user_type !== 'Administrator'){
			res.redirect('/404');
		}else{
			res.render('add-user', { title: title, mess: message });
		}
	});
});


/* END OF ADMIN GET REQUEST SECTION. */


/* MARKETERS GET REQUEST SECTION. */

//request for products.
router.get('/request-product', authentificationMiddleware(), function(req, res, next) {
	var message = 'REQUEST PRODUCT';
	var title = "IG NIG. LTD."
	var currentUser = req.session.passport.user.user_id;
	isaRestrictedUser(currentUser)
	db.query('SELECT * FROM get_away_users WHERE user_id = ?', [currentUser], function ( err, results, fields ){
		if( err ) throw err;
		if(results[0].user_type !== 'Administrator' || results[0].user_type !== 'Marketer'){
			res.redirect('/404');
		}else{
			res.render('request-product', { title: title, mess: message });
		}
	});
});

/*END OF MARKETERS GET REQUEST SECTION. */




/*post requests*/

//post log in
router.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
	res.redirect('/dashboard');
});


/* Passport login*/
passport.serializeUser(function(user_id, done){
  done(null, user_id)
});
        
passport.deserializeUser(function(user_id, done){
  done(null, user_id)
});

function authentificationMiddleware(){
  return (req, res, next) => {
    console.log(JSON.stringify(req.session.passport));
  if (req.isAuthenticated()) return next();

  res.redirect('/login'); 
  } 
}

function isaRestrictedUser(user){
	db.query('SELECT user_type FROM all-users WHERE full_name = ? ', [user], function ( err, results, fields ){
		if( err ) throw err;
		if (results[0].user_status === "Restricted"){
			res.redirect("/login")
		}
	});
}

/*ADMINISTRATOR POST REQUESTS*/

//ADD USERS
router.post('/adduser', authentificationMiddleware(), function(req, res, next) {
	var currentUser = req.session.passport.user.user_id;
	var fullname = req.body.fullname;
	var email = req.body.email;
	var phone = req.body.phone;
	
	isaRestrictedUser(currentUser)
});


//DELETE USERS
router.post('/deleteuser', authentificationMiddleware(), function(req, res, next) {
	var currentUser = req.session.passport.user.user_id;
	var fullname = req.body.fullname;
	isaRestrictedUser(currentUser)
	db.query('SELECT * FROM user WHERE full_name = ? ', [fullname], function ( err, results, fields ){
		if( err ) throw err;
		if(results.length === 0){
			var error = 'User does not exist';
			req.flash('delusererror', error);
			res.redirect('/admin/#deleteuser');
		}else{
			db.query('DELETE FROM user WHERE full_name = ? ', [  fullname],  function(err, results, fields){
				if (err) throw err;
				var success = 'User deleted successfully!';
				req.flash('delusersuccess', success);
				res.redirect('/admin/#deleteuser');
			});
		}
	});
});
	

//RESTRICT USERS (ON SUSPENSION)
router.post('/restrictuser', authentificationMiddleware(), function(req, res, next) {
	var currentUser = req.session.passport.user.user_id;
	var fullname = req.body.fullname;
	isaRestrictedUser(currentUser)
	db.query('SELECT * FROM user WHERE full_name = ? ', [fullname], function ( err, results, fields ){
		if( err ) throw err;
		if(results.length === 0){
			var error = 'User does not exist';
			req.flash('restrictusererror', error);
			res.redirect('/admin/#restrictuser');
		}else{
			db.query('UPDATE all-users SET user_status = ? WHERE full_name = ? ', ["Restricted",  fullname],  function(err, results, fields){
				if (err) throw err;
				var success = 'User Restricted successfully!';
				req.flash('restrictusersuccess', success);
				res.redirect('/admin/#restrictuser');
			});
		}
	});
});


//unrestrict users
router.post('/unrestrictsuser', authentificationMiddleware(), function(req, res, next) {
	var currentUser = req.session.passport.user.user_id;
	var fullname = req.body.fullname;
	isaRestrictedUser(currentUser)
	db.query('SELECT * FROM user WHERE full_name = ? ', [fullname], function ( err, results, fields ){
		if( err ) throw err;
		if(results.length === 0){
			var error = 'User does not exist';
			req.flash('restrictusererror', error);
			res.redirect('/admin/#restrictuser');
		}else{
			db.query('UPDATE all-users SET user_status = ? WHERE full_name = ? ', ["Allow",  fullname],  function(err, results, fields){
				if (err) throw err;
				var success = 'User Unrestricted successfully!';
				req.flash('unrestrictusersuccess', success);
				res.redirect('/admin/#unrestrictuser');
			});
		}
	});
});

//Assign Roles
router.post('/Assign-roles', authentificationMiddleware(), function(req, res, next) {
	var currentUser = req.session.passport.user.user_id;
	var fullname = req.body.fullname;
	var role = req.body.role;
	isaRestrictedUser(currentUser)
	db.query('SELECT * FROM user WHERE full_name = ? ', [fullname], function ( err, results, fields ){
		if( err ) throw err;
		if(results.length === 0){
			var error = 'User does not exist';
			req.flash('restrictusererror', error);
			res.redirect('/admin/#restrictuser');
		}else{
			db.query('UPDATE all-users SET user_type = ? WHERE full_name = ? ', [role,  fullname],  function(err, results, fields){
				if (err) throw err;
				var success = fullname + 'is now a ' + role;
				req.flash('rolesuccess', success);
				res.redirect('/admin/#role');
			});
		}
	});
});
	
module.exports = router;
