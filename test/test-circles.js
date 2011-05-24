require("../lib/env-js/envjs/node");
require("../lib/d3/d3");
require("../lib/d3/d3.geo");

var fs = require("fs"),
    util = require("util"),
    mappy = require("../"),
    Canvas = require("canvas"),
    Image = Canvas.Image;

var w = 1280,
    h = 720,
    lon = -122.41948,
    lat = 37.76487;

var project = d3.geo.mercator()
    .scale(1)
    .translate([.5, .5]);

var view = mappy.view()
    .size([w, h])
    .center(project([lon, lat]))
    .zoom(12);

var image = mappy.image()
    .view(view)
    .url(mappy.url("http://{S}tile.cloudmade.com"
    + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
    + "/999/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""]));

var canvas = new Canvas(w, h),
    context = canvas.getContext("2d");

// Set circle drawing style.
context.strokeStyle = "rgb(189, 130, 49)";
context.fillStyle = "rgba(132, 91, 34, .4)";
context.lineWidth = 1.5;

// Generate 1000 random locations using the Box-Muller method.
var circles = d3.range(1000).map(function() {
  var u = .06 * Math.sqrt(-2 * Math.log(Math.random())),
      v = 2 * Math.PI * Math.random();
  return [lon + u * Math.cos(v), lat + u * Math.sin(v)];
});

image.render(context, function() {
  circles.forEach(function(location) {
    var point = view.point(project(location));
    context.beginPath();
    context.arc(point[0], point[1], 24 * Math.random(), 0, 2 * Math.PI);
    context.fill();
    context.stroke();
  });

  util.log(__dirname + "/circles.png");
  fs.writeFile(__dirname + "/circles.png", canvas.toBuffer());
});
