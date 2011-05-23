var Canvas = require("../../node-canvas/lib/canvas"),
    Image = Canvas.Image,
    _cache = require("./cache"),
    _url = require("./url");

module.exports = function() {
  var image = {},
      view,
      url,
      zoom;

  image.view = function(x) {
    if (!arguments.length) return view;
    view = x;
    return image;
  };

  image.url = function(x) {
    if (!arguments.length) return url;
    url = typeof x === "string" && /{.}/.test(x) ? _url(x) : x;
    return image;
  };

  image.zoom = function(x) {
    if (!arguments.length) return zoom;
    zoom = x;
    return image;
  };

  image.render = function(context, callback) {
    var viewSize = view.size(),
        viewAngle = view.angle(),
        viewCenter = view.center(),
        viewZoom = viewCenter[2],
        viewScale = Math.pow(2, viewZoom - (viewZoom = Math.round(viewZoom))),
        coordinateSize = view.coordinateSize();

    // get the coordinates of the four corners
    var c0 = view.coordinate([0, 0]),
        c1 = view.coordinate([viewSize[0], 0]),
        c2 = view.coordinate([viewSize[0], viewSize[1]]),
        c3 = view.coordinate([0, viewSize[1]]);

    // apply the optional zoom offset
    var zoomOffset = zoom ? zoom(viewZoom) - viewZoom : 0;
    if (zoomOffset) {
      var k = Math.pow(2, zoomOffset);
      c0[0] *= k; c1[0] *= k; c2[0] *= k; c3[0] *= k;
      c0[1] *= k; c1[1] *= k; c2[1] *= k; c3[1] *= k;
      c0[2] =     c1[2] =     c2[2] =     c3[2] += zoomOffset;
    }

    // load the tiles!
    var loading = 0, z = c0[2];
    scanTriangle(c0, c1, c2, load);
    scanTriangle(c2, c3, c0, load);

    // load a tile from the cache and draw it to the context
    function load(x, y) {
      loading++;

      _cache(url([x, y, z]), function(buffer) {
        var image = new Image();
        image.src = buffer;

        // TODO proper transform
        context.save();
        context.translate(viewSize[0] / 2, viewSize[1] / 2);
        context.rotate(viewAngle);
        context.scale(viewScale, viewScale);

        context.drawImage(
            image,
            coordinateSize[0] * (x - viewCenter[0]),
            coordinateSize[1] * (y - viewCenter[1]),
            coordinateSize[0],
            coordinateSize[1]);

        context.restore();

        if (!--loading && callback) callback();
      });
    }

    return image;
  };

  return image;
};

// scan-line conversion
function edge(a, b) {
  if (a[1] > b[1]) { var t = a; a = b; b = t; }
  return {
    x0: a[0],
    y0: a[1],
    x1: b[0],
    y1: b[1],
    dx: b[0] - a[0],
    dy: b[1] - a[1]
  };
}

// scan-line conversion
function scanSpans(e0, e1, load) {
  var y0 = Math.floor(e1.y0),
      y1 = Math.ceil(e1.y1);

  // sort edges by x-coordinate
  if ((e0.x0 == e1.x0 && e0.y0 == e1.y0)
      ? (e0.x0 + e1.dy / e0.dy * e0.dx < e1.x1)
      : (e0.x1 - e1.dy / e0.dy * e0.dx < e1.x0)) {
    var t = e0; e0 = e1; e1 = t;
  }

  // scan lines!
  var m0 = e0.dx / e0.dy,
      m1 = e1.dx / e1.dy,
      d0 = e0.dx > 0, // use y + 1 to compute x0
      d1 = e1.dx < 0; // use y + 1 to compute x1
  for (var y = y0; y < y1; y++) {
    var x0 = Math.ceil(m0 * Math.max(0, Math.min(e0.dy, y + d0 - e0.y0)) + e0.x0),
        x1 = Math.floor(m1 * Math.max(0, Math.min(e1.dy, y + d1 - e1.y0)) + e1.x0);
    for (var x = x1; x < x0; x++) {
      load(x, y);
    }
  }
}

// scan-line conversion
function scanTriangle(a, b, c, load) {
  var ab = edge(a, b),
      bc = edge(b, c),
      ca = edge(c, a);

  // sort edges by y-length
  if (ab.dy > bc.dy) { var t = ab; ab = bc; bc = t; }
  if (ab.dy > ca.dy) { var t = ab; ab = ca; ca = t; }
  if (bc.dy > ca.dy) { var t = bc; bc = ca; ca = t; }

  // scan span! scan span!
  if (ab.dy) scanSpans(ca, ab, load);
  if (bc.dy) scanSpans(ca, bc, load);
}