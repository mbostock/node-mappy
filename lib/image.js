var Canvas = require("../../node-canvas/lib/canvas"),
    Image = Canvas.Image,
    _cache = require("./cache"),
    _url = require("./url");

module.exports = function() {
  var image = {},
      view,
      url,
      zoom;
//       transform,
//       levelZoom;

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
    var viewZoom = view.zoom(),
        viewZoomFraction = viewZoom - (viewZoom = Math.round(viewZoom)),
        viewSize = view.size(),
        viewAngle = view.angle(),
        tileSize = view.tileSize(),
        tileCenter = view.locationCoordinate(view.center());

    // get the coordinates of the four corners
    var c0 = view.pointCoordinate(tileCenter, [0, 0]),
        c1 = view.pointCoordinate(tileCenter, [viewSize[0], 0]),
        c2 = view.pointCoordinate(tileCenter, [viewSize[0], viewSize[1]]),
        c3 = view.pointCoordinate(tileCenter, [0, viewSize[1]]);

    // TODO layer-specific coordinate transform
//     if (transform) {
//       c0 = transform.unapply(c0);
//       c1 = transform.unapply(c1);
//       c2 = transform.unapply(c2);
//       c3 = transform.unapply(c3);
//       tileCenter = transform.unapply(tileCenter);
//     }

    // layer-specific zoom transform
    var tileLevel = zoom ? zoom(c0[2]) - c0[2] : 0;
    if (tileLevel) {
      var k = Math.pow(2, tileLevel);
      c0[0] *= k;
      c1[0] *= k;
      c2[0] *= k;
      c3[0] *= k;
      c0[1] *= k;
      c1[1] *= k;
      c2[1] *= k;
      c3[1] *= k;
      c0[2] =
      c1[2] =
      c2[2] =
      c3[2] += tileLevel;
    }

    // load the tiles!
    var loading = 0, z = c0[2], ymax = z < 0 ? 1 : 1 << z;
    scanTriangle(c0, c1, c2, 0, ymax, scanLine);
    scanTriangle(c2, c3, c0, 0, ymax, scanLine);

    // scan-line conversion
    function scanLine(x0, x1, y) {
      for (var x = x0; x < x1; x++) {
        load([x, y, z]);
      }
    }

    // load a tile from the cache and draw it to the context
    function load(tile) {
      loading++;
      _cache(url(tile), function(buffer) {
        var image = new Image(), k = Math.pow(2, viewZoomFraction);
        image.src = buffer;
        context.save();
        context.translate(viewSize[0] / 2, viewSize[1] / 2);
        context.rotate(viewAngle);
        context.scale(k, k);
        // TODO transform
        context.drawImage(
            image,
            tileSize[0] * (tile[0] - tileCenter[0]),
            tileSize[1] * (tile[1] - tileCenter[1]),
            tileSize[0],
            tileSize[1]);
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
function scanSpans(e0, e1, ymin, ymax, scanLine) {
  var y0 = Math.max(ymin, Math.floor(e1.y0)),
      y1 = Math.min(ymax, Math.ceil(e1.y1));

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
    var x0 = m0 * Math.max(0, Math.min(e0.dy, y + d0 - e0.y0)) + e0.x0,
        x1 = m1 * Math.max(0, Math.min(e1.dy, y + d1 - e1.y0)) + e1.x0;
    scanLine(Math.floor(x1), Math.ceil(x0), y);
  }
}

// scan-line conversion
function scanTriangle(a, b, c, ymin, ymax, scanLine) {
  var ab = edge(a, b),
      bc = edge(b, c),
      ca = edge(c, a);

  // sort edges by y-length
  if (ab.dy > bc.dy) { var t = ab; ab = bc; bc = t; }
  if (ab.dy > ca.dy) { var t = ab; ab = ca; ca = t; }
  if (bc.dy > ca.dy) { var t = bc; bc = ca; ca = t; }

  // scan span! scan span!
  if (ab.dy) scanSpans(ca, ab, ymin, ymax, scanLine);
  if (bc.dy) scanSpans(ca, bc, ymin, ymax, scanLine);
}
