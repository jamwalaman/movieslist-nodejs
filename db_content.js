#! /usr/bin/env node

console.log('\nThis script populates the database with some content');

// Get arguments passed on command line
var userArgs = process.argv.slice(2);

var async = require('async');
var Movie = require('./models/movie');
var Director = require('./models/director');

var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var directors = [];
var movies = [];


function directorCreate(first_name, family_name, d_birth, d_death, cb) {

	directordetail = {
		first_name: first_name,
		family_name: family_name
	}

	// Date of birth and death will be null if not provided
	if (d_birth != false) {
		directordetail.date_of_birth = d_birth;
	} else {
		directordetail.date_of_birth = null;
	}

	if (d_death != false) {
		directordetail.date_of_death = d_death;
	} else {
		directordetail.date_of_death = null;
	}

	var director = new Director(directordetail);

	director.save(function (err) {
		if (err) {
			cb(err, null)
			return
		}
		console.log('\nNew Director: ' + director);
		directors.push(director)
		cb(null, director)
	});

}


function movieCreate(title, plot_synop, director, release_date, cb) {

	moviedetail = { 
		title: title,
		plot_synop: plot_synop,
		director: director,
		release_date: release_date
	}

	var movie = new Movie(moviedetail);    
	movie.save(function (err) {
		if (err) {
			cb(err, null)
			return
		}
		console.log('\nNew Movie: ' + movie);
		movies.push(movie)
		cb(null, movie)
	});

}


function createDirectors(cb) {

	async.series([
		function(callback) {
			directorCreate("Christopher", "Nolan", "1970-07-30", false, callback);
		},
		function(callback) {
			directorCreate("Peter", "Jackson", "1961-10-31", false, callback);
		},
		function(callback) {
			directorCreate("James", "Cameron", "1954-08-16", false, callback);
		},
		function(callback) {
			directorCreate("Alfred", "Hitchcock", "1899-08-13", "1980-04-29", callback);
		}
		],
		// optional callback
		cb);

}


function createMovies(cb) {

	async.parallel([
		function(callback) {
			movieCreate("Batman Begins", "After training with his mentor, Batman begins his fight to free crime-ridden Gotham City from corruption.", directors[0], "2005-06-15", callback);
		},
		function(callback) {
			movieCreate("The Dark Knight", "When the menace known as the Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham. The Dark Knight must accept one of the greatest psychological and physical tests of his ability to fight injustice.", directors[0], "2008-07-18", callback);
		},
		function(callback) {
			movieCreate("The Lord of the Rings: The Fellowship of the Ring", "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.", directors[1], "2001-12-19", callback);
		},
		function(callback) {
			movieCreate("The Terminator", "A seemingly indestructible android is sent from 2029 to 1984 to assassinate a waitress, whose unborn son will lead humanity in a war against the machines, while a soldier from that war is sent to protect her at all costs.", directors[2], "1984-10-26", callback);
		},
		function(callback) {
			movieCreate("Avatar", "A paraplegic marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.", directors[2], "2009-12-18", callback);
		},
		function(callback) {
			movieCreate("Psycho", "A Phoenix secretary embezzles forty thousand dollars from her employer's client, goes on the run, and checks into a remote motel run by a young man under the domination of his mother.", directors[3], "1960-09-08", callback);
		},
		function(callback) {
			movieCreate("North by Northwest", "A New York City advertising executive goes on the run after being mistaken for a government agent by a group of foreign spies.", directors[3], "1959-09-26", callback);
		}
		],
		// optional callback
		cb);

}

async.series([
	createDirectors,
	createMovies,
	],
// Optional callback
function(err, results) {
	if (err) {
		console.log('FINAL ERR: '+err);
	} else {
		console.log('\nDONE. Added ' + movies.length + ' movies and ' + directors.length + ' directors');
	}
    // All done, disconnect from database
    mongoose.connection.close();
  });
