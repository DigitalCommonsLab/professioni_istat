
var H = require('handlebars');

var baseUrl = "https://api-test.smartcommunitylab.it/t/sco.cartella/isfol/1.0.0/";

//API defined here: https://docs.google.com/spreadsheets/d/1vXnu9ZW9QXw9igx5vdslzfkfhgp_ojAslS4NV-MhRng/edit#gid=0
//
//
var prod_tmpls = {
	
	getIsfolLevels: H.compile(baseUrl+'istatLevel{{level}}/{{parentId}}'),

	getJobsByLevel: H.compile(baseUrl+'jobsByLevel5/{{idLevel5}}'),
	
	getSkillsByJob: H.compile(baseUrl+'skillsByJob/{{idJob}}'),
	
	getAllSkillsLabels: H.compile(baseUrl+'allSkillsLabels'),
	
	getJobsBySkills: H.compile(baseUrl+'jobsBySkills?c1={{value1}}&c2={{value2}}')
};

module.exports = {
	urls: window.DEBUG_MODE ? dev_tmpls : prod_tmpls
};
