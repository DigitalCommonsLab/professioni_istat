
var H = require('handlebars');
var _ = require('underscore');

var urls = {
	baseUrlPro: window.baseUrlPro || "https://api-test.smartcommunitylab.it/t/sco.cartella/",
	baseUrlDev: window.baseUrlDev || "./data/debug/"
};

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
		//https://github.com/DigitalCommonsLab/isfoldata/blob/master/valori_significativi_skills.csv
		getJobsBySkills: function(o) {
			//remove 'a' from end of codes
			var pars = $.param(o).replace(/[a]/g,'');
			return urls.baseUrlPro+'isfol/1.0.0/jobsBySkills' + '?' + pars;
		},
		getJobsByName: H.compile(urls.baseUrlPro+'isfol/1.0.0/jobsByName?param={{name}}'),
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
		getJobsBySkills: function(o) {
			var pars = '';
			for(var p in o) {
				pars += "_"+p+o[p];
			}
			return urls.baseUrlDev+'jobsBySkills' + '_' + pars + '.json';
		},
		getJobsByName: H.compile(urls.baseUrlDev+'jobsByName.json'),
	});
};

module.exports = {
	
	urls: urls,

	init: function(opts, cb) {

		cb = cb || _.noop;
		
		if(opts && opts.baseUrl) {
			baseUrlPro = opts.baseUrl;
		}

		this._skillsLabels = {};

		this._skillsThresholds = {};

		this._fillCache();

		this.getToken();
		
		cb({urls: this.urls});
	},

	getToken: function() {

		var self = this;

//////////TOKEN
/*
	RESPONSE EXAMPLE:
	access_token=81fcdw16-cbd3-4bfe-af12-fb23d1de16b4&token_type=bearer&expires_in=42885&scope=default
 */
		var aacUrl = 'https://am-dev.smartcommunitylab.it/aac';	
		var clientId = '69b61f8f-0562-45fb-ba15-b0a61d4456f0';
		var redirectUri = location.href;
		//var clientSecret=
		
		var queryString = location.hash.substring(1);
		var params = {};
		var regex = /([^&=]+)=([^&]*)/g, m;

		var passedToken = null;

		if(!sessionStorage.queryString) {
			sessionStorage.queryString = queryString;
		}
		
		console.log('queryString', sessionStorage.queryString);

		while (m = regex.exec(queryString)) {
			params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
			// Try to exchange the param values for an access token.
			if (params['access_token']) {
				passedToken = params['access_token'];
				break;
			}
		}

		if (passedToken == null) {
			self.token = sessionStorage.access_token;
			if (!self.token || self.token == 'null' || self.token == 'undefined') {
				window.location = aacUrl + '/eauth/authorize?response_type=token'+
					'&client_id='+clientId+
					'&redirect_uri='+redirectUri;      
			}
		} else {
			sessionStorage.access_token = passedToken;
			window.location.hash = '';
			window.location.reload();
		}

		console.log('TOKEN',self.token);

		return self.token;
	},

	_fillCache: function() {

		var self = this;

		$.ajax({
			url: config.urls.getAllSkillsLabels(),
			dataType: 'json',
			async: false,
            beforeSend: function (xhr) {
                var token = config.getToken();
                if(token)
                    xhr.setRequestHeader('Authorization', 'Bearer '+token);
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
			url: config.urls.getSkillsThresholds(),
			dataType: 'json',
			async: false,
            beforeSend: function (xhr) {
                var token = config.getToken();
                if(token)
                    xhr.setRequestHeader('Authorization', 'Bearer '+token);
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
