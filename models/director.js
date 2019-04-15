var mongoose = require('mongoose');
var moment = require('moment'); // for date handling
var Schema = mongoose.Schema;

var DirectorSchema = new Schema({
	first_name: {type: String, required: true, max: 100},
	family_name: {type: String, required: true, max: 100},
	date_of_birth: {type: Date},
	date_of_death: {type: Date},
});


// Virtual for director's full name
DirectorSchema
.virtual('name')
.get(function () {
	return this.first_name + ' ' + this.family_name;
});


// Virtual for director's lifespan
DirectorSchema
.virtual('lifespan')
.get(function () {
	var lifespan_string = '';
	if(this.date_of_birth) {
		lifespan_string = moment(this.date_of_birth).format('Do MMMM YYYY');
	}
	lifespan_string += ' - ';
	if(this.date_of_death) {
		lifespan_string += moment(this.date_of_death).format('Do MMMM YYYY');
	}
	return lifespan_string;
});


// Calculate age
DirectorSchema
.virtual('age')
.get(function() {
	var age;

	var dob_year = moment(this.date_of_birth).format('YYYY');
	var dob_month = moment(this.date_of_birth).format('M') - 1;
	var dob_day = moment(this.date_of_birth).format('D');
	var dob = moment([dob_year, dob_month, dob_day]);

	if(!this.date_of_death) {
		// only date of birth is provided
		var current_year = moment().format('YYYY');
		var current_month = moment().format('M') - 1;
		var current_day = moment().format('D');
		
		var today = moment([current_year, current_month, current_day]);
		age = today.diff(dob, 'years');
	} else {
		// both date of birth and date of death is provided
		var died_year = moment(this.date_of_death).format('YYYY');
		var died_month = moment(this.date_of_death).format('M') - 1;
		var died_day = moment(this.date_of_death).format('D');
		var died = moment([died_year, died_month, died_day]);
		
		age = died.diff(dob, 'years');
	}

	return age;
})


// Virtual for director's URL
DirectorSchema
.virtual('url')
.get(function () {
	return '/catalog/director/' + this._id;
});


// Prefills the value of date_of_birth field when updating a director's detail
DirectorSchema.virtual('date_of_birth_for_form').get(function() {
	return moment(this.date_of_birth).format('YYYY-MM-DD');
});

// Prefills the value of date_of_death field when updating a director's detail
DirectorSchema.virtual('date_of_death_for_form').get(function() {
	return moment(this.date_of_death).format('YYYY-MM-DD');
});


// Export model
module.exports = mongoose.model('Director', DirectorSchema);
