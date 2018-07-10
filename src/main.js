
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var S = require('underscore.string');
_.mixin({str: S});
var H = require('handlebars');
var d3 = require('d3');
var popper = require('popper.js');
var bt = require('bootstrap');
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');

window._ = _;
window.$ = $;

window.DEBUG_MODE = false;
//load JSON file instead of remote API rest

window.SKILLS_THRESHOLD = 50;

var config = require('./config');

var utils = require('./utils');
var tree = require('./tree');
var table = require('./table');
var profile = require('./profile');

$(function() {

  config.init({
    baseUrl: "//api-test.smartcommunitylab.it/t/sco.cartella/"
  });

  var $profile = $('#profile'),
      $skills = $('#skills'),
      $select_jobs = $('#select_jobs');

  $select_jobs.on('change', function (e) {
    
    var code = $(this).val();
    
    tree.buildTreeByCode(code);

    table1.update([]);
    table2.update([]);

  });
  
  profile.init('#profile');

  profile.getData('skills', function(skills) {

    var skillsObj = {};

    for(var i in skills) {
      var code = skills[i],
          label = profile.skillsLabels[ code ] && profile.skillsLabels[ code ].desc,
          val = SKILLS_THRESHOLD;
      
      skillsObj[code]= val;

      $skills.append('<span class="badge badge-primary">'+label+'</span>');
    }

    $.getJSON(config.urls.getJobsBySkills(skillsObj), function(json) {
      
      if(!json['Entries'])
        return null;

      var res = [],
          ee = json['Entries']['Entry'],
          res = _.isArray(ee) ? ee : [ee];

      res = _.map(res, function(v,k) {
        return {
          code: v['idJobs'],
          name: v['nome']
        }
      });

      $select_jobs.empty();
      _.each(res, function(row) {
        $select_jobs.append('<option value="'+row.code+'">'+(row.code+' '+row.name)+'</option>')
      });

    });

  });

  var $tree = $('#tree');

  var table2 = new table.init('#table2', {
    columns: [
        { field: 'val', title: 'Importanza' },
        { field: 'name', title: 'Nome' },
        { field: 'desc', title: 'Descrizione' }
      ]
  });

  var table1 = new table.init('#table', {
    columns: [
      { field: 'id', title: 'Isfol' },
      { field: 'name', title: 'Nome' },
      { field: 'desc', title: 'Descrizione' }
    ],
    onSelect: function(row) {
      
      var parentId = tree.getIdParent(row.id);

      $.getJSON(config.urls.getSkillsByJob({idJob: parentId }), function(json) {
        
        if(!json['Entries'])
          return null;

        var res = [],
            ee = json['Entries']['Entry'],
            res = _.isArray(ee) ? ee : [ee];

        //TODO filter by API side
        delete res[0].fk_livello5;

        var rows = _.map(res[0], function(val, code) {
          code = code.toLowerCase();
          return {
            id: code,
            val: val,
            name: profile.skillsLabels[code] ? profile.skillsLabels[code].desc : '',
            desc: profile.skillsLabels[code] ? profile.skillsLabels[code].desc_long : ''
          }
        });

        //remove not important skills for this job
        rows = _.filter(rows, function(row) {
          return row.val > SKILLS_THRESHOLD;
        });

        //remove profile aquired skills
        rows = _.filter(rows, function(row) {
          return !_.contains(profile.data.skills, row.id);
        });

        //sort by importance
        rows = _.sortBy(rows, 'val').reverse();

        table2.update(rows);

      });

    }
  });

  tree.init($tree, {
    width: $tree.outerWidth(),
    height: $tree.outerHeight(),
    onSelect: function(node) {

      if(node.level!==5)
          return false;

      tree.buildTreeByCode(node.id);
      
      $.getJSON(config.urls.getJobsByLevel({idLevel5: node.id }), function(json) {
        
        if(!json['Entries'])
          return null;

        var res = [],
            ee = json['Entries']['Entry'],
            res = _.isArray(ee) ? ee : [ee];

        table1.update(_.map(res, function(v) {
          return {
            id: v.id,
            name: v.nome,
            desc: ""
          }
        }));

        table2.update([]);

      });
    }
  });

});  
