var Director = require('../models/director');
var Movie = require('../models/movie');
var async = require('async');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');


// Display list of all Directors.
exports.director_list = function(req, res, next) {

	Director.find()
	.sort([ ['first_name', 'ascending'] ]) // sort by first name, ascending order
	.exec(function(err, directors_list_from_db) {
		if(err) {return next(err);}
			// succesful, so render
			res.render('director_list', {title: 'Director List', director_list: directors_list_from_db, currentUrl: req.originalUrl});
		})

};

// Display detail page for a specific Director.
exports.director_detail = function(req, res, next) {

	async.parallel({
		director: function(callback) {
			// from the movies db, find director by id
			Director.findById(req.params.id)
			.exec(callback)
		},
		directors_movies: function(callback) {
			// from the movies db, find director by id and get the title, plot synopsis and year release of the movies
			Movie.find({'director': req.params.id}, 'title plot_synop release_date')
			.exec(callback)
		},
		director_movies_count: function(callback) {
			// from the movies db, find director by id and count their movies
			Movie.countDocuments({'director': req.params.id})
			.exec(callback)
		}
	}, function(err, results) {
		if(err) {return next(err);} // error in api usage
		if(results.director==null) {
			var err = new Error('Director not found');
			err.status = 404;
			return next(err);
		}
		// Successful, so render
		res.render('director_detail', { title: results.director.name, director: results.director, directors_movies: results.directors_movies, movies_count: results.director_movies_count });
	});

};


// Display Director create form on GET.
exports.director_create_get = function(req, res, next) {

	res.render('director_form', { title: 'Create Director', currentUrl: req.originalUrl });

};

// Handle Director create on POST.
exports.director_create_post = [

// Validate fields.
body('first_name').isLength({min:1}).trim().withMessage('First name is required'),
body('family_name').isLength({min:1}).trim().withMessage('Family name is required'),
body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601()
	.isBefore().withMessage("Date of birth can't be in the future"),
body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().custom( (value, {req}) => {
	// Error if date_of_death is earlier than date_of_birth of date_of_birth is not provided
	if (value < req.body.date_of_birth || !req.body.date_of_birth) {
		throw new Error("Date of death must be later than date of birth");
	} else {
		return value;
	}
}),

// Sanitize fields.
sanitizeBody('first_name').escape(),
sanitizeBody('family_name').escape(),
sanitizeBody('date_of_birth').toDate(),
sanitizeBody('date_of_death').toDate(),

// Process request after validation and sanitization.
(req, res, next) => {

	// Extract the validation errors from a request.
	const errors = validationResult(req);
	if(!errors.isEmpty()) {
		// There are errors. Render form again with sanitized values/errors messages.
		res.render('director_form', { title: 'Create Director', director: req.body, errors: errors.array(), currentUrl: req.originalUrl });
		return;
	} else {
		// Date form is valid. Create a Director object with escaped and trimmed date.
		var director = new Director ({
			first_name: req.body.first_name,
			family_name: req.body.family_name,
			date_of_birth: req.body.date_of_birth,
			date_of_death: req.body.date_of_death
		});
		director.save(function(err) {
			if(err) {return next(err);}
			// Successful - redirect to detail page of the new director
			res.redirect(director.url);
		});
	}

}

];


// Display Director delete form on GET.
exports.director_delete_get = function(req, res, next) {

	async.parallel({
		director: function(callback) {
			Director.findById(req.params.id).exec(callback)
		},
		directors_movies: function(callback) {
			Movie.find({'director': req.params.id}).exec(callback)
		},
	}, function(err, results) {
		if(err) {return next(err);}
		if(results.director==null) {
			res.redirect('/catalog/directors');
		}
		// Successful, so render.
		res.render('director_delete', { title: 'Delete Director: ' + results.director.name, director: results.director, director_movies: results.directors_movies });
	});

};


// Handle Director delete on POST.
exports.director_delete_post = function(req, res, next) {

	async.parallel({
		director: function(callback) {
			Director.findById(req.body.directorid).exec(callback)
		},
		directors_movies: function(callback) {
			Movie.find({'director': req.body.directorid}).exec(callback)
		}
	}, function(err, results) {

		if(err) {return next(err);}
		if(results.directors_movies.length > 0) {
			// Director has 1 or more movies.
			res.render('director_delete', { title: 'Delete Director', director: results.director, director_movies: results.directors_movies });
			return;
		} else {
			// Director has no movies, so safe to delete
			Director.findOneAndDelete({'_id': req.body.directorid}, function deleteDirector(err) {
				if(err) {return next(err);}
				// Success - go to the directors list
				res.redirect('/catalog/directors');
			})
		}

	});

};


// Display Director update form on GET.
exports.director_update_get = function(req, res, next) {

	Director.findById(req.params.id, function(err, director) {
		if(err){return next(err);}
		if(director==null) {
			var err = new Error('Director not found');
			err.status = 404;
			return next(err);
		}
		// Success
		res.render('director_form', {title: 'Update director - ' + director.name, director: director});
	});

};


// Handle Director update on POST.
exports.director_update_post = [

// Validate fields.
body('first_name').isLength({min:1}).trim().withMessage('First name is required'),
body('family_name').isLength({min:1}).trim().withMessage('Family name is required'),
body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

// Sanitize fields.
sanitizeBody('first_name').trim().escape(),
sanitizeBody('family_name').trim().escape(),
sanitizeBody('date_of_birth').toDate(),
sanitizeBody('date_of_death').toDate(),

// Process request after validation and sanitization
(req, res, next) => {
	// Extract the validation errors from a request
	const errors = validationResult(req);
	// Create Director object with escaped and trimmed data (and the old id)
	var director = new Director({
		first_name: req.body.first_name,
		family_name: req.body.family_name,
		date_of_birth: req. body.date_of_birth,
		date_of_death: req.body.date_of_death,
		_id: req.params.id // This is required, or a new id will be assigned
	});
	if(!errors.isEmpty()) {
		// There are errors. Render the form again with sanitized values and error messages.
		res.render('director_form', { title: 'Update Director - ' + director.name, director: director, errors: errors.array() });
		return;
	} else {
		// Data from form is valid. Update the record.
		Director.findByIdAndUpdate(req.params.id, director, {}, function(err, thedirector) {
			if(err) {return next(err);}
			// Successful - redirect to the director's detail page
			res.redirect(thedirector.url);
		});
	}
}

];
