var fs = require("fs"),
    util = require("util"),
    mappy = require("../"),
    Canvas = require("canvas");

var w = 1280,
    h = 720;

var view = mappy.view()
    .size([w, h])
    .center([655, 1583, 12]);

var url = mappy.url("http://{S}tile.cloudmade.com"
    + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
    + "/998/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""]);

var image1 = mappy.image()
    .view(view)
    .zoom(Math.ceil)
    .url(url);

var image2 = mappy.image()
    .view(view)
    .zoom(Math.floor)
    .url(url);

var frame = 0,
    frames = 600;

var canvas = new Canvas(w, h),
    context = canvas.getContext("2d");

context.antialias = "subpixel";

loop();

function loop() {
  var i = ++frame;
  if (i > frames) return;
  context.globalAlpha = 1;
  image1.render(context, function() {
    context.globalAlpha = 1 - Math.max(0, Math.min(1, 5 * (view.center()[2] % 1) - 2));
    image2.render(context, function() {
      util.log(__dirname + "/fade-" + i + ".png");
      fs.writeFile(__dirname + "/fade-" + i + ".png", canvas.toBuffer(), function() {
        view.zoomBy(-.005);
        loop();
      });
    });
  });
}
