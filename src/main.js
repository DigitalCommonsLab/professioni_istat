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

$(function() {

  tree.init('#tree', {
    urlData: 'data/example.json',

    onSelect: function(id) {

      tree.update();
      
    }
  })
;
});  
