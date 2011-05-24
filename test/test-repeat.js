require("../lib/env-js/envjs/node");
require("../lib/d3/d3");
require("../lib/d3/d3.geo");

var fs = require("fs"),
    util = require("util"),
    mappy = require("../"),
    Canvas = require("canvas");

var w = 1280,
    h = 720;

var project = d3.geo.mercator()
    .scale(1)
    .translate([.5, .5]);

var view = mappy.view()
    .size([w, h])
    .center(project([-122.41948, 37.76487]))
    .zoom(1);

var url = mappy.url("http://{S}tile.cloudmade.com"
    + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
    + "/998/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""]);

var image = mappy.image()
    .view(view)
    .url(url);

var canvas = new Canvas(w, h),
    context = canvas.getContext("2d");

image.render(context, function() {
  util.log(__dirname + "/repeat.png");
  fs.writeFile(__dirname + "/repeat.png", canvas.toBuffer());
});
