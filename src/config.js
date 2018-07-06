
var H = require('handlebars');

var baseUrlPro = "https://api-test.smartcommunitylab.it/t/sco.cartella/";
var baseUrlDev = "./data/debug/";

if(!window.DEBUG_MODE)	//API defined here: https://docs.google.com/spreadsheets/d/1vXnu9ZW9QXw9igx5vdslzfkfhgp_ojAslS4NV-MhRng/edit#gid=0
{
	urls = {
		getProfileSkills: H.compile(baseUrlPro+'skills/student'),
		//ISFOL API
		getJobsByLevel: H.compile(baseUrlPro+'isfol/1.0.0/jobsByLevel5/{{idLevel5}}'),
		getSkillsByJob: H.compile(baseUrlPro+'isfol/1.0.0/skillsByJob/{{idJob}}'),
		getAllSkillsLabels: H.compile(baseUrlPro+'isfol/1.0.0/allSkillsLabels'),
		getJobsBySkills: function(o) {
			//remove 'a' from end of codes
			var pars = $.param(o).replace(/[a]/g,'');
			return baseUrlPro+'isfol/1.0.0/jobsBySkills' + '?' + pars;
		}
	};
}
else	//DEBUG API via json files in
{
	urls = {
		getProfileSkills: H.compile(baseUrlDev+'student.json'),
		//ISFOL API
		getIsfolLevels: H.compile(baseUrlDev+'istatLevel{{level}}_{{parentId}}.json'),
		getJobsByLevel: H.compile(baseUrlDev+'jobsByLevel5_{{idLevel5}}.json'),
		getSkillsByJob: H.compile(baseUrlDev+'skillsByJob_{{idJob}}.json'),
		getAllSkillsLabels: H.compile(baseUrlDev+'allSkillsLabels.json'),
		getJobsBySkills: function(o) {
			var pars = '';
			for(var p in o) {
				pars += "_"+p+o[p];
			}
			return baseUrlDev+'jobsBySkills' + '_' + pars + '.json';
		}
	};
};

module.exports = {
	urls: urls
};
