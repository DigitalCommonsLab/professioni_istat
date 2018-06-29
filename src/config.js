
var H = require('handlebars');

var baseUrl = "https://api-test.smartcommunitylab.it/t/sco.cartella/isfol/1.0.0/";

module.exports = {
	urls: {
		istatLevel: H.compile(baseUrl+'istatLevel{{level}}/{{id}}'),
		jobsByLevel5: H.compile(baseUrl+"/jobsByLevel5/{{idLevel5}}"),
		skillsByJob: H.compile(baseUrl+"/skillsByJob/{{idJob}}"),
		allSkillsLabels: H.compile(baseUrl+"/allSkillsLabels"),
		jobsBySkills: H.compile(baseUrl+"/jobsBySkills?c1={{value1}}&c2={{value2}}")
	}
};
