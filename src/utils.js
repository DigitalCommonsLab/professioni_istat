
var $ = jQuery = require('jquery');
var _ = require('underscore'); 
var S = require('underscore.string');
_.mixin({str: S});

var config = require('./config');

module.exports = {

    getHostname: function(url) {
        var hostname;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (url.indexOf("//") > -1) {
            hostname = url.split('/')[2];
        }
        else {
            hostname = url.split('/')[0];
        }

        //find & remove port number
        hostname = hostname.split(':')[0];
        //find & remove "?"
        hostname = hostname.split('?')[0];

        return hostname;
    },

    getDomain: function(url) {
        
        var domain = this.getHostname(url),
            splitArr = domain.split('.'),
            arrLen = splitArr.length;

        //extracting the root domain here
        //if there is a subdomain 
        if (arrLen > 2) {
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
            //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
            if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
                //this is using a ccTLD
                domain = splitArr[arrLen - 3] + '.' + domain;
            }
        }
        return domain;
    },
    
    getData: function(url, cb, cache) {

        cb = cb || _.noop;
        
        //cache = _.isUndefined(cache) ? true : cache;

        //if(cache || !localStorage[url]) {
            return $.ajax({
                url: url,
                dataType: 'json',
                //async: false,
                beforeSend: function (xhr, req) {

                    if(self.getDomain(req.url) === config.urls.aacDomain) {

                        var token = config.getToken();
                        if(token) {
                            xhr.setRequestHeader('Authorization', 'Bearer '+token);
                        }
                    }
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
