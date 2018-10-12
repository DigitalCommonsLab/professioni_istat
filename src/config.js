
var $ = jQuery = require('jquery');
var H = require('handlebars');
var _ = require('underscore');


var urls = {
		baseUrlDev: window.baseUrlDev || "./data/debug/",
		baseUrlPro: window.baseUrlPro || "https://api-dev.smartcommunitylab.it/t/sco.cartella/",
		aacBaseUrl: window.aacBaseUrl || "https://am-dev.smartcommunitylab.it/aac/eauth/authorize?",
		aacRedirect: window.aacRedirect || location.href,
		aacRedirectLogout: window.aacRedirectLogout || 'login.html'
	},
	auth = {
		enabled: true, 
		clientId: window.aacClientId || '69b61f8f-0562-45fb-ba15-b0a61d4456f0',
		//clientSecret: window.aacClientSecret || null,
		matchPath: window.aacMatchPath || "/(asl|cs)-stats/"	//domain to send auth header
	};

urls.aacUrl = H.compile(urls.aacBaseUrl + 'response_type=token'+
	'&client_id='+auth.clientId+
	'&redirect_uri='+urls.aacRedirect);

if(!window.DEBUG_MODE)	//API defined here: https://docs.google.com/spreadsheets/d/1vXnu9ZW9QXw9igx5vdslzfkfhgp_ojAslS4NV-MhRng/edit#gid=0
{
	_.extend(urls, {
		getProfileStudent: H.compile(urls.baseUrlPro+'cs-stats/1.0/api/statistics/profile/student'),
		getProfileSkills: H.compile(urls.baseUrlPro+'asl-stats/1.0/api/statistics/skills/student'),
		//ISFOL API
		getIsfolLevels: H.compile(urls.baseUrlPro+'isfol/1.0.0/istatLevel{{level}}{{#if parentId}}/{{parentId}}{{else}}{{/if}}'),
		getJobsByLevel: H.compile(urls.baseUrlPro+'isfol/1.0.0/jobsByLevel5/{{idLevel5}}'),
		getSkillsByJob: H.compile(urls.baseUrlPro+'isfol/1.0.0/skillsByJob/{{idJob}}'),
		getAllSkillsLabels: H.compile(urls.baseUrlPro+'isfol/1.0.0/allSkillsLabels'),
		getSkillsThresholds: H.compile(urls.baseUrlPro+'isfol/1.0.0/getStatsThresholds'),
		getJobsByName: H.compile(urls.baseUrlPro+'isfol/1.0.0/jobsByName?param={{name}}'),
		getJobsBySkills: function(o) {
			//remove 'a' from end of codes
			var pars = $.param(o).replace(/[a]/g,'');
			return urls.baseUrlPro+'isfol/1.0.0/jobsBySkills' + '?' + pars;
		}
	});
}
else	//DEBUG API via json files in
{
	_.extend(urls, {
		getProfileStudent: H.compile(urls.baseUrlDev+'statistics_profile_student.json'),
		getProfileSkills: H.compile(urls.baseUrlDev+'statistics_skills_student.json'),
		//ISFOL API
		getIsfolLevels: H.compile(urls.baseUrlDev+'istatLevel{{level}}_{{parentId}}.json'),
		getJobsByLevel: H.compile(urls.baseUrlDev+'jobsByLevel5_{{idLevel5}}.json'),
		getSkillsByJob: H.compile(urls.baseUrlDev+'skillsByJob_{{idJob}}.json'),
		getAllSkillsLabels: H.compile(urls.baseUrlDev+'allSkillsLabels.json'),
		getSkillsThresholds: H.compile(urls.baseUrlPro+'getStatsThresholds.json'),
		getJobsByName: H.compile(urls.baseUrlDev+'jobsByName.json'),
		getJobsBySkills: function(o) {
			var pars = '';
			for(var p in o) {
				pars += "_"+p+o[p];
			}
			return urls.baseUrlDev+'jobsBySkills' + '_' + pars + '.json';
		}
	});
};

module.exports = {

	auth: auth,
	
	urls: urls,

	init: function(opts, cb) {

		var self = this;

		cb = cb || _.noop;

		self.token = null;
		self._skillsLabels = {};
		self._skillsThresholds = {};

		self.getToken(function(t) {

			self._loadLabels();
		});
		
		if(_.isFunction(cb))
			cb({urls: self.urls});
	},

    hashParams: function(key) {
        //https://stackoverflow.com/questions/8486099/how-do-i-parse-a-url-query-parameters-in-javascript
        var query = location.hash.substr(1);
        var result = {};
        query.split("&").forEach(function(part) {
            var item = part.split("=");
            result[ item[0] ] = decodeURIComponent( item[1] );
        });
        return key ? result[key] : result;
    },

	getToken: function(cb) {

		cb = cb || _.noop;

		var self = this;
		/*
			RESPONSE EXAMPLE:
			access_token=81fcdw16-cbd3-4bfe-af12-fb23d1de16b4&token_type=bearer&expires_in=42885&scope=default
		 */
		
		var passedToken = self.hashParams('access_token');

		if (!passedToken) {

			self.token = sessionStorage.access_token;

			if (!self.token || self.token == 'null' || self.token == 'undefined') {
				window.location = self.urls.aacUrl();   
			}
			else
				cb(self.token);

		} else {
			sessionStorage.access_token = passedToken;
			window.location.hash = '';
			window.location.reload();
		}

		return self.token;
	},

	_loadLabels: function() {

		var self = this;

		$.ajax({
			url: self.urls.getAllSkillsLabels(),
			dataType: 'json',
			async: false,
            beforeSend: function (xhr) {
                //var token = self.getToken();
                if(self.token)
                    xhr.setRequestHeader('Authorization', 'Bearer '+self.token);
            },
			success: function(json) {
			  if(!json['Entries'])
			    return null;

			  var res = [],
			      ee = json['Entries']['Entry'],
			      res = _.isArray(ee) ? ee : [ee];

			  res = _.map(res, function(v) {
			    return {
			      code: v.cod_etichetta.toLowerCase(),
			      desc: v.desc_etichetta,
			      desc_long: v.longdesc_etichetta
			    };
			  });

			  self._skillsLabels = _.indexBy(res,'code');
			}
		});

		$.ajax({
			url: self.urls.getSkillsThresholds(),
			dataType: 'json',
			async: false,
            beforeSend: function (xhr) {
                //var token = self.getToken();
                if(self.token)
                    xhr.setRequestHeader('Authorization', 'Bearer '+self.token);
            },
			success: function(json) {
			  if(!json['Entries'])
			    return null;

			  var res = [],
			      ee = json['Entries']['Entry'],
			      res = _.isArray(ee) ? ee : [ee];

			  res = _.map(res[0], function(v,k) {
			    return {
			      code: k.toLowerCase(),
			      val: parseFloat(v)
			    };
			  });

			  self._skillsThresholds = _.indexBy(res,'code');
			}
		});
	},

	skillsLabels: function(code, prop) {
		prop = prop || 'desc';
		return this._skillsLabels[ code ] ? this._skillsLabels[ code ][ prop ] : '';
	},
	
	skillsThresholds: function(code, prop) {
		prop = prop || 'val';
		return this._skillsThresholds[ code ] ? this._skillsThresholds[ code ][ prop ] : 50;
	}
};
