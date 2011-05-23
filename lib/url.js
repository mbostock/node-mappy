module.exports = function(template) {
  var hosts = [];

  function format(c) {
    return template.replace(/{(.)}/g, function(s, v) {
      switch (v) {
        case "X": return c[0];
        case "Y": return c[1];
        case "Z": return c[2];
        case "S": return hosts[Math.abs(c[0] + c[1] + c[2]) % hosts.length];
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

  return format;
};
