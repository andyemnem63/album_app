const http = require('http'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    url = require('url');

function handle_incomming_request(req, res){
    // Parse query string params and create object
    req.parsed_url = url.parse(req.url, true);
    let core_url = req.parsed_url.pathname;

    console.log(core_url);

    // if(core_url.substring(0, 7) === '/pages/') {
    //     serve_page(req, res);
    // }
}

let s = http.createServer(handle_incomming_request);
s.listen(8000);