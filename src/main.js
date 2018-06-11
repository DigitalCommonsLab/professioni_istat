
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

//include after other modules
require('../main.css');

$(function() {

  var tmpls = {
    node_tooltip: H.compile($('#tmpl_tooltip').html())
  };

  var urlData = "data/example.json";

  var margin = {
        top: 20, right: 120, bottom: 20, left: 120
      },
      width = 960 - margin.right - margin.left,
      height = 400 - margin.top - margin.bottom,
      tooltipOffsetX = -10,
      tooltipOffsetY = 0;

  var i = 0,
      timeDuration = 500,
      dataRoot;

  var d3Tree = d3.layout.tree().size([height, width]);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

  var tooltip = d3.select("body").append("div") 
      .attr("class", "tooltip")
      .style("opacity", 0);

  var svg = d3.select("#graph").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .style("height", height+'px');

  function update(source) {

    // Compute the new tree layout.
    var nodes = d3Tree.nodes(dataRoot).reverse(),
        links = d3Tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", function click(d) {

          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          
          update(d);

        });

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
        .on("mouseover", function(d) {    
            tooltip.transition()
                .duration(timeDuration)
                .style("opacity", .9);    
            
            console.log(d)

            tooltip .html(tmpls.node_tooltip(d))  
                .style("left", (d3.event.pageX - tooltipOffsetX) + "px")   
                .style("top", (d3.event.pageY - tooltipOffsetY) + "px");  
            })          
        .on("mouseout", function(d) {   
            tooltip.transition()    
                .duration(timeDuration)    
                .style("opacity", 0); 
        });

    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(timeDuration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(timeDuration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(timeDuration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(timeDuration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  d3.json(urlData, function(error, json) {
    if (error) throw error;

    dataRoot = json;
    dataRoot.x0 = height / 2;
    dataRoot.y0 = 0;

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    dataRoot.children.forEach(collapse);

    update(dataRoot);

  });

});  
