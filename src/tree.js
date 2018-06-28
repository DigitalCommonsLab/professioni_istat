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

var baseUrlLevels = "https://api-test.smartcommunitylab.it/t/sco.cartella/isfol/1.0.0/istatLevel";

d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};

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

	reformatJSON: function(json) {

		if(!json['Entries'])
			return null;

		var ret = [],
		ee = json['Entries']['Entry'];

		ee = _.isArray(ee) ? ee : [ee];
		//PATCH API

		for(var e in ee)
		{
			var o = ee[e];

			o.id = ""+o.id;
			delete o.parent;
			//PATCH API FORMATS

			o.name = o['nome'];
			delete o['nome'];
			o.desc = o['descrizione'];
			delete o['descrizione'];
			//descrizione, id
			o.level = o.id.split('.').length;
			//delete o.id;
			o.children = null;
			ret.push(o);
		}
		
		//console.log(ret[0].level, ret);

		return ret;
	},

	urlLevelByCode: function(code) {
		var url = baseUrlLevels + (code ? (code.split('.').length+1)+"/"+code : '1');
		//console.log(code, url);
		return url;
	},

	getIdParent: function(id) {
		var n = id.split('.');
		if(id.indexOf('.')===-1)
			return '0';
		n.splice(-1);
		return n.join('.');
	},

	init: function(el, opts) {


		var self = this;

		self.tmpls = {
				node_tooltip: H.compile($('#tmpl_tooltip').html())
			};

		var tooltip = d3.select("body").append("div") 
			.attr("class", "tooltip")
			.style("opacity", 0);

		self.$tree = $(el);

		var	vMargin = 0,
			hMargin = 80,
			margin = {top: vMargin, right: hMargin, left: hMargin, bottom: vMargin}, 
			width = self.$tree.outerWidth() - margin.right - margin.left,
			height = self.$tree.outerHeight() - margin.top - margin.bottom,
			circleRadius = 10,
			timeDuration = 100,
			numLevels = 5;
		 
		var idCounter = 0,
			tooltipOffsetX = -10,
			tooltipOffsetY = 0;

		var tree = d3.layout.tree()
			.size([height, width]);

		var diagonal = d3.svg.diagonal()
			.projection(function(d) {
				return [d.y, d.x];
			});

		var svg = d3.select(el).append("svg")
			.attr("width", width + margin.right + margin.left)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	},


	draw: function(source, code) {

		svg.selectAll("*").remove();

		var nodes = tree.nodes(source).reverse(),
		  links = tree.links(nodes);

		nodes.forEach(function(d) {
		d.y = d.depth * (width/(numLevels+1));
		});

		var node = svg.selectAll("g.node")
		.data(nodes, function(d) {
		  return d.id;// || (d.id = ++idCounter);
		});

		var nodeEnter = node.enter().append("g")
		.attr({
			"transform": function(d) { 
			    return "translate(" + d.y + "," + d.x + ")";
			},
			"class": function(d) {

			  if( d.children || 
		      d.id === code ||
			     (d.level === 5 && self.getIdParent(code) === d.id)
			     )
			    return "node highlight";
			  else
			    return "node";   
			}
		});


		nodeEnter.append("circle")
		.attr("r", circleRadius)
		.on("mouseover", function(d) {
			var x = d3.event.pageX,
				y = d3.event.pageY;

			tooltip.transition()
				.duration(timeDuration)
				.style("opacity", 1)
				.style("left", (x - tooltipOffsetX) + "px")
				.style("top", (y - tooltipOffsetY) + "px")
				.html(tmpls.node_tooltip(d));
		})          
		.on("mouseout", function(d) {
			tooltip.transition()
				.duration(timeDuration)
				.style("opacity", 0);
		});

		nodeEnter.append("text")
		.attr({
			"dy": ".35em",
			"x": function(d) {
				return d.children || d._children ? -20 : 20;
			},
			"text-anchor": function(d) { 
				return d.children || d._children ? "end" : "start";
			}
		})
		.text(function(d) {
		  return d.id+': '+d.name;
		});

		var link = svg.selectAll("path.link")
		.data(links, function(d) {
			return d.target.id;
		});

		link.enter().insert("path", "g")
		.attr({
			"d": diagonal,
			"class": function(d) {

				if( d.target.children || 
					d.target.id === code ||
					(d.target.level === 5 && self.getIdParent(code) === d.target.id)
					)
					return "link highlight";
				else
					return "link";
			}
		});

		svg.selectAll(".highlight").moveToFront();
	},

	buildTreeByCode: function(code) {

		console.log('buildTreeByCode: ', code);

		var self = this;

		var n = code.split('.'),
			levelId1 = "",
			levelId2 =  n[0],
			levelId3 = [n[0],n[1]].join('.'),
			levelId4 = [n[0],n[1],n[2]].join('.'),
			levelId5 = [n[0],n[1],n[2],n[3]].join('.');

		$.when(
			$.getJSON(self.urlLevelByCode(levelId1)),
			$.getJSON(self.urlLevelByCode(levelId2)),
			$.getJSON(self.urlLevelByCode(levelId3)),
			$.getJSON(self.urlLevelByCode(levelId4)),
			$.getJSON(self.urlLevelByCode(levelId5))
		).then(function(l1,l2,l3,l4,l5) {

			var dataLevels = [
				self.reformatJSON(l1[0]),
				self.reformatJSON(l2[0]),
				self.reformatJSON(l3[0]),
				self.reformatJSON(l4[0]),
				self.reformatJSON(l5[0])
			];

			console.log('DATALEVELS', dataLevels);

			var data = {
			  id: '0',
			  level: 0,
			  name: "",
			  children: null
			};

			function fillTree(d, p) {
			  if(dataLevels[ d.level ] && 
			     self.getIdParent(dataLevels[ d.level ][0].id) === d.id)
			  {

			      d.children = dataLevels[ d.level ];
			      d.children.forEach(function(child) {
			          fillTree(child, d);
			      });
			  }
			}

			fillTree(data, {id:'0'});

			self.draw(data, code);
		});
	}
};