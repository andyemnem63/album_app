const http = require('http'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    url = require('url');

function content_type_for_file(file) {
    let ext = path.extname(file);
    switch (ext.toLowerCase()) {
        case '.html': return "text/html";
        case ".js": return "text/javascript";
        case ".css": return 'text/css';
        case '.jpg': case '.jpeg': return 'image/jpeg';
        default: return 'text/plain';
    }
}

function serve_static_file(file, res) {
    const rs = fs.createReadStream(file);
    rs.on('error', (e) => {
        res.writeHead(404, {"Content-Type" : "application/json"});
        const out = {
            error: "not_found",
            message: "'" + file + "' not found"
        };
        res.end(JSON.stringify(out) + "\n");
        return;
    });

    let ct = content_type_for_file(file);
    res.writeHead(200, {"Content-Type": ct});
    rs.pipe(res);
}

function load_album_list(callback) {
    fs.readdir("albums", (err, files) => {
        if (err) {
            callback({error: "file_error",
                message: JSON.stringify(err)});
            return;
        }

        let only_dirs = [];

        async.forEach(files, (element, cb) => {
            fs.stat("albums/" + element, (err, stats) => {
                if (err) {
                    cb({
                        error: "file_error",
                        message: JSON.stringify(err)
                    });
                    return;
                }
                if (stats.isDirectory()) {
                    only_dirs.push({name: element});
                }
                cb(null);
            });
        }, (err) => {
            callback(err, err ? null : only_dirs);
        });
    });
}

function send_success(res, data) {
    res.writeHead(200, {"Content-Type": "application/json"});
    let output = { error: null, data: data};
    res.end(JSON.stringify(output) + "\n");
}

function handle_list_albums(req, res) {
    load_album_list((err, albums) => {
        if (err) {
            send_failure(res, 500, err);
            return;
        }
        send_success(res, {albums: albums});
    })
}

function handle_incoming_request(req, res) {
    // Parse query string params and create object
    req.parsed_url = url.parse(req.url, true);
    let core_url = req.parsed_url.pathname;

    //  Check url to see what their asking for
    if (core_url.substring(0, 7) === '/pages/') {
        serve_page(req, res);
    } else if(core_url.substring(0, 11) === '/templates/') {
        serve_static_file("templates/" + core_url.substring(11), res);
    } else if(core_url.substring(0, 9) === '/content/') {
        serve_static_file("content/" + core_url.substring(11), res);
    } else if (core_url === '/albums.json') {
        handle_list_albums(req, res)
    }
}

function serve_page(req, res) {
    let page = get_page_name(req);

    fs.readFile('basic.html', (err, contents) => {
        if(err) {
            send_failure(res, 500, err);
            return;
        }

        contents = contents.toString('utf8');

        // replace page name, and then dump to output
        contents = contents.replace('{{PAGE_NAME}}', page);
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(contents);
    });
}

function send_failure(res, server_code, err) {
    let code = (err.code) ? err.code : err.name;
    res.writeHead(server_code, {"Content-Type": "application/json"});
    res.end(JSON.stringify({error: code, message: err.message }) + "\n");
}

function get_page_name(req) {
    let core_url = req.parsed_url.pathname;
    let parts = core_url.split("/");
    return parts[2];
}


let s = http.createServer(handle_incoming_request);
s.listen(8080);
