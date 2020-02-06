
exports.version = '0.1.0';

exports.send_failure = function (res, server_code, err) {
    let code = (err.code) ? err.code : err.name;
    res.writeHead(server_code, {"Content-Type": "application/json"});
    res.end(JSON.stringify({error: code, message: err.message}) + "\n");
};

exports.send_success = function (res, data) {
    res.writeHead(200, {"Content-Type": "application/json"});
    let output = { error: null, data: data};
    res.end(JSON.stringify(output) + "\n");
};

exports.make_error = function (err, msg) {
    var e = new Error(msg);
    e.code = err;
    return e;
};

exports.no_such_album = function () {
    return exports.make_error("no_such_album",
                              "The specified album does not exist" );
};

exports.invalid_resource = function() {
    return exports.make_error("invalid_resource",
        "the requested resource does not exist.");
}
