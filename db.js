var sql = require ('mysql');
var server = require ('./app.js');


var pool  = sql.createConnection({
	host: "localhost",
	user: "root",
	password: '',
	database: "getaway"
});
pool.connect();


pool.query( 'SELECT 1 + 4 AS solution', function ( err, results, fields ){
	if ( err ) throw err;
	console.log( 'solution is ' + results[0].solution);
});


module.exports = pool
