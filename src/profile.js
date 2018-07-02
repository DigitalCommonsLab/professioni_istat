
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var utils = require('./utils');

module.exports = {

	init: function(el, opts) {

		var self = this;

		this.profile = $(el);

		this.data = {};

		this.baseUrl = opts.baseUrl+'asl-stats/1.0/api/statistics/';

/*	//TODO
	if(DEBUG_MODE)
			url = 'data/debug/istatLevel' + (code ? (code.split('.').length+1)+"_"+code : '1')+'.json';
		else
			url = opts.baseUrl + 'istatLevel' + (code ? (code.split('.').length+1)+"/"+code : '1');
*/
	},

	getData: function(name, cb) {
		
		var self = this;

		if(name==='skills') {

			var skillsUrl = this.baseUrl+'skills/student';

			if(self.data.skills)
				cb(self.data.skills);
			else
			{
				$.getJSON(skillsUrl, function(json) {

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