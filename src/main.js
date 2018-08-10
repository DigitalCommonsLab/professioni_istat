
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

window._ = _;
window.$ = $;

window.DEBUG_MODE = false;
//load JSON file instead of remote API rest

var config = require('./config');

var utils = require('./utils');
var tree = require('./tree');
var table = require('./table');
var profile = require('./profile');
//var radar = require('../src/lib/radarChart');

var btlist = require('bootstrap-list-filter');

window.btlist = btlist;

window.profile = profile;

$(function() {

  $('#version').text('v'+pkg.version);

  config.init({
    baseUrl: "//api-test.smartcommunitylab.it/t/sco.cartella/"
  });

  var $profile = $('#profile'),
      $skills = $('#skills'),
      $select_jobs = $('#select_jobs'),
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

  $select_jobs.on('change', function (e) {
    
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
      
      skillsObj[code]= config.skillsThresholds[ code ] || 50;

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
        { field: 'desc', title: 'Descrizione' },
        { field: 'tval', title: 'Soglia' },
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
            tval: config.skillsThresholds[ code ],
            name: profile.skillsLabels[code] ? profile.skillsLabels[code].desc : '',
            desc: profile.skillsLabels[code] ? profile.skillsLabels[code].desc_long : ''
          }
        });

        //remove not important skills for this job
        rows = _.filter(rows, function(row) {
          return row.val > config.skillsThresholds[ row.id ];
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

window.table2 = table2;

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
            desc: ""
          }
        }));

        table2.reset();

    /*
    //TODO test radar for skills
    
        var $radar = $('#radar');

        var radarLabels = _.pluck(profile.skillsLabels,'desc'), 
            radarData = [
              _.map(_.range(1, radarLabels.length), function(i) {
                return {
                  value: _.shuffle(_.range(3.2,4.8,0.4))[0]
                };
              }),
              _.map(_.range(1, radarLabels.length), function(o) {
                //ADD RANDOM VALUES
                o.value = _.shuffle(_.range(1,7,0.2))[0]; 
                return o;
              })
            ];

        radar($radar[0], {
          data: radarData,
          labels: radarLabels,
          colors: ["red","green","blue"],
          w: $radar.outerWidth(),
          h: $radar.outerHeight()
        });
*/
      });
    }
  });

});  
