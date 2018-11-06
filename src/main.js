
var pkg = require('../package.json'); 

var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var S = require('underscore.string');
_.mixin({str: S});
var H = require('handlebars');
var d3 = require('d3');
var popper = require('popper.js');
var bt = require('bootstrap');

//require('../node_modules/bootstrap/dist/css/bootstrap.min.css');

var btlist = require('bootstrap-list-filter');

window._ = _;
window.$ = $;

window.DEBUG_MODE = false;
//load JSON file instead of remote API rest

var config = require('./config');

var utils = require('./utils');
var tree = require('./tree');
var table = require('./table');
var profile = require('./profile');

window.config = config;
window.profile = profile;
window.utils = utils;

$(function() {

  $('#version').text('v'+pkg.version);


  if($('body').is('#page_login')) return;
  
  config.init();

  var $skills = $('#skills'),
      $selectjobs = $('#selectjobs');

  $('#searchlist').on('click','.list-group-item', function(e) {
    e.preventDefault();

    $that = $(this);
    $that.parent().find('a').removeClass('active');
    $that.addClass('active');

    var code = $that.data('id');

    tree.buildTreeByCode(code);
    tree.onSelect({level:5, id: code});

    table1.reset();
    table2.reset();
    
  })
  .btsListFilter('#searchjobs', {
    
    resetOnBlur: false,

    loadingClass: 'loading',
    sourceTmpl: '<a class="list-group-item" href="#" data-id="{id}"><span>{nome}</span></a>',
    sourceData: function(text, cb) {
      return utils.getData(config.urls.getJobsByName({name: text}), function(json) {
        var res = [],
          ee = json['Entries']['Entry'],
          res = _.isArray(ee) ? ee : [ee];
        
        res = _.map(res, function(v) {
          v.title = v.nome;
          return v;
        });

        cb(res);
      });
    }
  });
  // END SEARCH BOX

  $selectjobs.on('click','a', function (e) {
    e.preventDefault()

    $that = $(this);
    $that.parent().find('a').removeClass('active');
    $that.addClass('active');

    var code = $that.data('id');
    
    tree.buildTreeByCode(code);

    tree.onSelect({level:5, id: code});

    table1.reset();
    table2.reset();

  });
  
  profile.init('#profile');

  profile.getData('skills', function(skills) {

    var skillsObj = {};

    for(var i in skills) {
      var code = skills[i],
          label = config.skillsLabels(code);
      
      skillsObj[code]= config.skillsThresholds(code) || 50;

      $skills.append('<span class="badge orange-bg">'+label+'</span>');
    }

    if($('body').is('#page_index')) {

      utils.getData(config.urls.getJobsBySkills(skillsObj), function(json) {
      
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

        res = _.sortBy(res,'name');

        $selectjobs.empty();
        _.each(res, function(row) {
          $selectjobs.append('<a class="list-group-item" href="#" data-id="'+row.code+'"><span>'+row.name+'</span></a>');
        });

      });
    }

  });
  
  var $tree = $('#tree');

  var table1 = new table.init('#table', {
    columns: [
      { field: 'name', title: 'Nome' },
      {
        field: 'id', title: 'Isfol',
        cellStyle: function(value, row, index, field) {
          return {
            classes: 'isfol'
          };
        }
      }
    ],
    onSelect: function(row) {
      var u = "http://fabbisogni.isfol.it/scheda.php?limite=1&amp;id="+row.id;
      //location.href = u;
      window.open(u,'_blank');
    }
  });

  var table2 = new table.init('#table2', {
    columns: [
        //{ field: 'val', title: 'Importanza' },
        { field: 'name', title: 'Nome' },
        { field: 'desc', title: 'Descrizione' },
        //{ field: 'tval', title: 'Soglia' },
      ]
  });

  tree.init($tree, {
    width: $tree.outerWidth(),
    height: $tree.outerHeight(),
    onSelect: function(node) {

      if(node.level!==5)
          return false;

      tree.buildTreeByCode(node.id);

      $('#results').show();
      
      utils.getData(config.urls.getJobsByLevel({idLevel5: node.id }), function(json) {
        
        if(!json['Entries'])
          return null;

        var res = [],
            ee = json['Entries']['Entry'],
            res = _.isArray(ee) ? ee : [ee];

        table1.update(_.map(res, function(v) {  
          return {
            id: v.id,
            name: v.nome
          }
        }));

      });

      utils.getData(config.urls.getSkillsByJob({idJob: node.id }), function(json) {
        
        if(!json['Entries'])
          return null;

        var res = [],
            ee = json['Entries']['Entry'],
            res = _.isArray(ee) ? ee : [ee];

        //PATCH FOR API filter by API side
        delete res[0].fk_livello5;

        var rows = _.map(res[0], function(val, code) {
          code = code.toLowerCase();
          return {
            id: code,
            val: val,
            name: config.skillsLabels(code, 'desc'),
            desc: config.skillsLabels(code, 'desc_long'),
            tval: config.skillsThresholds(code)
          }
        });

        //remove not important skills for this job
        rows = _.filter(rows, function(row) {
          return row.val > config.skillsThresholds(row.id);
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

});  
