
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

var baseUrl = "http://api-test.smartcommunitylab.it/t/sco.cartella/isfol/1.0.0/";
//var baseUrlLevels = "http://localhost/smartcommunitylab/t/sco.cartella/isfol/1.0.0/istatLevel";

var tmpls = {
  urlData: H.compile(baseUrl+'istatLevel{{level}}/{{id}}')
};

$(function() {

  var $tree = $('#tree');

  window.t = tree.init($tree, {
    baseUrl: baseUrl,
    width: $tree.outerWidth(),
    height: $tree.outerHeight()
  });

  $('#selectId').on('change', function (e) {
    var code = $(this).val();

    tree.buildTreeByCode(code);

  })
  .val('3.2.1.2.7').trigger('change');

});  
