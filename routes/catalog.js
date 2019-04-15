var express = require('express');
var router = express.Router();


// Require controller modules.
var movie_controller = require('../controllers/movieController');
var director_controller = require('../controllers/directorController');


/// MOVIE ROUTES ///

// GET catalog home page.
router.get('/', movie_controller.index);

// GET request for creating a Movie. NOTE This must come before routes that display Movie (uses id).
router.get('/movie/create', movie_controller.movie_create_get);
// POST request for creating Movie.
router.post('/movie/create', movie_controller.movie_create_post);

// GET request to delete Movie.
router.get('/movie/:id/delete', movie_controller.movie_delete_get);
// POST request to delete Movie.
router.post('/movie/:id/delete', movie_controller.movie_delete_post);

// GET request to update Movie.
router.get('/movie/:id/update', movie_controller.movie_update_get);
// POST request to update Movie.
router.post('/movie/:id/update', movie_controller.movie_update_post);

// GET request for one Movie.
router.get('/movie/:id', movie_controller.movie_detail);

// GET request for list of all Movie items.
router.get('/movies', movie_controller.movie_list);


/// DIRECTOR ROUTES ///

// GET request for creating Director. NOTE This must come before route for id (i.e. display director).
router.get('/director/create', director_controller.director_create_get);
// POST request for creating Director.
router.post('/director/create', director_controller.director_create_post);

// GET request to delete Director.
router.get('/director/:id/delete', director_controller.director_delete_get);
// POST request to delete Director.
router.post('/director/:id/delete', director_controller.director_delete_post);

// GET request to update Director.
router.get('/director/:id/update', director_controller.director_update_get);
// POST request to update Director.
router.post('/director/:id/update', director_controller.director_update_post);

// GET request for one Director.
router.get('/director/:id', director_controller.director_detail);

// GET request for list of all Directors.
router.get('/directors', director_controller.director_list);


module.exports = router;
