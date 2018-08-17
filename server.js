const express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({ defaultLayout: 'main' });
const bodyParser = require("body-parser")
var request = require('request');
const mysql = require('mysql');
var exec = require('child_process').exec;
var pool = mysql.createPool({
	host: "classmysql.engr.oregonstate.edu",
	user: "cs361_pugliesn",
	password: "6575",
	database: "cs361_pugliesn"
});

app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

const nodemailer = require('nodemailer');
const path = require('path');
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'osugunsafe@gmail.com',
		pass: 'gunsafe1!'
	}
});


// db.connect(function (err) {
// 	if (err) throw err;
// 	console.log("Successfully connected to the database.");
// });


//this lets css work
app.use(express.static(path.join(__dirname, "/public")));


// viewed at http://localhost:55556
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/361page.html'));
});

app.get('/home', function (req, res) {
	res.sendFile(path.join(__dirname + '/361page.html'));
});

app.get('/gunners', function (req, res,next) {
	var context = {};

	pool.query('SELECT * FROM Gunners', function (error, results, fields) {
		if (error) {
			next(error);
			return;
		}
		//console.log("Get Gunnerlog:\n" + table);
		context.guns = results;
		res.render('gunnerLogs', context);
	});
});

app.get('/cameras', function (req, res) {
	//express images
	app.use(express.static(path.join(__dirname, "/images/")));
	res.sendFile(path.join(__dirname + '/cameras.html'));
});

app.get('/camerafeeds', function (req, res) {
	res.sendFile(path.join(__dirname + '/cameraFeeds.html'));
});

app.get('/events', function (req, res, next) {
	var context = {};

	pool.query('SELECT * FROM IncidentReport', function (error, results, fields) {
		if (error) {
			next(error);
			return;
		}
		context.incident = results;
		res.render('eventLogs', context);
	});
});

app.get('/manualGunner.html', function (req, res) {
	res.sendFile(path.join(__dirname + '/manualGunner.html'));
});

app.get('/361page.html', function (req, res) {
	res.sendFile(path.join(__dirname + '/361page.html'));
});

app.get('/manualEvent.html', function (req, res) {
	res.sendFile(path.join(__dirname + '/manualEvent.html'));
});

app.post('/addEvent', function (req, res) {
	var safezone = req.body.safezone;
	var priority = req.body.priority;
	var message = req.body.message;

	if (message === "") {
		message = "No additional information provided."
	}

	console.log("post received: %s %s", safezone, priority);

	pool.query("SELECT * FROM SafeZone S JOIN Authorities A ON S.Authority = A.Name WHERE S.Name = \"" + safezone + "\"", function (error, results, fields) {
		if (error) {
			throw error;
			return;
		}
		if (results == undefined || results.length == 0) {
			console.log("No Results");
			return;
		}
		console.log("Results: ", results);

		var timestamp = formatDate(new Date())
		var info = 'Priority ' + priority + ' Incident Report Generated at ' + safezone + ' at ' + timestamp;

		var mailOptions = {
			from: 'osugunsafe@gmail.com',
			to: results[0].Email,
			subject: info,
			text: info + '\n\nReport: ' + message
		};
		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				throw error;
				return;
			} else {
				console.log('Email sent: ' + info.response);
			}
		});

		pool.query("INSERT INTO IncidentReport (SafeZone, Date, Description, Priority) VALUES (\"" + safezone + "\",\"" + timestamp + "\",\"" + message + "\"," + priority + ")", function (error, results, fields) {
			if (error) { throw error; return; }
			console.log("Results: ", results)
		});
	});
	res.redirect('back');
});

app.post('/addGunner', function (req, res) {
	var gunner = req.body.gunner;
	var guns = req.body.guns;

	if (guns === "") {
		guns = 0
	}

	console.log("post received: %s %s", gunner, guns);

	pool.query("INSERT INTO Gunners (Name, RegisteredGuns) VALUES (\"" + gunner + "\"," + guns + ")", function (error, results, fields) {
		if (error) throw error;
	});
	res.redirect('back');
});

app.get('/checkguns', function (req, res) {
	var run = check_guns_before(check_guns_after, compare_output, res);
});


function formatDate(date) {
	var monthNames = [
		"January", "February", "March",
		"April", "May", "June", "July",
		"August", "September", "October",
		"November", "December"
	];

	var day = date.getDate();
	var monthIndex = date.getMonth();
	var year = date.getFullYear();
	var hour = date.getHours();
	var minute = date.getMinutes();
	var seconds = date.getSeconds();

	return day + ' ' + monthNames[monthIndex] + ' ' + year + ' ' + hour + ':' + minute + ':' + seconds;
}

var exec = require('child_process').exec;

function check_guns_before(callback1, callback2, res){
	exec("cd ./imageTrainer; rm -f out_image*");
    exec("ls ./imageTrainer", function(error, stdout, stderr){ callback1(stdout, callback2, res); });
};

function check_guns_after(old_stdout, callback, res){
    exec("cd ./imageTrainer; run_matlab"); 
	setTimeout(function() {
    	exec("ls ./imageTrainer", function(error, stdout, stderr){ 
			callback(old_stdout, stdout, res);	
		});
	}, 45000);
};

function compare_output(before, after, res) {
	if (before == after) {
		console.log("same");
		res.sendFile(path.join(__dirname + '/noGuns.html'));
	} else {
		res.sendFile(path.join(__dirname + '/foundGuns.html'));
		console.log("not same");
	//var safezone = req.body.safezone;
	//var priority = req.body.priority;
	//var message = req.body.message;

	var safezone = "Harvest Moon Farms";
	var priority = 1;
	var message = "Guns found in one or more pictures. Investigate further.";

	if (message === "") {
		message = "No additional information provided."
	}

	console.log("post received: %s %s", safezone, priority);

	pool.query("SELECT * FROM SafeZone S JOIN Authorities A ON S.Authority = A.Name WHERE S.Name = \"" + safezone + "\"", function (error, results, fields) {
		if (error) {
			throw error;
			return;
		}
		if (results == undefined || results.length == 0) {
			console.log("No Results");
			return;
		}
		console.log("Results: ", results);

		var timestamp = formatDate(new Date())
		var info = 'Priority ' + priority + ' Incident Report Generated at ' + safezone + ' at ' + timestamp;

		var mailOptions = {
			from: 'osugunsafe@gmail.com',
			to: results[0].Email,
			subject: info,
			text: info + '\n\nReport: ' + message
		};
		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				throw error;
				return;
			} else {
				console.log('Email sent: ' + info.response);
			}
		});

		pool.query("INSERT INTO IncidentReport (SafeZone, Date, Description, Priority) VALUES (\"" + safezone + "\",\"" + timestamp + "\",\"" + message + "\"," + priority + ")", function (error, results, fields) {
			if (error) { throw error; return; }
			console.log("Results: ", results)
		});
	});
	//res.redirect('back');
	}
};

function parse_data(data) {
	console.log(data);
};

//check_guns_before(check_guns_after, compare_output);

app.listen(55556);
