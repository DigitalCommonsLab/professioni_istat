
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var utils = require('./utils');

var bttable = require('bootstrap-table');
//https://github.com/wenzhixin/bootstrap-table
require('../node_modules/bootstrap-table/dist/bootstrap-table.min.css');

module.exports = {
  	
  	table: null,

  	onSelect: function(e){ console.log('onClickRow',e); },

	init: function(el, opts) {

		var self = this;

		this.table = $(el);

		this.table.bootstrapTable({
			
			onClickRow: opts && opts.onSelect,
			//radio:true,
			pagination: false,
			pageSize: 10,
			pageList: [10],
			//cardView: true,
			data: [],
		    columns: [
			    {
			        field: 'name',
			        title: 'Nome'
			    }, {
			        field: 'isced:level',
			        title: 'Livello'
			    }, {
			        field: 'website',
			        title: 'Sito Web'
			    },
			    {
			        field: 'operator',
			        title: 'Operatore'
			    }
		    ]
		});
	},

	update: function(geo) {
		var json = _.map(geo.features, function(f) {
			var p = f.properties;
			return {
				'id': p.osm_id || p.id,
				'name': p.name,
				'isced:level': p['isced:level'],
				'operator': p.operator,
				'website': p.website
			};
		});

		this.table.bootstrapTable('load', json);
	}
}