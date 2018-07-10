
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

window.allSkillsLabels = {};
window.profileSkills = [];

$(function() {

  config.init({
    baseUrl: "//api-test.smartcommunitylab.it/t/sco.cartella/"
  });

  $.ajax({
    url: config.urls.getAllSkillsLabels(),
    conteType: 'json',
    async: false,
    success: function(json) {
      if(!json['Entries'])
        return null;

      var res = [],
          ee = json['Entries']['Entry'],
          res = _.isArray(ee) ? ee : [ee];
      
      console.log('/allSkillsLabels',res);

      res = _.map(res, function(v) {
        return {
          code: v.cod_etichetta.toLowerCase(),
          desc: v.desc_etichetta,
          desc_long: v.longdesc_etichetta
        };
      });

      allSkillsLabels = _.indexBy(res,'code');
    }
  });

  var $profile = $('#profile'),
      $skills = $('#skills'),
      $select_jobs = $('#select_jobs');

  $select_jobs.on('change', function (e) {
    
    var code = $(this).val();
    
    tree.buildTreeByCode(code);

    table1.update([]);

  });
  
  profile.init('#profile');

  profile.getData('skills', function(skills) {

    //TODO MOVE inside profile.js
    
      console.log('profile skills: ', skills);

    var skillsObj = {};

    for(var i in skills) {
      var code = skills[i],
          label = allSkillsLabels[ code ] && allSkillsLabels[ code ].desc,
          val = SKILLS_THRESHOLD;
      
      skillsObj[code]= val;

      $skills.append('<span class="badge badge-primary">'+label+'</span>');
    }

    profileSkills = _.keys(skillsObj)

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

      //console.log('getJobsBySkills', res);

      $select_jobs.empty();

      _.each(res, function(row) {
        $select_jobs.append('<option value="'+row.code+'">'+(row.code+' '+row.name)+'</option>')
      });

    });

  });


  var $tree = $('#tree');

  var table2 = new table.init('#table2', {
    columns: [
        {
            field: 'val',
            title: 'Importanza'
        },
        {
            field: 'name',
            title: 'Nome'
        },
        {
            field: 'desc',
            title: 'Descrizione'
        }
      ]
  });

  var table1 = new table.init('#table', {
    columns: [
      {
          field: 'id',
          title: 'Isfol'
      },
      {
          field: 'name',
          title: 'Nome'
      },
      {
          field: 'desc',
          title: 'Descrizione'
      }
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
            name: allSkillsLabels[code] ? allSkillsLabels[code].desc : '',
            desc: allSkillsLabels[code] ? allSkillsLabels[code].desc_long : ''
          }
        });

        //remove not important skills for this job
        rows = _.filter(rows, function(row) {
          return row.val > SKILLS_THRESHOLD;
        });

        //remove profile aquired skills
        rows = _.filter(rows, function(row) {
          return !_.contains(profileSkills, row.id);
        });

        console.log('table2',rows);

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
