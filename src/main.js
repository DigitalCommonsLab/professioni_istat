
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

var utils = require('./utils');
var tree = require('./tree');

var baseUrl = 'http://api-test.smartcommunitylab.it/t/sco.cartella/isfol/1.0.0/';

var tmpls = {
  urlData: H.compile(baseUrl+'istatLevel{{level}}/{{id}}')
};

function reformatChildren(o) {
  o.name = o['nome'];
  delete o['nome'];
  o.desc = o['descrizione'];
  delete o['descrizione'];
  //descrizione, id
  o.level = (""+o.id).split('.').length;
  return o;
}

$(function() {

  tree.init('#tree', {
    //TODO options width, height
  });


  $('#selectId').on('change', function (e) {
    var code = $(this).val();

    tree.buildTreeByCode(code);

  })
  .val($('#selectId > option:eq(1)').val()).trigger('change');

});  
