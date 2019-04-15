var mongoose = require('mongoose');
var moment = require('moment'); // for date handling
var Schema = mongoose.Schema;

var MovieSchema = new Schema({
	title: {type: String, required: true},
	director: {type: Schema.ObjectId, ref: 'Director', required: true},
	plot_synop: {type: String, required: true},
	release_date: {type: Date, required: true}
});

// Virtual for movie's URL
MovieSchema.virtual('url').get(function() {
	return '/catalog/movie/' + this._id;
});

// Virtual for movie's release date
MovieSchema.virtual('release_date_formatted').get(function() {
	return moment(this.release_date).format('D MMMM YYYY');
});

// Virtual for movie's release year
MovieSchema.virtual('release_year_formatted').get(function() {
	return moment(this.release_date).format('YYYY');
});

// Virtual for movie's release date. Prefills the value of date when updating any movie
MovieSchema.virtual('release_date_for_form').get(function() {
	return moment(this.release_date).format('YYYY-MM-DD');
});

// Export model
module.exports = mongoose.model('Movie', MovieSchema);