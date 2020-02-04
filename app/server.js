
const http = require('http'),
    async = require('async'),
    path = require("path"),
    fs = require('fs'),
    url = require('url');

function serve_static_file(file, res) {
    const rs = fs.createReadStream(file);
    rs.on('error', (e) => {
        res.writeHead(404, {"Content-Type": "application/json"});
        const out = {
            error: "not_found",
            message: "'" + file + "' not found"
        };
        res.end(JSON.stringify(out) + "\n");
        return;
    });

    let ct = content_type_for_file(file);
    res.writeHead(200, { "Content-Type" : ct });
    rs.pipe(res);
}

function content_type_for_file (file) {
    let ext = path.extname(file);
    switch (ext.toLowerCase()) {
        case '.html': return "text/html";
        case ".js": return "text/javascript";
        case ".css": return 'text/css';
        case '.jpg': case '.jpeg': return 'image/jpeg';
        default: return 'text/plain';
    }
}

function load_album_list(callback) {
    fs.readdir("albums", (err, files) => {
        if (err) {
            callback({ error: "file_error",
                       message: JSON.stringify(err) });
            return;
        }
        let only_dirs = [];

        async.forEach(files, (element, cb) => {
            fs.stat("albums/" + element, (err, stats) => {
                if (err) {
                    cb({ error: "file_error",
                         message: JSON.stringify(err) });
                    return;
                }
                if (stats.isDirectory()) {
                    only_dirs.push({ name: element });
                }
                cb(null);
            }
                   );
        },
        (err) => {
            callback(err, err ? null : only_dirs);
        });
    });
}

function load_album(album_name, page, page_size, callback) {
    fs.readdir("albums/" + album_name, (err, files) => {
        if (err) {
            if (err.code === "ENOENT") {
                callback(no_such_album());
            } else {
                callback({ error: "file_error",
                           message: JSON.stringify(err) });
            }
            return;
        }

        let only_files = [];
        let path = "albums/" + album_name + "/";

        async.forEach(files, (element, cb) => {
            fs.stat(path + element, (err, stats) => {
                if (err) {
                    cb({ error: "file_error",
                         message: JSON.stringify(err) });
                    return;
                }
                if (stats.isFile()) {
                    let obj = { filename: element,
                                desc: element };
                    only_files.push(obj);
                }
                cb(null);
            });
        },
        function (err) {
            if (err) {
                callback(err);
            } else {
                let start = page * page_size;
                let photos = only_files.slice(start, start + page_size);
                let obj = { short_name: album_name.substring(1),
                            photos: photos };
                callback(null, obj);
            }
        });
    });
}

function serve_page(req, res) {
    let page = get_page_name(req);
    fs.readFile('basic.html', (err, contents) => {
        if (err) {
            send_failure(res, 500, err);
            return;
        }

        contents = contents.toString('utf8');

        // replace page name, and then dump to output.
        contents = contents.replace('{{PAGE_NAME}}', page);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(contents);
    });
}

function handle_incoming_request(req, res) {
    // Parse query string params and create object
    req.parsed_url = url.parse(req.url, true);
    let core_url = req.parsed_url.pathname;
    //  Check url to see what their asking for
    if (core_url.substring(0, 7) === '/pages/') {
        serve_page(req, res);
    } else if (core_url.substring(0, 11) === '/templates/') {
        serve_static_file("templates/" + core_url.substring(11), res);
    } else if (core_url.substring(0, 9) === '/content/') {
        serve_static_file("content/" + core_url.substring(9), res);
    } else if (core_url === '/albums.json') {
        handle_list_albums(req, res);
    } else if (core_url.substr(0, 7) === '/albums'
               && core_url.substr(core_url.length - 5) === '.json') {
        handle_get_album(req, res);
    } else {
        send_failure(res, 404, invalid_resource());
    }
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

function get_album_name(req) {
    let core_url = req.parsed_url.pathname;
    return core_url.substr(7, core_url.length - 12);
}


function get_query_params(req) {
    return req.parsed_url.query;
}

function no_such_album() {
        return { error: "no_such_album",
            message: "The specified album does not exist" };
    }

function handle_get_album(req, res) {
    let album_name = get_album_name(req);
    let getp = get_query_params(req);
    let page_num = getp.page ? get.page : 0;
    let page_size = getp.page_size ? get.page_size : 1000;
    if(isNaN(parseInt(page_num))) page_num = 0;
    if(isNaN(parseInt(page_size))) page_size = 0;

    load_album(album_name, page_num, page_size, (err, album_contents) => {
        if (err && err === "no such album") {
            send_failure(res, 404, err);
        } else if (err) {
            send_failure(res, 500, err);
        } else {
            send_success(res, {album_data: album_contents });
        }
    });
}

function invalid_resource() {
    return { error: "invalid_resource",
        message: "the requested resource does not exist." };
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
