var express = require('express');
var router = express.Router();

var config = require('../config/config.js');
var mysql = require('mysql'); 
// set up a connection to use over and over
var connection = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

//After this line runs, we will have a connection to sql
connection.connect();

// include multer module 
var multer = require('multer');
// upload is the multer module with a destination object passed to it
var upload = multer({dest: 'public/images'})
// specify the type for later use, comes from upload
var type = upload.single('imageToUpload');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
	var getImagesQuery = "SELECT * FROM images";

	getImagesQuery = "SELECT * FROM images WHERE id NOT IN" +
		"(SELECT imageID FROM votes WHERE ip = '"+req.ip+"');"

	connection.query(getImagesQuery, (error, results, fields)=>{
		// res.json(results);
		// grab a random image from the results
		var randomIndex = (Math.floor(Math.random() * results.length));
		// res.json(results[randomIndex]);
		if(results.length === 0){
			res.render('index', { title: 'Rate the cars', msg: "noImages" } );
		}else{
			res.render('index', { 
				title: 'Made in \'Merica',
				imageToRender: '/images/'+results[randomIndex].imageUrl,
				imageID: results[randomIndex].id
			});		
		}
	})
});

router.get('/vote/:voteDirection/:imageID', (req, res, next)=>{
	// res.json(req.params.imageID);
	var imageID = req.params.imageID;
	var voteD = req.params.voteDirection;
	if(voteD == 'up'){
		voteD = 1;
	}else{
		voteD = -1;
	}
	var insertVoteQuery = "INSERT INTO votes (ip, imageId, voteDirection) VALUES ('"+req.ip+"',"+imageID+",'"+voteD+"')"
	// res.send(insertVoteQuery);
	connection.query(insertVoteQuery, (error, results, fields)=>{
		if (error) throw error;
		res.redirect('/?vote=success');
	})
});

router.get('/standings', function(req, res, next) {
  res.render('standings', { title: 'Standings' });
});

router.get('/testQ', (req, res, next)=>{
	// var id1 = 1;
	// var id2 = 3;
	// var query = "SELECT * FROM images WHERE id > ? AND id < ?";
	// connection.query(query, [id1, id2], (error, results, fields)=>{
	// 	res.json(results);
	// })
	var imageIdVoted = 3;
	var voteDirection = 'cool';
	var insertQuery = "INSERT INTO votes (ip, imageId, voteDirection) VALUES (?,?,)"
	connection.query(insertQuery, [req.ip, imageIdVoted, voteDirection], (error, results, fields)=>{
		var query = "SELECT * FROM votes";
		connection.query(query, (error, results, fields)=>{
			res.json(results);
		});
	})
});

router.get('/uploadImage', (req, res, next)=>{
	res.render('uploadImage', {});
});

router.post('/formSubmit', type, (req, res, next)=>{
	// Save the path where teh file is at temporarily
	var tmpPath = req.file.path;
	// Set up the target path + the orig name ofthe file
	var targetPath = 'public/images/'+req.file.originalname;
	// use fs module to read the file then write it to the correct place
	fs.readFile(tmpPath, (error, fileContents)=>{
		fs.writeFile(targetPath, fileContents, (error)=>{
			if (error) throw error;
			var insertQuery = "INSERT INTO images (imageUrl) VALUE (?)";
			connection.query(insertQuery, [req.file.originalname], (dberror, results, fields)=>{
				if (dberror) throw dberror;
				res.redirect('/?file="uploaded');
			})
			
		})
	})
	// res.json(req.file);
});

module.exports = router;