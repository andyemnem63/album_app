var helpers = require('./helpers.js'),
    async = require('async'),
    fs = require('fs');

exports.version = "0.1.0";


function load_album_list(callback) {
    fs.readdir("../static/albums",
      (err, files) => {
        if (err) {
            callback(helpers.make_error("file_error", JSON.stringify(err)));
            return;
        }

        let only_dirs = [];
        async.forEach(
                files,
        (element, cb) => {
                fs.stat(
                    "../static/albums/" + element,
                    (err, stats) => {
                        if (err) {
                            cb(helpers.make_error("file_error",
                                                    JSON.stringify(err)));
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

exports.list_all = function (req, res) {
    load_album_list((err, albums) => {
        if (err) {
            helpers.send_failure(res, 500, err);
            return;
        }
        helpers.send_success(res, {albums: albums});
    });
};

exports.album_by_name = function (req, res) {

    let getp = req.query;
    let page_num = getp.page ? getp.page : 0;
    let page_size = getp.page_size ? getp.page_size : 1000;

    if (isNaN(parseInt(page_num))) page_num = 0;
    if (isNaN(parseInt(page_size))) page_size = 0;

    let album_name = req.params.album_name;
    load_album(
        album_name,
        page_num,
        page_size,
        (err, album_contents) => {
        if (err && err.error === "no such album") {
            helpers.send_failure(res, 404, err);
        } else if (err) {
            helpers.send_failure(res, 500, err);
        } else {
            helpers.send_success(res, {album_data: album_contents});
        }
    });
};

function load_album(album_name, page, page_size, callback) {
    fs.readdir("../static/albums/" + album_name,
              (err, files) => {
        if (err) {
            if (err.code === "ENOENT") {
                callback(helpers.no_such_album());
            } else {
                callback(helpers.make_error("file_error",
                                                  JSON.stringify(err)));
            }
            return;
        }

        let only_files = [];
        let path = "../static/albums/" + album_name + "/";

        async.forEach(
            files,
    (element, cb) => {
                fs.stat(
                    path + element,
                 (err, stats) => {
                    if (err) {
                        cb(helpers.make_error("file_error",
                                                JSON.stringify(err)));
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
                    let ps = page_size;
                    let photos = only_files.slice(page * ps, ps);
                    let obj = { short_name: album_name,
                                photos: photos };
                    callback(null, obj);
                }
            });
    });
}

