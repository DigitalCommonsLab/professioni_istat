
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var utils = require('./utils');

var bttable = require('bootstrap-table');
//https://github.com/wenzhixin/bootstrap-table
require('../node_modules/bootstrap-table/dist/bootstrap-table.min.css');

module.exports = {

  	onSelect: function(e){ console.log('onClickRow',e); },

	init: function(el, opts) {

		var self = this;

		this.table = $(el);

		this.table.bootstrapTable({
			onClickRow: opts && opts.onSelect || self.onSelect,
			//radio:true,
			pagination: true,
			pageSize: 5,
			pageList: [5],
			//cardView: true,
			data: [],
			columns: opts.columns || [
			/*	{
				    field: 'id',
				    title: 'Id'
				},*/
				{
				    field: 'name',
				    title: 'Nome'
				},
				{
				    field: 'desc',
				    title: 'Descrizione'
				}
			]
		});

		this.update = function(json) {
			this.table.bootstrapTable('load', json);
			return this;
		};

		this.reset = function() {
			this.table.bootstrapTable('refresh', {pageNumber: 1});
			return this;
		};

		return this;
	}
}