var Movie = require('../models/movie');
var Director = require('../models/director');
var async = require('async');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');


// Home page
exports.index = function(req, res) {

	async.parallel({
		movie_count: function(callback) {
			Movie.countDocuments({}, callback);
		}
	}, function(err, results) {
		res.render('index', {title: 'Home', error: err, data: results, currentUrl: req.originalUrl});
	});
	
};


// Display list of all movies.
exports.movie_list = function(req, res, next) {

	Movie.find({}, 'title director plot_synop release_date') // get the title, director, plot_synop and release_date from movies
	.sort([ ['title', 'ascending'] ]) // sort by first name, ascending order
	.populate('director')
	.exec(function(err, movies_list_from_db) {
		if(err) {return next(err);}
		// Successful, so render
		res.render('movie_list', { title: 'All Movies', movie_list: movies_list_from_db, currentUrl: req.originalUrl});
	})

};


// Display detail page for a specific movie.
exports.movie_detail = function(req, res, next) {
	
	async.parallel({
		movie: function(callback) {
			Movie.findById(req.params.id)
			.populate('director')
			.exec(callback);
		},
	}, function(err, results) {
		if(err) {return next(err);}
		if(results.movie==null) { //No results
			var err = new Error('Movie not found');
			err.status = 404;
			return next(err);
		}
		// Successful, so render
		res.render('movie_detail', {title: results.movie.title+' ('+results.movie.release_year_formatted+')', movie: results.movie, currentUrl: req.originalUrl});
	});
	
};


// Display movie create form on GET.
exports.movie_create_get = function(req, res, next) {

		// Get all directors
		async.parallel({
			directors: function(callback) {
				Director.find(callback).sort([ ['first_name', 'ascending'] ]);
			},
		}, function(err, results) {
			if(err) {return next(err);}
			res.render('movie_form', {title: 'Create movie', directors: results.directors, currentUrl: req.originalUrl});
		})

	};


// Handle movie create on POST.
exports.movie_create_post = [

	// Validate that the title field is not empty
	body('title', 'Movie name is required').isLength({ min: 1 }).trim(),
	body('director', 'Director name is required').isLength({ min: 1 }).trim(),
	body('plot', 'Plot is required').isLength({ min: 1 }).trim(),
	body('release_date', 'Invalid release date').isISO8601(),

	// Sanitize fields
	sanitizeBody('title').escape(),
	sanitizeBody('director').escape(),
	sanitizeBody('plot').escape(),
	sanitizeBody('release_date').toDate(),

	// Process request after validation and sanitization.
	(req, res, next) => {

	    // Extract the validation errors from a request.
	    const errors = validationResult(req);
	    // Create a movie object with escaped and trimmed data.
	    var movie = new Movie({
	    	title: req.body.title,
	    	director: req.body.director,
	    	plot_synop: req.body.plot,
	    	release_date: req.body.release_date
	    });
	    if(!errors.isEmpty()) {
	    	// There are errors. Render form again with sanitized values/error messages.
	    	// Get all directors for form
	    	async.parallel({
	    		directors: function(callback) {
	    			Director.find(callback);
	    		},
	    	}, function(err, results) {
	    		if(err) {return next(err);}
	    		res.render('movie_form', {title: 'Create movie', directors: results.directors, movie: movie, errors: errors.array(), currentUrl: req.originalUrl});
	    	});
	    	return;
	    } else {
	    	// Data is valid. Check if movie with the same name exist
	    	Movie.findOne({'title': req.body.title}).exec(function(err, found_movie) {
	    		if(err) {return next(err);}
	    		if(found_movie) {
	    			// Movie found, redirect to its detail page
	    			res.redirect(found_movie.url);
	    		} else {
	    			movie.save(function(err) {
	    				if(err) {return next(err);}
	    				// Movie saved. Redirect to its detail page
	    				res.redirect(movie.url);
	    			});
	    		}
	    	});
	    }

	  }

	  ];


// Display movie delete form on GET.
exports.movie_delete_get = function(req, res, next) {

	async.parallel({
		movie: function(callback) {
			Movie.findById(req.params.id).exec(callback);
		},
	}, function(err, results) {
		if(err) {return next(err);}
		if(results.movie==null) { // No results
			res.redirect('/catalog/movies');
		}
		// Successful, so render
		res.render('movie_delete', {title: 'Delete movie - ' + results.movie.title+' ('+results.movie.release_year_formatted+')', movie: results.movie, currentUrl: req.originalUrl});
	});
	
};


// Handle movie delete on POST.
exports.movie_delete_post = function(req, res, next) {
	
	// Assume valid movie id in field
	Movie.findOneAndDelete({'_id': req.body.id}, function deleteMovie(err) {
		if(err) {return next(err);}
		// Success, so redirect to list of Movies
		res.redirect('/catalog/movies');
	});

};


// Display movie update form on GET.
exports.movie_update_get = function(req, res, next) {
	
	// Get movie and director
	async.parallel({
		movie: function(callback) {
			Movie.findById(req.params.id).populate('director').exec(callback);
		},
		directors: function(callback) {
			Director.find(callback);
		},
	}, function(err, results) {
		if(err) {return next(err);}
		if(results.movie==null) {
			var err = new Error('Movie not found');
			err.status = 404;
			return next(err);
		}
		// Success
		res.render('movie_form', {title: 'Update movie - ' + results.movie.title, movie: results.movie, directors: results.directors, currentUrl: req.originalUrl});
	});

};


// Handle movie update on POST.
exports.movie_update_post = [

	// Validate that the title field is not empty.
	body('title', 'Movie name is required').isLength({min: 1}).trim(),
	body('director', 'Director name is required').isLength({min: 1}).trim(),
	body('plot', 'Plot is required').isLength({min: 1}).trim(),
	body('release_date', 'Invalid release date').isISO8601(),

	// Sanitize fields
	sanitizeBody('title').escape(),
	sanitizeBody('director').escape(),
	sanitizeBody('plot').escape(),
	sanitizeBody('release_date').toDate(),

	(req, res, next) => {

		// Extract the validation errors from a request.
		const errors = validationResult(req);
		// Create Movie object with escaped and trimmed data (and the old id)
		var movie = new Movie({
			title: req.body.title,
			director: req.body.director,
			plot_synop: req.body.plot,
			release_date: req.body.release_date,
			_id: req.params.id
		});
		if(!errors.isEmpty()) {
			// There are errors. Render the form again with sanitized values and error messages.
			async.parallel({
				directors: function(callback) {
					Director.find(callback);
				},
			}, function(err, results) {
				if(err) {return next(err);}
				res.render('movie_form', {title: 'Update movie - ' + movie.title, movie: movie, directors: results.directors, errors: errors.array(), currentUrl: req.originalUrl});
			});
			return;
		} else {
			Movie.findByIdAndUpdate(req.params.id, movie, {}, function(err, themovie) {
				// Successful - redirect to movie detail page
				res.redirect(themovie.url);
			});
		}

	}

	];