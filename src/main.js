
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

var utils = require('./utils');
var tree = require('./tree');
var table = require('./table');

var baseUrl = "http://api-test.smartcommunitylab.it/t/sco.cartella/isfol/1.0.0/";
//var baseUrlLevels = "http://localhost/smartcommunitylab/t/sco.cartella/isfol/1.0.0/istatLevel";

window.allSkillsLabels = {};

$(function() {

  var $tree = $('#tree');

  var url = DEBUG_MODE ? 'data/debug/allSkillsLabels.json' : baseUrl+'allSkillsLabels';
  $.getJSON(url, function(json) {
    
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

  });

  var table2 = new table.init('#table2');

  var table1 = new table.init('#table', {
    onSelect: function(row) {
      //TODO select   
      console.log('table onSelect', row.id);

      var level5 = tree.getIdParent(row.id);

      var url = DEBUG_MODE ? 'data/debug/skillsByJob_'+level5+'.json' : baseUrl+'skillsByJob/'+level5;
      $.getJSON(url, function(json) {
        
        if(!json['Entries'])
          return null;

        var res = [],
            ee = json['Entries']['Entry'],
            res = _.isArray(ee) ? ee : [ee];
        
        console.log('/skillsByJob',res);

        delete res[0].fk_livello5;

        var rows = _.map(res[0], function(val, code) {
          code = code.toLowerCase();
          return {
            id: code,
            name: allSkillsLabels[code] ? allSkillsLabels[code].desc : '',
            desc: allSkillsLabels[code] ? allSkillsLabels[code].desc_long : ''
          }
        });

        console.log('table2',rows)

        table2.update(rows);
/* 
        $chart = $('#chart');
       _.each(res[0], function(val, code) {
          
          code = code.toLowerCase();

          if(allSkillsLabels[code]) {
            $chart.append('<div class="skill">'+
              '<b>'+val+'</b>'+
              allSkillsLabels[code].desc+'<br />'+
              '<small>'+allSkillsLabels[code].desc_long+'</small>'+
            '</div>');
          }

        });*/

      });

    }
  });

  tree.init($tree, {
    baseUrl: baseUrl,
    width: $tree.outerWidth(),
    height: $tree.outerHeight(),
    onSelect: function(node) {
      
      console.log('onSelect node', node)

      if(node.level!==5) return false;
      
      var url = DEBUG_MODE ? 'data/debug/jobsByLevel5_'+node.id+'.json' : baseUrl+'jobsByLevel5/'+node.id;
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

  $('#selectId').on('change', function (e) {
    var code = $(this).val();

    tree.buildTreeByCode(code);

  })
  .val('3.2.1.2.7').trigger('change');

});  
