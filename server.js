const http = require('http'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    url = require('url');

function handle_incoming_request(req, res){
    // Parse query string params and create object
    req.parsed_url = url.parse(req.url, true);
    let core_url = req.parsed_url.pathname;

    //  Check url to see what their asking for
    if(core_url.substring(0, 7) === '/pages/') {

    } else if(core_url.substring(0 , 11) === '/templates/') {

    } else if(core_url.substring(0 , 11) === '/content/') {

    } else if(core_url.substring(0 , 11) === '/albums.json/') {

    } else if(core_url.substring(0 , 11) === '/albums/') {

    } else {

    }
}


let s = http.createServer(handle_incoming_request);
s.listen(8000);