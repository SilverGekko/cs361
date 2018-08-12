const express = require('express');
var app = express();
const path = require('path');
const bodyParser = require("body-parser")
const nodemailer = require('nodemailer');
const mysql = require('mysql');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'osugunsafe@gmail.com',
    pass: 'gunsafe1!'
  }
});
app.use(bodyParser.urlencoded({
	extended: true
}));

var db = mysql.createConnection({
	host: "classmysql.engr.oregonstate.edu",
	user: "cs361_pugliesn",
	password: "6575",
	database: "cs361_pugliesn"
});

db.connect(function(err) {
	if (err) throw err;
	console.log("Successfully connected to the database.");
});


//this lets css work
app.use(express.static(path.join(__dirname, "/public")));

app.use(bodyParser.json() );

// viewed at http://localhost:55556
app.get('/', function(req, res) {
     res.sendFile(path.join(__dirname + '/361page.html'));
     });

app.get('/home', function(req, res) {
     res.sendFile(path.join(__dirname + '/361page.html'));
     });

app.get('/gunners', function(req, res) {
	res.sendFile(path.join(__dirname + '/gunnerLogs.html'));
});

app.get('/cameras', function(req, res) {
	res.sendFile(path.join(__dirname + '/cameraFeeds.html'));
});

app.get('/events', function(req, res) {
	res.sendFile(path.join(__dirname + '/eventLogs.html'));
});

app.get('/manualGunner.html', function(req, res) {
	res.sendFile(path.join(__dirname + '/manualGunner.html'));
});

app.get('/361page.html', function(req, res) {
	res.sendFile(path.join(__dirname + '/361page.html'));
});

app.get('/manualEvent.html', function(req, res) {
	res.sendFile(path.join(__dirname + '/manualEvent.html'));
});

app.post('/addEvent', function(req, res) {
	var safezone = req.body.safezone;
	var priority = req.body.priority;
	var message  = req.body.message;

	if (message === "") {
		message = "No additional information provided."
	}

	console.log("post received: %s %s", safezone, priority);

	db.query("SELECT * FROM SafeZone S JOIN Authorities A ON S.Authority = A.Name WHERE S.Name = \"" + safezone  + "\"", function (error, results, fields) {
		if (error) {
			throw error;
			return;
		}
		if (results == undefined || results.length == 0) {
			console.log("No Results");
			return;
		}
		console.log("Results: ", results);

	var timestamp = formatDate(new Date() )
	var info = 'Priority ' + priority +' Incident Report Generated at ' + safezone + ' at ' + timestamp;

	var mailOptions = {
	  from: 'osugunsafe@gmail.com',
	  to: results[0].Email,
	  subject: info,
	  text: info + '\n\nReport: ' + message
	};
	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
		throw error;
		return;
	  } else {
		console.log('Email sent: ' + info.response);
	  }
	});

	db.query("INSERT INTO IncidentReport (SafeZone, Date, Description, Priority) VALUES (\"" + safezone + "\",\"" + timestamp + "\",\"" + message + "\"," + priority + ")" , function (error, results, fields) {
		if (error) { throw error; return; }
		console.log("Results: ", results)
		});
	});
	res.redirect('back');
});

app.post('/addGunner', function(req, res) {
	var gunner = req.body.gunner;
	var guns = req.body.guns;

	if (guns === "") {
		guns = 0
	}

	console.log("post received: %s %s", gunner, guns);

	db.query("INSERT INTO Gunners (Name, RegisteredGuns) VALUES (\"" + gunner + "\"," + guns + ")" , function (error, results, fields) {
		if (error) throw error;
		});
	res.redirect('back');
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

app.listen(55556);
