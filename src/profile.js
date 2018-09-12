
var $ = jQuery = require('jquery');
var _ = require('underscore'); 

var config = require('./config');
var utils = require('./utils');

module.exports = {

	init: function(el, opts) {

		var self = this;

		self.$profile = $(el);

		self.data = {
			//
		};

		self.getData('student', function(json) {
			self.$profile.find('#username').text( json.name+' '+json.surname );
		});

		self.$profile.find('#logout').on('click', function(e) {
			e.preventDefault();
			self.logout();
		});
	},
	
	logout: function() {
		delete sessionStorage.access_token;
		location.reload();
	},

	getData: function(name, cb) {
		
		var self = this;

		cb = cb || _.noop;

		if(name==='skills') {

			if(self.data.skills) {
				cb(self.data.skills);
			}
			else
			{
				utils.getData(config.urls.getProfileSkills(), function(json) {

					self.data.skills = [];

					if(!json || !json.skills)
						return self.data.skills;

					_.each(json.skills.acquired, function(ss, id) {

						for(var i in ss) {
							var code = ss[i];

							//ONLY ISFOL CODES "CxxA"
							if(code[0]==='C') {
								self.data.skills.push( code.toLowerCase() );
							}
						}
					});
					
					cb(self.data.skills);
				});	
			}
		}
		else if(name==='student') {
			
			if(self.data.student) {
				cb(self.data.student);
			}
			else
			{
				utils.getData(config.urls.getProfileStudent(), function(json) {

					if(!json) return false;

					self.data.student = json;

					cb(self.data.student);
				});	
			}
		}
	}
};