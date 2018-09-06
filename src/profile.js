
var $ = jQuery = require('jquery');
var _ = require('underscore'); 

var config = require('./config');
var utils = require('./utils');

module.exports = {

	init: function(el, opts) {

		var self = this;

		this.profile = $(el);

		this.data = {};
	},

	getData: function(name, cb) {
		
		var self = this;

		if(name==='skills') {

			if(self.data.skills) {
				cb(self.data.skills);
			}
			else
			{
				$.getJSON(config.urls.getProfileSkills(), function(json) {

					self.data.skills = [];

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
	}
};