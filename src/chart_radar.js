
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var d3 = require('d3');
var utils = require('./utils');

var RadarChart = require('./lib/radarChart');

module.exports = {
  	
  	chart: null,

  	//onSelect: function(e){ console.log('onClickRow',e); }

	init: function(el, opts) {
		this.el =  el;
		this.labels = opts && opts.labels;
		return this;
	},

	update: function(data) {

		//console.log('RadarChart update', data)

		var margin = {top: 100, right: 100, bottom: 100, left: 100},
			width = Math.min(500, window.innerWidth - 10) - margin.left - margin.right,
			height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

		this.chart = RadarChart(this.el, {
			data: data,
			labels: this.labels,
			colors: ["red","green","blue"],
			w: width,
			h: height,
			margin: margin,
			maxValue: 0.5,
			levels: 5,
			roundStrokes: true
		});
	}
}