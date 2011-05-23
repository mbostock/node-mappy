module.exports = function(template) {
  var hosts = [],
      repeat = true;

  function format(c) {
    var max = c[2] < 0 ? 1 : 1 << c[2],
        column = c[0];
    if (repeat) {
      column = c[0] % max;
      if (column < 0) column += max;
    } else if ((column < 0) || (column >= max)) {
      return null;
    }
    return template.replace(/{(.)}/g, function(s, v) {
      switch (v) {
        case "S": return hosts[(Math.abs(c[2]) + c[1] + column) % hosts.length];
        case "Z": return c[2];
        case "X": return column;
        case "Y": return c[1];
        case "B": {
          var nw = po.map.coordinateLocation([column, c[1], c[2]]),
              se = po.map.coordinateLocation([column + 1, c[1] + 1, c[2]]),
              pn = Math.ceil(Math.log(c[2]) / Math.LN2);
          return se.lat.toFixed(pn)
              + "," + nw.lon.toFixed(pn)
              + "," + nw.lat.toFixed(pn)
              + "," + se.lon.toFixed(pn);
        }
      }
      return v;
    });
  }

  format.template = function(x) {
    if (!arguments.length) return template;
    template = x;
    return format;
  };

  format.hosts = function(x) {
    if (!arguments.length) return hosts;
    hosts = x;
    return format;
  };

  format.repeat = function(x) {
    if (!arguments.length) return repeat;
    repeat = x;
    return format;
  };

  return format;
};
