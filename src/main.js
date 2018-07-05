
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

window.DEBUG_MODE = true;
//load JSON file instead of remote API rest

window.SKILLS_THRESHOLD = 50;

var config = require('./config');

var utils = require('./utils');
var tree = require('./tree');
var table = require('./table');
var profile = require('./profile');

var baseUrl = "//api-test.smartcommunitylab.it/t/sco.cartella/";
//             http://api-test.smartcommunitylab.it/t/sco.cartella/asl-stats/1.0/api/statistics/skills/student
//var baseUrlLevels = "http://localhost/smartcommunitylab/t/sco.cartella/isfol/1.0.0/istatLevel";

window.allSkillsLabels = {};
window.profileSkills = [];

$(function() {
  
  var url = DEBUG_MODE ? 'data/debug/allSkillsLabels.json' : baseUrl+'isfol/1.0.0/allSkillsLabels';
  //$.getJSON(url, function(json) {
  $.ajax({
    url: url,
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

  });
  
  profile.init('#profile', {
    baseUrl: baseUrl
  });

  profile.getData('skills', function(skills) {
    
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

    function serializeSkills(o) {
      var ret = '';
      for(var p in o) {
        ret += "_"+p+o[p];
      }
      return ret;
    }
    var paramSkills = $.param(skillsObj).replace(/[a]/g,'');

    var url = DEBUG_MODE ? 'data/debug/jobsBySkills_'+serializeSkills(skillsObj)+'.json' : baseUrl+'isfol/1.0.0/jobsBySkills?'+paramSkills;
    $.getJSON(url, function(json) {
      
      if(!json['Entries'])
        return null;

      var res = [],
          ee = json['Entries']['Entry'],
          res = _.isArray(ee) ? ee : [ee];
      
      res = _.uniq(_.pluck(res,'idJobs'));

      console.log('/jobsBySkills', res);

      $select_jobs.empty();

      _.each(res, function(id) {
        $select_jobs.append('<option value="'+id+'">'+id+'</option>')
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
      //TODO select   
      console.log('table onSelect', row.id);
      
      var level5 = tree.getIdParent(row.id);

      var url = DEBUG_MODE ? 'data/debug/skillsByJob_'+level5+'.json' : baseUrl+'isfol/1.0.0/skillsByJob/'+level5;
      $.getJSON(url, function(json) {
        
        if(!json['Entries'])
          return null;

        var res = [],
            ee = json['Entries']['Entry'],
            res = _.isArray(ee) ? ee : [ee];
        
        console.log('/skillsByJob',res);

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
    baseUrl: baseUrl +'isfol/1.0.0/',
    width: $tree.outerWidth(),
    height: $tree.outerHeight(),
    onSelect: function(node) {
      
      console.log('onSelect node', node)

      if(node.level!==5)
          return false;

      tree.buildTreeByCode(node.id);
      
      var url = DEBUG_MODE ? 'data/debug/jobsByLevel5_'+node.id+'.json' : baseUrl+'isfol/1.0.0/jobsByLevel5/'+node.id;
      $.getJSON(url, function(json) {
        
        if(!json['Entries'])
          return null;

        var res = [],
            ee = json['Entries']['Entry'],
            res = _.isArray(ee) ? ee : [ee];
        
        console.log('jobsByLevel5',res);

        table1.update(_.map(res, function(v) {
          return {
            id: v.id,
            name: v.nome,
            desc: ""
          }
        }));

      });
    }
  });

});  
