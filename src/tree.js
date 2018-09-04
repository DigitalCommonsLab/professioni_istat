/*
  original: https://bl.ocks.org/mbostock/4339083
 */
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var S = require('underscore.string');
_.mixin({str: S});
var H = require('handlebars');
var d3 = require('d3');
var he = require('he');

var config = require('./config');
var utils = require('./utils');

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
		width: 1300,
		height: 600,

		vMargin: 0,
		hMargin: 80,
		margin: {
			top: 0,	  bottom: 0,
			right: 0, left: 0
		},
		circleRadius: 10,
		timeDuration: 100,
		numLevels: 5,
		textOffset: 10,
		tooltipOffsetX: 0,
		tooltipOffsetY: 0
	},

	reformatJSON: function(json) {

		if(!json['Entries'])
			return null;

		var res = [],
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
			res.push(o);
		}
		
		//console.log(res[0].level, res);

		return res;
	},

	urlLevelByCode: function(code) {
		return config.urls.getIsfolLevels({
			level: code ? code.split('.').length+1 : '1',
			parentId: code
		});
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

		self.config = _.defaults(opts, self.config);

		self.onInit = opts && opts.onInit,
		self.onSelect = opts && opts.onSelect,

		self.tmpls = {
			node_tooltip: H.compile($('#tmpl_tooltip').html())
		};

		self.$tree = $(el);

		self.tooltip = d3.select(self.$tree.get(0)).append("div") 
			.attr("class", "tooltip")
			.style("opacity", 0);

		self.width = self.config.width - self.config.margin.right - self.config.margin.left;
		self.height = self.config.height - self.config.margin.top - self.config.margin.bottom;

		self.idCounter = 0;

		self.tree = d3.layout.tree()
			.size([self.height, self.width]);

		self.diagonal = d3.svg.diagonal()
			.projection(function(d) {
				return [d.y, d.x];
			});

		self.svg = d3.select(self.$tree.get(0)).append("svg")
			.attr("width", self.width + self.config.margin.right + self.config.margin.left)
			.attr("height", self.height + self.config.margin.top + self.config.margin.bottom)
			//.append("g")
			//.attr("transform", "translate(" + self.config.margin.left + "," + self.config.margin.top + ")");

		return self;
	},

	wrapText: function(nodes, width) {

		var self = this;

		nodes.each(function(d) {
			var values = [],
			  text = d3.select(this),
			  words,
			  word,
			  line,
			  lineNumber = 0,
			  lineHeight = 1,
			  y = parseInt(text.attr('y')),
			  dy = parseFloat(text.attr('dy')),
			  tspan;

			var t = text.text();
			
			text.text(null);

			values.push(t);

			_.each(values, function(value, i) {
			  words = value.split(/\s+/).reverse();
			  line = [];
			  tspan = text.append('tspan')
			  	.attr('x', self.config.circleRadius)//self.config.circleRadius+(d.children?-(self.config.circleRadius*3):5) )
			  	.attr('y', self.config.circleRadius)//+(d.children?-(self.config.circleRadius*3):y) )
			  	.attr('dy', (++lineNumber) + (dy-0.6) + 'em');

			  while (!!(word = words.pop())) {
			    line.push(word);
			    tspan.text(he.decode(line.join(' ')));
			    if (tspan.node().getComputedTextLength() > width) {
			      line.pop();
			      tspan.text(he.decode(line.join(' ')));
			      line = [word];
			      tspan = text.append('tspan')
			      	.attr('x', self.config.circleRadius)//self.config.circleRadius+(d.children?-(self.config.circleRadius*3):5) )
			      	.attr('y', self.config.circleRadius+(d.children?-(self.config.circleRadius*3):y) )
			      	.attr('dy', (lineNumber) + (dy+0.6) + 'em')
			      	.text(he.decode(word));
			    }
			  }
			});
		});

    },

	draw: function(source, code) {

		var self = this;

		self.svg.selectAll("*").remove();

		var nodes = self.tree.nodes(source).reverse(),
			links = self.tree.links(nodes);

		//REMOVE FIRST NODE
		nodes = _.filter(nodes, function(n) {
			return n.id!=='0';
		});
		links = _.filter(links, function(l) {
			return l.source.id!=='0';
		});

		self.nodes = nodes;

		var nodeWidth = 0,
			dy = 0,
			nodeWidthMax = self.width/(self.config.numLevels)

		nodes.forEach(function(d) {
			d.y = d.depth * nodeWidthMax - self.height + $('#jobs').width();
			nodeWidth = Math.abs(Math.min(nodeWidth, d.y - dy));
			dy = d.y;
		});
		
		if(!nodeWidth)
			nodeWidth = nodeWidthMax;

		var node = self.svg.selectAll("g.node")
		.data(nodes, function(d) {
			return d.id || (d.id = ++self.idCounter);
		});

		var nodeEnter = node.enter().append("g")
		.attr({
			"transform": function(d) { 
			    return "translate(" + d.y + "," + d.x + ")";
			},
			"class": function(d) {

				var classname = "node level"+d.level;

				if( d.children || d.id === code ||
				   (d.level === 5 && self.getIdParent(code) === d.id)
				  ) {
					classname += " highlight";
				}

				return classname;
			}
		});

		nodeEnter.append("circle")
		.attr("r", self.config.circleRadius)
		.on("click", function(d) {
			self.onSelect.call(self, d);
		});

		nodeEnter.append("text")
		.on("mouseover", function(d) {
			var pos = d3.transform(d3.select(this.parentNode).attr("transform")).translate,
				off = self.$tree.offset(),
				x = pos[0]+ off.left + self.config.textOffset,
				y = pos[1]+ off.top - 40;

				console.log(d3.select(this.parentNode))

			self.tooltip
				.style("left", x + "px")
				.style("top", y + "px")
				.html(self.tmpls.node_tooltip(d))
				.style("opacity", 1);
		})
		.on("mouseout", function(d) {
			self.tooltip.style("opacity", 0);
		})
		.on("click", function(d) {
			self.onSelect.call(self, d);
		})
		.attr({
			"dy": 0,
			"x": function(d) {
				return self.config.textOffset;
			},
			"y": function(d) {
				return -(self.config.textOffset);
			},
/*			"text-anchor": function(d) { 
				return (d.children || d._children) ? "end" : "start";
			}*/
		})
		.text(function(d) {
			return d.name.toLowerCase();
		})
		.call(function(d) {
			var textWidth = Math.round(nodeWidth-self.config.circleRadius*2);
			self.wrapText(d, textWidth);
		});

		nodeEnter.append("rect")
		.attr({
			"y": function(d) {
				var t = d3.select(this.parentNode).select('text')[0][0];
				return t.getBBox().y-4;
			},
			"x": function(d) {
				var t = d3.select(this.parentNode).select('text')[0][0];
				return t.getBBox().x-4;
			},
			"height": function(d) {
				var t = d3.select(this.parentNode).select('text')[0][0];
				return t.getBBox().height+10;
			},
			"width": function(d) {
				var t = d3.select(this.parentNode).select('text')[0][0];
				return t.getBBox().width+10;
			},
		})
		.call(function(d) {
			this.moveToBack()
		});

		var link = self.svg.selectAll("path.link")
		.data(links, function(d) {
			return d.target.id;
		});

		link.enter().insert("path", "g")
		.attr({
			"d": self.diagonal,
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

		self.svg.selectAll("link").moveToBack();
		self.svg.selectAll(".highlight").moveToFront();
	},

	/*onAjaxError: function(jqXHR, textStatus, errorThrown) {
		console.log('onError',jqXHR)
	},*/

	buildTreeByCode: function(code) {

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
		).then(function(l1, l2, l3, l4, l5) {

			var dataLevels = [
				self.reformatJSON(l1[0]),
				self.reformatJSON(l2[0]),
				self.reformatJSON(l3[0]),
				self.reformatJSON(l4[0]),
				self.reformatJSON(l5[0])
			];

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

			fillTree(data);

			self.draw(data, code);
		});
	}
};