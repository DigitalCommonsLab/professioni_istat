/*
  original: https://bl.ocks.org/mbostock/4339083

 */
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var S = require('underscore.string');
_.mixin({str: S});
window._ = _;
var H = require('handlebars');
var d3 = require('d3');
var popper = require('popper.js');
var bt = require('bootstrap');
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');

var utils = require('./utils');
var tree = require('./tree');

var baseUrl = 'http://api-test.smartcommunitylab.it/t/sco.cartella/isfol/1.0.0';


var tmpls = {
  urlData: H.compile(baseUrl+'/istatLevel{{level}}/{{id}}')
};

$(function() {

  tree.init('#tree', {
    
    //urlData: 'data/example.json',
    urlTmpl: baseUrl+'/istatLevel{level}/{id}',

    onSelect: function(id, level) {

      console.log('tree onSelect', id);



//TODO using utils.getData(url+id, function(json) { ... });
      //tree.update(id, json);

    }
  })
;
});  
