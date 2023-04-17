'use strict';

var express = require('express');
var router = express.Router();


var passport = require('passport'); 
var securePin = require('secure-pin');
var charSet = new securePin.CharSet();
charSet.addLowerCaseAlpha().addUpperCaseAlpha().addNumeric().randomize();

var { check, validationResult } = require('express-validator');
var bcrypt = require('bcryptjs');
const  flash  = require('express-flash-messages');

var db = require('../db.js');
//var getfunc = require('../functions.js');

const saltRounds = bcrypt.genSaltSync(10);


/* GET REQUESTS. */


//get homepage
router.get('/', authentificationMiddleware(), function(req, res, next) {
	var title = "IG NIG. LTD."
	res.render('dashboard', { title: title });
});

//get logout
router.get('/logout', function(req, res, next) {
	req.logout(function(err) {
		if (err) { return next(err); }
		req.session.destroy();
		if (err) { return next(err); }
		res.redirect('/login');
	});
});


//get register
router.get('/register', function(req, res, next) {
	var title = "IG NIG. LTD."
	var message =  "User Registration"
	const flashMessages = res.locals.getMessages( );
	if( flashMessages.error ){
		res.render( 'register', {
			showErrors: true,
			error: flashMessages.error,
			title: title,
			mess: message
		});
	}else if( flashMessages.success ){
		res.render( 'register', {
			showSuccess: true,
			success: flashMessages.success,
			title: title,
			mess: message
		});
	}else{
		res.render('register', { 
			title: title,
			mess: message
		});
	}
});

