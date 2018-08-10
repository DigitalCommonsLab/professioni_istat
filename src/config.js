
var H = require('handlebars');
var _ = require('underscore');

var urls = {
	baseUrlPro: "https://api-test.smartcommunitylab.it/t/sco.cartella/",
	baseUrlDev: "./data/debug/"
};

if(!window.DEBUG_MODE)	//API defined here: https://docs.google.com/spreadsheets/d/1vXnu9ZW9QXw9igx5vdslzfkfhgp_ojAslS4NV-MhRng/edit#gid=0
{
	_.extend(urls, {
		getProfileSkills: H.compile(urls.baseUrlPro+'asl-stats/1.0/api/statistics/skills/student'),
		//ISFOL API
		getIsfolLevels: H.compile(urls.baseUrlPro+'isfol/1.0.0/istatLevel{{level}}{{#if parentId}}/{{parentId}}{{else}}{{/if}}'),
		getJobsByLevel: H.compile(urls.baseUrlPro+'isfol/1.0.0/jobsByLevel5/{{idLevel5}}'),
		getSkillsByJob: H.compile(urls.baseUrlPro+'isfol/1.0.0/skillsByJob/{{idJob}}'),
		getAllSkillsLabels: H.compile(urls.baseUrlPro+'isfol/1.0.0/allSkillsLabels'),
		getStatsThresholds: H.compile(urls.baseUrlPro+'isfol/1.0.0/getStatsThresholds'),
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
		getProfileSkills: H.compile(urls.baseUrlDev+'student.json'),
		//ISFOL API
		getIsfolLevels: H.compile(urls.baseUrlDev+'istatLevel{{level}}_{{parentId}}.json'),
		getJobsByLevel: H.compile(urls.baseUrlDev+'jobsByLevel5_{{idLevel5}}.json'),
		getSkillsByJob: H.compile(urls.baseUrlDev+'skillsByJob_{{idJob}}.json'),
		getAllSkillsLabels: H.compile(urls.baseUrlDev+'allSkillsLabels.json'),
		getStatsThresholds: H.compile(urls.baseUrlPro+'getStatsThresholds.json'),
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
		if(opts && opts.baseUrl) {
			baseUrlPro = opts.baseUrl;
		}

		this._skillsLabels = {};

		this._skillsThresholds = {};

		$.ajax({
			url: config.urls.getAllSkillsLabels(),
			conteType: 'json',
			
			async: false,
			//TODO remove

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

			  self.skillsLabels = _.indexBy(res,'code');
			}
		});
	},
	skillsLabels: function(code) {
		return this._skillsLabels[ code ];
	},
	skillsThresholds: function(code) {
		return this._skillsThresholds[ code ];
	},	
};
