
var pkg = require('../package.json'); 

var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var S = require('underscore.string');
_.mixin({str: S});
var H = require('handlebars');
var d3 = require('d3');
var popper = require('popper.js');
var bt = require('bootstrap');
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
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

$(function() {

  $('#version').text('v'+pkg.version);

  config.init({
    baseUrl: "//api-test.smartcommunitylab.it/t/sco.cartella/"
  });

  var $profile = $('#profile'),
      $skills = $('#skills'),
      $selectjobs = $('#selectjobs'),
      $searchjobs = $('#searchjobs'),
      $searchlist = $('#searchlist');

  $searchlist
  .on('click','.list-group-item', function(e) {
    e.preventDefault();
    
    var code = $(e.currentTarget).data('id');

    tree.buildTreeByCode(code);

    table1.reset();
    table2.reset();
    
  })
  .btsListFilter('#searchjobs', {
    loadingClass: 'loading',
    sourceTmpl: '<a class="list-group-item" href="#" data-id="{id}"><span>{nome} <small class="text-muted">{id}</small></span></a>',
    sourceData: function(text, cb) {
      return $.getJSON(config.urls.getJobsByName({name: text}), function(json) {
        var res = [],
          ee = json['Entries']['Entry'],
          res = _.isArray(ee) ? ee : [ee];
        
        res = _.map(res, function(v) {
          v.title = v.nome;
          return v;
        });

        console.log('search',text, res);

        cb(res);
      });
    }
  });

  $selectjobs.on('change', function (e) {
    
    var code = $(this).val();
    
    tree.buildTreeByCode(code);

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

      $selectjobs.empty();
      _.each(res, function(row) {
        $selectjobs.append('<option value="'+row.code+'">'+row.name+'</option>')
      });

    });

  });
  
  var $tree = $('#tree');

  var table1 = new table.init('#table', {
    columns: [
      //{ field: 'id', title: 'Isfol' },
      { field: 'name', title: 'Nome' },
      //{ field: 'desc', title: 'Descrizione' }
    ]
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
      
      $.getJSON(config.urls.getJobsByLevel({idLevel5: node.id }), function(json) {
        
        if(!json['Entries'])
          return null;

        var res = [],
            ee = json['Entries']['Entry'],
            res = _.isArray(ee) ? ee : [ee];

        table1.update(_.map(res, function(v) {
          var code = v.id;
          return {
            id: code,//'<a target="_blank" href="http://fabbisogni.isfol.it/scheda.php?limite=1&amp;id='+code+'"/>Isfol:'+code+'</a>',
            name: v.nome,
            //desc: ""
          }
        }));

      });

      $.getJSON(config.urls.getSkillsByJob({idJob: node.id }), function(json) {
        
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

  //DEBUG
/*
  window.tree = tree;

  var testVal = '2.1.1.4.1';

  setTimeout(function() {
    
    $selectjobs.val(testVal).trigger('change');

  },1000);*/

});  
