
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

		self.$modal = $('#privacyModal')
			.on("show.bs.modal", function(e) {
				var $body = $(this).find(".modal-body");
				var url = $body.data('source');
				$body.load( url );
			})
			.on('click','#btn-accept', function(e) {
				//console.log('accept');
				localStorage.setItem('privacyAccept', 'accept');
				self.$modal.modal('hide');
			})
			.on('click','#btn-cancel', function(e) {
				//console.log('cancel');
				self.logout();
			});

		if(localStorage.privacyAccept!=='accept')
		{
			localStorage.setItem('privacyAccept', 'reject');
			if( self.$modal.length && !self.$modal.hasClass('show') ) {
				setTimeout(function() {
					self.$modal.modal({
						show: true, 
						backdrop: 'static',
						keyboard: false
					});
				}, 100);
			}
		}
	},

	isLogged: function() {
		//TODO check if is expired
		return !!sessionStorage.access_token;
	},
	
	logout: function() {
		
		delete sessionStorage.access_token;
		delete localStorage.privacyAccept;

		location.href = window.aacRedirectLogout || 'login.html';
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

					if(json.skills.acquired) {
						_.each(json.skills.acquired, function(ss, id) {
							for(var i in ss) {
								var code = ss[i];
								//ONLY ISFOL CODES "CxxA"
								if(code[0]==='C') {
									self.data.skills.push( code.toLowerCase() );
								}
							}
						});
					}
					
					if(json.skills.learned) {
						_.each(json.skills.learned, function(ss, id) {
							for(var i in ss) {
								var code = ss[i];
								//ONLY ISFOL CODES "CxxA"
								if(code[0]==='C') {
									self.data.skills.push( code.toLowerCase() );
								}
							}
						});		
					}
					
					self.data.skills = _.uniq(self.data.skills);

					//MERGING

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