//get verify mail
router.get('/verifymail/:email/:code', function(req, res, next) {
	var email = req.params.email
	var code = req.params.code
	
	db.query('SELECT verification_code FROM get_away_users WHERE username = ?', [email], function ( err, results, fields ){
		if( err ) throw err;
		if(results.lenght === 0){
			console.log("no email")
			res.redirect("/404")
		}else if (results[0].verification_code != code){
			console.log("no code")
			res.redirect("/404")
		}else{
			res.render("add-password", {title: "IG NIG LTD", mess: "ADD PASSWORD", email: email})
		}
	});
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

/*add users
router.get('/add-user', authentificationMiddleware(), function(req, res, next) {
	var message = 'ADD USER';
	var title = "IG NIG. LTD."
	var currentUser = req.session.passport.user.user_id;
	db.query('SELECT * FROM get_away_users WHERE user_id = ?', [currentUser], function ( err, results, fields ){
		if( err ) throw err;
		if(results[0].user_type !== 'Administrator'){
			res.redirect('/404');
		}else{
			res.render('add-user', { 
				title: title,
				mess: message,
				admin: "Is Admin"
			});
		}
	});
});*/
	


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

//add password
router.post('/add-password', [	check('password', 'Password must be between 8 to 15 characters').isLength(8,15),	 check('username', 'Email must be between 8 to 105 characters').isLength(8,105),	check('username', 'Invalid Email').isEmail()], function (req, res, next) {	 
	var password = req.body.password;
    var cpassword = req.body.cpassword;
	var email = req.body.username;
	console.log(req.body)
	var errors = validationResult(req).errors;
	
	if (errors.length > 0){
		res.render('add-password', { mess: 'ADD PASSWORD FAILED', errors: errors,  email: email,  password: password, cpassword: cpassword });
	}else{
		if (cpassword == password){
			bcrypt.hash(password, saltRounds,  function(err, hash){
				db.query("UPDATE get_away_users SET password = ?, verification = ?  WHERE username = ?", [hash, "Yes", email], function(err, results, fields){
					if (err) throw err;
					var success = 'Password Updated Successfully! please login';
					console.log(success)
					req.flash('success', success);
					res.redirect('/login');
				});
			});
		}else{
			var error = "Password does not match"
			console.log(error)
			res.render('add-password', { mess: 'ADD PASSWORD', errors: errors,  email: email, error: error,  password: password, cpassword: cpassword });
		}
	}
});

//post register
router.post('/register', [check('fullname', 'Full Name must be between 8 to 25 characters').isLength(8,25),	check('password', 'Password must be between 8 to 15 characters').isLength(8,15),	 check('email', 'Email must be between 8 to 105 characters').isLength(8,105),	check('email', 'Invalid Email').isEmail(),		check('phone', 'Phone Number must be eleven characters').isLength(11)], function (req, res, next) {	 
	console.log(req.body)
    var password = req.body.password;
    var cpass = req.body.cpass;
    var email = req.body.email;
    var fullname = req.body.fullname;
    
    var phone = req.body.phone;
	
	var errors = validationResult(req).errors;
	
	if (errors.length > 0){
		res.render('register', { mess: 'REGISTRATION FAILED', errors: errors,  email: email, phone: phone, password: password, cpass: cpass, fullname: fullname });
	}else{
		db.query('SELECT user_id FROM get_away_users', function(err, results, fields){
			if (err) throw err;
			if (results.length === 0){
				if (cpass == password){
					bcrypt.hash(password, saltRounds,  function(err, hash){
						db.query('INSERT INTO get_away_users (user_id, full_name, phone, Username, password, user_type) VALUES (?,?,?,?,?,?)', [ 1, fullname, phone, email, hash, 'Administrator'],  function(err, results, fields){
							if (err) throw err;
							var success = 'Registration successful! please login';
							req.flash('success', success);
							res.redirect('/register');
						});
					});
				}else{
					var error = "Password does not match"
					req.flash('error', error);
					res.redirect('/register');	
				}				
			}else{
				var error = "You are not permitted to perform this operation. Please contact the administrator."
				req.flash('error', error);
				res.redirect('/register');				
			}
		});
	}
});


//post log in
router.post('/login', 
	passport.authenticate('local', { 
		failureRedirect: '/login', 
		failureFlash: true 
	}),  function(req, res) {
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
	if (req.isAuthenticated()){
		console.log("auth")
		return next();
	}else{
		res.redirect('/login'); 
	}
  } 
}

function isaRestrictedUser(user){
	db.query('SELECT user_status FROM get_away_users WHERE user_id = ? ', [user], function ( err, results, fields ){
		if( err ) throw err;
		if (results[0].user_status === "Restricted"){
			res.redirect("/login")
		}
	});
}


/*ADMINISTRATOR POST REQUESTS*/

//ADD A USER.
router.post('/add-user', authentificationMiddleware(), [check('fullname', 'Full Name must be between 8 to 25 characters').isLength(8,25),	check('role', 'Role must be between 8 to 15 characters').isLength(8,15),	 check('email', 'Email must be between 8 to 105 characters').isLength(8,105),	check('email', 'Invalid Email').isEmail(),		check('phone', 'Phone Number must be eleven characters').isLength(11)], function(req, res, next) {
	console.log(req.body)
	
	var message = 'ADD USER';
	var title = "IG NIG. LTD."
	var currentUser = req.session.passport.user.user_id;
    var email = req.body.email;
    var fullname = req.body.fullname;
    var role = req.body.role;
    var phone = req.body.phone;
	
	isaRestrictedUser(currentUser)
	db.query('SELECT * FROM get_away_users WHERE user_id = ?', [currentUser], function ( err, results, fields ){
		if( err ) throw err;
		if(results[0].user_type !== 'Administrator'){
			res.redirect('/403');
		}else{
			var errors = validationResult(req).errors;
	
			if (errors.length > 0){
				res.render('admin', { mess: 'OPERATION FAILED', errors: errors,  email: username, phone: phone,  fullname: fullname });
			}else{
				db.query('SELECT user_id FROM get_away_users WHERE phone = ?', [phone], function(err, results, fields){
					if( err ) throw err;
					if(results.length > 0){
						var error = "Phone number is in use already!"
						req.flash('addusererror', error);
						res.redirect('/admin#adduser');
					}else{
						db.query('SELECT user_id, username FROM get_away_users WHERE username = ?', [email], function(err, results, fields){
							if( err ) throw err;
							
							if(results.length > 0){
								var error = "Email is in use already!"
								req.flash('addusererror', error);
								res.redirect('/admin#adduser');
							}else{
								securePin.generatePin(7, function(pin){
									db.query('INSERT INTO get_away_users (username, full_name, phone, user_type, verification_code) VALUES (?,?,?,?,?)', [ email, fullname, phone, role, pin],  function(err, results, fields){
										if (err) throw err; /*{
											var error = "Something went wrong in your entry. Please contact the Administrator(s). You can try changing the Name field first."
											console.log(error)
											req.flash('addusererror', error);
											res.redirect("/admin#adduser")
										}else{*/
											var success = 'User has been Added. Please inform user to create a password';
											console.log(success)
											req.flash('addusersuccess', success);
											res.redirect('/admin#adduser');
										//}
										
									});
								});
							}
						});
					}
				});
			}
		}
	});
});


//ADD Products
router.post('/addproduct', authentificationMiddleware(), function(req, res, next) {
	var currentUser = req.session.passport.user.user_id;
	var name = req.body.name;
	var quantity = req.body.quantity;
	isaRestrictedUser(currentUser)
	db.query('SELECT full_name, user_type FROM get_away_users WHERE user_id = ? ', [currentUser], function ( err, results, fields ){
		if( err ) throw err;
		if (results[0].user_type !== "Administrator"){
			res.redirect("/403")
		}else{
			//get product id
			securePin.generatePin(2, function(pin){
				securePin.generateString(2, charSet, function(str){
					var product_id = name[0] + name[1] + pin + str
					var full_name = results[0].full_name;
					db.query('SELECT name FROM stock_history', function ( err, results, fields ){
						if( err ) throw err;
						if (results.length === 0){
							db.query('INSERT INTO stock_history (history_id, product_id, name, quantity, added_by) VALUES (?,?,?,?,?)', [1, product_id, name, quantity, full_name ], function(err, results, fields){
								if (err) throw err;
								var success = "Product added. Please contact the storekeeper to confirm receipt"
								req.flash('addnewproduct', success);
								res.redirect('/admin/#addnewproduct');
							});
						}else{
							db.query('INSERT INTO stock_history (product_id, name, quantity, added_by) VALUES (?,?,?,?)', [product_id, name, quantity, full_name ], function(err, results, fields){
								if (err) throw err;
								var success = "Product added. Please contact the storekeeper to confirm receipt"
								req.flash('addnewproduct', success);
								res.redirect('/admin/#addnewproduct');
							});
						}
						
					});
				});	
			});	
		}
	});
	
});


//change roles
//DELETE USERS
router.post('/changeroles', authentificationMiddleware(),  [check('name', 'Full Name must be between 8 to 25 characters').isLength(8,25), check('role', 'New Role must be between 8 to 25 characters').isLength(8,25)],	 function(req, res, next) {
	var currentUser = req.session.passport.user.user_id;
	var fullname = req.body.fullname;
	isaRestrictedUser(currentUser)
	
	var name = req.body.name;
	var role = req.body.role;
	
	db.query('SELECT full_name FROM get_away_users', function ( err, results, fields ){
		if( err ) throw err;
		var names = results;
	
		var errors = validationResult(req).errors;
		
		if (errors.length > 0){
			res.render('admin', { admin: "Yes", mess: 'OPERATION FAILED', names:names, errors: errors,  name: name, role: role, changeroleserror: "Yes"});
		}else{
			db.query('SELECT full_name, user_type FROM get_away_users WHERE full_name = ?', [name], function ( err, results, fields ){
				if( err ) throw err;
				var selected_user = results[0];
				
				if(selected_user.user_type == role){
					console.log(error)
					var error = name + " is already a " + role
					req.flash('changeroleserror', error);
					res.redirect('/admin#changeroles');
				}else{
					db.query('UPDATE get_away_users SET user_type = ? WHERE full_name = ? ', [role,  name],  function(err, results, fields){
						if (err) throw err;
						var success = name + " is now a " + role
						console.log(success)
						req.flash('changerolessuccess', success);
						res.redirect('/admin/#changerolesuser');	
					});			
				}
			});		
		}
	});	
});	




//DELETE USERS
router.post('/deleteuser', authentificationMiddleware(), function(req, res, next) {
	var currentUser = req.session.passport.user.user_id;
	var fullname = req.body.fullname;
	db.query('DELETE FROM get_away_users WHERE full_name = ? ', [  fullname],  function(err, results, fields){
		if (err) throw err;
	});
});


/*router.post('/deleteuser', authentificationMiddleware(), function(req, res, next) {
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
});*/
	

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


/* DASHBOARDS*/

// user dashboard
//dashboard
router.get('/dashboard', authentificationMiddleware(), function(req, res, next) {
	var currentUser = req.session.passport.user.user_id;
	db.query('SELECT full_name, user_type FROM get_away_users WHERE user_id = ? ', [currentUser], function ( err, results, fields ){
		if( err ) throw err;
		if (results[0].user_type === "Accountant"){
			//series of command to execute
			
		}else if (results[0].user_type === "Administrator") {
			res.redirect("/admin")
		}else if (results[0].user_type === "Marketer"){
			//series of command to execute
			
		}else if (results[0].user_type === "Store Keeper"){
			//series of command to execute
			
		}			
	});
});

//storekeeper dashboard

//admin dashboard
router.get('/admin', authentificationMiddleware(), function(req, res, next) {
	var title = "IG NIG LTD"
	var message = "ADMIN DASHBOARD"
	var currentUser = req.session.passport.user.user_id;
	db.query('SELECT full_name, user_type FROM get_away_users WHERE user_id = ? ', [currentUser], function ( err, results, fields ){
		if( err ) throw err;
		if (results[0].user_type !== "Administrator"){
			res.redirect("/403")
		}else{
			db.query('SELECT full_name, user_type FROM get_away_users',  function ( err, results, fields ){
				if( err ) throw err;
				var users = results;
				var flashMessages = res.locals.getMessages( );
				if( flashMessages.addusererror ){
					res.render( 'admin', {
						showErrors: true,
						addusererror: flashMessages.addusererror,
						title: title,
						users: users,
						mess: message,
						admin: "is admin"
					});
				}else if ( flashMessages.addusersuccess ){
					res.render( 'admin', {
						showSuccess: true,
						addusersuccess: flashMessages.addusersuccess,
						title: title,
						users: users,
						mess: message,
						admin: "is admin"
					});
				}else if( flashMessages.changeroleserror ){
					res.render( 'admin', {
						showErrors: true,
						changeroleserror: flashMessages.changeroleserror,
						title: title,
						users: users,
						mess: message,
						admin: "is admin"
					});
				}else if ( flashMessages.changerolessuccess ){
					res.render( 'admin', {
						showSuccess: true,
						changerolessuccess: flashMessages.changerolessuccess,
						title: title,
						users: users,
						mess: message,
						admin: "is admin"
					});
				}else{
					res.render('admin', { 
					title: title, 
					users: users,
					mess: message, 
					admin: "is admin" });
				}
			});				
		}
	});
});
	
	
/* ERROR PAGES*/

//error 404
router.get('*', function(req, res, next) {
  res.render('404',{title: 'IG NIGERIA', mess: 'Page not found'});
});

//error 403
router.get('/403', function(req, res, next) {
  res.render('403',{title: 'IG NIGERIA', mess: 'You are not permitted to veiw this page. Please conact your Adminstrator.'});
});

//error wrong
router.get('/wrong', function(req, res, next) {
	var title = "IG NIG LTD"
	var message = 'Something Went Wrong!. Please conact your Adminstrator.'
	const flashMessages = res.locals.getMessages( );
	
	if( flashMessages.error ){
		res.render( 'wrong', {
			showErrors: true,
			error: flashMessages.error,
			title: title,
			mess: message
		});
	}else{
		res.render( 'wrong', {
			title: title,
			mess: message
		});
	}
});


module.exports = router;
