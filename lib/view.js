// Canvas = require("canvas"),

var _view = module.exports = function() {
  var view = {},
      size = [0, 0],
      tileSize = [256, 256],
      ymin = -180, // lat2y(centerRange[0][1])
      ymax = 180, // lat2y(centerRange[1][1])
      center = [-122.41948, 37.76487],
      centerRange = [[-Infinity, y2lat(ymin)], [Infinity, y2lat(ymax)]],
      zoom = 12,
      zoomFraction = 0,
      zoomFactor = 1, // Math.pow(2, zoomFraction)
      zoomRange = [1, 18],
      angle = 0,
      angleCos = 1, // Math.cos(angle)
      angleSin = 0, // Math.sin(angle)
      angleCosi = 1, // Math.cos(-angle)
      angleSini = 0; // Math.sin(-angle)

  view.locationCoordinate = function(l) {
    var c = _view.locationCoordinate(l),
        k = Math.pow(2, zoom);
    return [c[0] * k, c[1] * k, c[2] + zoom];
  };

  view.coordinateLocation = _view.coordinateLocation;

  view.coordinatePoint = function(tileCenter, c) {
    var kc = Math.pow(2, zoom - c[2]),
        kt = Math.pow(2, zoom - tileCenter[2]),
        dx = (c[0] * kc - tileCenter[0] * kt) * tileSize[0] * zoomFactor,
        dy = (c[1] * kc - tileCenter[1] * kt) * tileSize[1] * zoomFactor;
    return [
      size[0] / 2 + angleCos * dx - angleSin * dy,
      size[1] / 2 + angleSin * dx + angleCos * dy
    ];
  };

  view.pointCoordinate = function(tileCenter, p) {
    var kt = Math.pow(2, zoom - tileCenter[2]),
        dx = (p[0] - size[0] / 2) / zoomFactor,
        dy = (p[1] - size[1] / 2) / zoomFactor;
    return [
      tileCenter[0] * kt + (angleCosi * dx - angleSini * dy) / tileSize[0],
      tileCenter[1] * kt + (angleSini * dx + angleCosi * dy) / tileSize[1],
      zoom
    ];
  };

  view.locationPoint = function(l) {
    var k = Math.pow(2, zoom + zoomFraction - 3) / 45,
        dx = (l[0] - center[0]) * k * tileSize[0],
        dy = (lat2y(center[1]) - lat2y(l[1])) * k * tileSize[1];
    return [
      size[0] / 2 + angleCos * dx - angleSin * dy,
      size[1] / 2 + angleSin * dx + angleCos * dy
    ];
  };

  view.pointLocation = function(p) {
    var k = 45 / Math.pow(2, zoom + zoomFraction - 3),
        dx = (p[0] - size[0] / 2) * k,
        dy = (p[1] - size[1] / 2) * k;
    return [
      center[0] + (angleCosi * dx - angleSini * dy) / tileSize[0],
      y2lat(lat2y(center[1]) - (angleSini * dx + angleCosi * dy) / tileSize[1])
    ];
  };

  function rezoom() {
    if (zoomRange) {
      if (zoom < zoomRange[0]) zoom = zoomRange[0];
      else if (zoom > zoomRange[1]) zoom = zoomRange[1];
    }
    zoomFraction = zoom - (zoom = Math.round(zoom));
    zoomFactor = Math.pow(2, zoomFraction);
  }

  function recenter() {
    if (!centerRange) return;
    var k = 45 / Math.pow(2, zoom + zoomFraction - 3);

    // constrain latitude
    var y = Math.max(Math.abs(angleSin * size[0] / 2 + angleCos * size[1] / 2),
                     Math.abs(angleSini * size[0] / 2 + angleCosi * size[1] / 2)),
        lat0 = y2lat(ymin - y * k / tileSize[1]),
        lat1 = y2lat(ymax + y * k / tileSize[1]);
    center[1] = Math.max(lat0, Math.min(lat1, center[1]));

    // constrain longitude
    var x = Math.max(Math.abs(angleSin * size[1] / 2 + angleCos * size[0] / 2),
                     Math.abs(angleSini * size[1] / 2 + angleCosi * size[0] / 2)),
        lon0 = centerRange[0][0] - x * k / tileSize[0],
        lon1 = centerRange[1][0] + x * k / tileSize[0];
    center[0] = Math.max(lon0, Math.min(lon1, center[0]));
 }

  view.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    recenter();
    return view;
  };

  view.tileSize = function(x) {
    if (!arguments.length) return tileSize;
    tileSize = x;
    recenter();
    return view;
  };

  view.center = function(x) {
    if (!arguments.length) return center;
    center = x;
    recenter();
    return view;
  };

  view.panBy = function(x) {
    var k = 45 / Math.pow(2, zoom + zoomFraction - 3),
        dx = x[0] * k,
        dy = x[1] * k;
    return view.center([
      center[0] + (angleSini * dy - angleCosi * dx) / tileSize[0],
      y2lat(lat2y(center[1]) + (angleSini * dx + angleCosi * dy) / tileSize[1])
    ]);
  };

  view.centerRange = function(x) {
    if (!arguments.length) return centerRange;
    centerRange = x;
    if (centerRange) {
      ymin = centerRange[0][1] > -90 ? lat2y(centerRange[0][1]) : -Infinity;
      ymax = centerRange[0][1] < 90 ? lat2y(centerRange[1][1]) : Infinity;
    } else {
      ymin = -Infinity;
      ymax = Infinity;
    }
    recenter();
    return view;
  };

  view.zoom = function(x) {
    if (!arguments.length) return zoom + zoomFraction;
    zoom = x;
    rezoom();
    return view.center(center);
  };

  view.zoomBy = function(z, x0, l) {
    if (arguments.length < 2) return view.zoom(zoom + zoomFraction + z);

    // compute the location of x0
    if (arguments.length < 3) l = view.pointLocation(x0);

    // update the zoom level
    zoom = zoom + zoomFraction + z;
    rezoom();

    // compute the new point of the location
    var x1 = view.locationPoint(l);
    return view.panBy([x0[0] - x1[0], x0[1] - x1[1]]);
  };

  view.zoomRange = function(x) {
    if (!arguments.length) return zoomRange;
    zoomRange = x;
    return view.zoom(zoom + zoomFraction);
  };

  view.extent = function(x) {
    if (!arguments.length) return [
      view.pointLocation([0, size[1]]),
      view.pointLocation([size[0], 0])
    ];

    // compute the extent in points, scale factor, and center
    var bl = view.locationPoint(x[0]),
        tr = view.locationPoint(x[1]),
        k = Math.max((tr[0] - bl[0]) / size[0], (bl[1] - tr[1]) / size[1]),
        l = view.pointLocation([(bl[0] + tr[0]) / 2, (bl[1] + tr[1]) / 2]);

    // update the zoom level
    zoom = zoom + zoomFraction - Math.log(k) / Math.LN2;
    rezoom();

    // set the new center
    return view.center(l);
  };

  view.angle = function(x) {
    if (!arguments.length) return angle;
    angle = x;
    angleCos = Math.cos(angle);
    angleSin = Math.sin(angle);
    angleCosi = Math.cos(-angle);
    angleSini = Math.sin(-angle);
    recenter();
    return view;
  };

  return view;
};

function y2lat(y) {
  return 360 / Math.PI * Math.atan(Math.exp(y * Math.PI / 180)) - 90;
}

function lat2y(lat) {
  return 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
}

_view.locationCoordinate = function(l) {
  var k = 1 / 360;
  return [
    (l[0] + 180) * k,
    (180 - lat2y(l[1])) * k,
    0
  ];
};

_view.coordinateLocation = function(c) {
  var k = 45 / Math.pow(2, c[2] - 3);
  return [
    k * c[0] - 180,
    y2lat(180 - k * c[1])
  ];
};
