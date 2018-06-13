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

var baseUrl = 'http://api-test.smartcommunitylab.it/t/sco.cartella/isfol/1.0.0/';


var tmpls = {
  urlData: H.compile(baseUrl+'istatLevel{{level}}/{{id}}')
};

$(function() {

  tree.init('#tree', {

    onInit: function(dataRoot) {

      var self = this;

      utils.getData(baseUrl+'istatLevel1', function(json) {

        if(json['Entries'] && !node.children) {
          node.children = json['Entries']['Entry'];
        }

        self.dataRoot = json;
        self.dataRoot.x0 = self.opts.height / 2;
        self.dataRoot.y0 = 0;

        function collapse(d) {
          if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
          }
        }

        self.dataRoot.children.forEach(collapse);

      });      

    },

    onSelect: function(node) {

      console.log('tree onSelect', id);

      var url = tmpls.urlData({
        level: node.id.split('.').length,
        id: node.id
      });

      utils.getData(url, function(json) {

        if(json['Entries'] && !node.children) {
          node.children = json['Entries']['Entry'];
        }

      });
      //tree.update(id, json);

    }
  })
;
});  
