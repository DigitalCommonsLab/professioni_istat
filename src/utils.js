
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var S = require('underscore.string');
_.mixin({str: S});

module.exports = {

	randomColor: function(str) {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	},

    getData: function(url, cb) {

        if(true || !localStorage[url]) {
            $.getJSON(url, function(json) {
                
                try {
                    localStorage.setItem(url, JSON.stringify(json));
                }
                catch (e) {
                    localStorage.clear();
                    localStorage.setItem(url, JSON.stringify(json));
                }

                cb(json);
            });
        }
        else
        {
            cb(JSON.parse(localStorage[url]))
        }
    }
};
