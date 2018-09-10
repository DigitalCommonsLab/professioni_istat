
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var S = require('underscore.string');
_.mixin({str: S});

var config = require('./config');

module.exports = {

    hashParams: function() {
        //https://stackoverflow.com/questions/8486099/how-do-i-parse-a-url-query-parameters-in-javascript
        var query = location.hash.substr(1);
        var result = {};
        query.split("&").forEach(function(part) {
            var item = part.split("=");
            result[item[0]] = decodeURIComponent(item[1]);
        });
        return result;
    },

    getData: function(url, cb, cache) {

        cb = cb || _.noop;
        
        //cache = _.isUndefined(cache) ? true : cache;

        //if(cache || !localStorage[url]) {        
            /*$.getJSON(url, function(json) {
                cb(json)
            });
            return*/
            $.ajax({
                url: url,
                dataType: 'json',
                //async: false,
                beforeSend: function (xhr) {
                    var token = config.getToken();
                    if(token)
                        xhr.setRequestHeader('Authorization', 'Bearer '+token);

                    console.log('beforeSend xhr', xhr)
                },
                success: function(json) {
    /*              try {
                        localStorage.setItem(url, JSON.stringify(json));
                    }
                    catch (e) {
                        localStorage.clear();
                        localStorage.setItem(url, JSON.stringify(json));
                    }*/

                    cb(json);
                }
            });
        //}
        //else
        //{
        //    cb(JSON.parse(localStorage[url]))
        //}
    },

    randomColor: function(str) {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

};
