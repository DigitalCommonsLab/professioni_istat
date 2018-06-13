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
var utils = require('./utils');

module.exports = {
  	
  	tree: null,

	onInit: function(e){ console.log('onInit',e); },
  	onSelect: function(e){ console.log('onClickNode',e); },

  	config: {
  		
  		urlData: '',

  		width: 960,
		height: 400,
		margin: {
			top: 20,
			right: 120,
			bottom: 20,
			left: 120
		},
		nodeRadius: 6,
		tooltipOffsetX: -10,
		tooltipOffsetY: 0
  	},

	getDataUrl: function(id) {
		var url = '/';
		return this.opts.urlData + url;
	},

	init: function(el, opts) {

		var self = this;

		self.tree = $(el);

		self.tmpls = {
			node_tooltip: H.compile($('#tmpl_tooltip').html())
		};

  		self.idCount = 0;
		self.dataRoot = {};

		self.opts = _.defaults(opts, self.config);

		self.opts.width -= (self.opts.margin.right - self.opts.margin.left);
		self.opts.height -= (self.opts.margin.top - self.opts.margin.bottom);

		self.onInit = opts && opts.onInit,
		self.onSelect = opts && opts.onSelect,

		self.d3Tree = d3.layout.tree().size([self.opts.height, self.opts.width]);

		self.diagonal = d3.svg.diagonal()
			.projection(function(d) { return [d.y, d.x]; });

		var tooltip = d3.select("body").append("div") 
			.attr("class", "tooltip")
			.style("opacity", 0);

		self.svg = d3.select("#graph").append("svg")
			.attr("width", self.opts.width + self.opts.margin.right + self.opts.margin.left)
			.attr("height", self.opts.height + self.opts.margin.top + self.opts.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + self.opts.margin.left + "," + self.opts.margin.top + ")")
			.style("height", self.opts.height+'px');

		self.onInit.call(self, self.dataRoot);

		setTimeout(function() {
			console.log('after onInit dataRoot:', self.dataRoot)
		},3000)
	},

  	update: function(source) {

  		//TODO replace source with dataRoot
  		
  		var self = this;

  		var timeDuration = 500;

	    // Compute the new tree layout.
	    var nodes = self.d3Tree.nodes(self.dataRoot).reverse(),
	        links = self.d3Tree.links(nodes);

	    // Normalize for fixed-depth.
	    nodes.forEach(function(d) { d.y = d.depth * 180; });

	    // Update the nodes…
	    var node = self.svg.selectAll("g.node")
	        .data(nodes, function(d) {
	          return d.id || (d.id = ++self.idCount);
	        });

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
	          
	          self.update(d);

	        });

	    nodeEnter.append("circle")
	        .attr("r", 1e-6)
	        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
	        .on("mouseover", function(d) {    
	            tooltip.transition()
	                .duration(timeDuration)
	                .style("opacity", 1);

	            tooltip.html(self.tmpls.node_tooltip(d))  
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
	        .attr("r", self.opts.nodeRadius)
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
	    var link = self.svg.selectAll("path.link")
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
	        .attr("d", self.diagonal);

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
};