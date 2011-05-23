var http = require("http"),
    url = require("url");

var map = {},
    head = null,
    tail = null,
    size = 512,
    n = 0;

var headers = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.36 (KHTML, like Gecko) Chrome/13.0.767.1 Safari/534.36"
};

module.exports = function(key, callback) {
  var value = map[key];

  // If this value is in the cache…
  if (value) {

    // Move it to the front of the least-recently used list.
    if (value.previous) {
      value.previous.next = value.next;
      if (value.next) value.next.previous = value.previous;
      else tail = value.previous;
      value.previous = null;
      value.next = head;
      head.previous = value;
      head = value;
    }

    // If the value is loaded, callback.
    // Otherwise, add the callback to the list.
    return value.callbacks
        ? value.callbacks.push(callback)
        : callback(value.value);
  }

  // Otherwise, add the value to the cache.
  value = map[key] = {
    key: key,
    next: head,
    previous: null,
    callbacks: [callback]
  };

  // Add the value to the front of the least-recently used list.
  if (head) head.previous = value;
  else tail = value;
  head = value;
  n++;

  // Load the requested resource!
  var u = url.parse(key);
  http.get({
    host: u.host,
    port: u.port,
    path: u.pathname + (u.search ? "?" + u.search : ""),
    headers: headers
  }, function(response) {
    var body = new Buffer(+response.headers['content-length'] || 2048), // TODO realloc
        offset = 0;
    response
        .on("data", function(chunk) {
          offset += chunk.copy(body, offset);
        })
        .on("end", function() {
          body = body.slice(0, offset);
          value.callbacks.forEach(function(callback) { callback(body); });
          delete value.callbacks;
        });
  }).on("error", function(error) {
    callback(null);
  });

  flush();
};

// Flush any extra values.
function flush() {
  for (var value = tail; n > size && value; value = value.previous) {
    n--;
    delete map[value.key];
    if (value.next) value.next.previous = value.previous;
    else if (tail = value.previous) tail.next = null;
    if (value.previous) value.previous.next = value.next;
    else if (head = value.next) head.previous = null;
  }
}
