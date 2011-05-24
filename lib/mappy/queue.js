var http = require("http"),
    url = require("url"),
    util = require("util");

var hosts = {},
    maxActive = 4, // per host
    maxAttempts = 4; // per uri

var headers = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.36 (KHTML, like Gecko) Chrome/13.0.767.1 Safari/534.36"
};

module.exports = function(uri, callback) {
  var uuu = url.parse(uri);

  // Retrieve the host-specific queue.
  var host = hosts[uuu.host] || (hosts[uuu.host] = {
    active: 0,
    queued: []
  });

  // Process the host's queue, perhaps immediately starting our request.
  load.attempt = 0;
  host.queued.push(load);
  process(host);

  // Issue the HTTP request.
  function load() {
    http.get({
      host: uuu.host,
      port: uuu.port,
      path: uuu.pathname + (uuu.search ? "?" + uuu.search : ""),
      headers: headers
    }, ready).on("error", error);
  }

  // Handle the HTTP response.
  function ready(response) {
    var b = new Buffer(+response.headers["content-length"] || 2048), i = 0;
    response.on("data", data).on("end", end);

    // Append each body chunk to our buffer.
    function data(chunk) {
      var n = chunk.length + i;
      if (n > b.length) b.copy(b = new Buffer(1 << Math.ceil(Math.log(n) / Math.LN2)));
      i += chunk.copy(b, i);
    }

    // Hooray, callback our available data!
    function end() {
      util.log(uri);
      host.active--;
      callback(b.slice(0, i));
      process(host);
    }
  }

  // Boo, an error occurred. We should retry, maybe.
  function error(error) {
    host.active--;
    if (++load.attempt < maxAttempts) {
      util.debug("retry " + uuu.host + " #" + load.attempt + ": " + error);
      host.queued.push(load);
    } else {
      util.debug("abort " + uuu.host + ": " + error);
      callback(null);
    }
    process(host);
  }
};

function process(host) {
  if (host.active >= maxActive || !host.queued.length) return;
  host.active++;
  host.queued.pop()();
}
