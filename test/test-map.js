var fs = require("fs"),
    util = require("util"),
    mappy = require("../"),
    Canvas = require("../../node-canvas/lib/canvas"),
    Image = Canvas.Image;

var w = 1280,
    h = 720;

var view = mappy.view()
    .size([w, h])
    .center([655, 1583, 12]);

var image = mappy.image()
    .view(view)
    .url(mappy.url("http://{S}tile.cloudmade.com"
    + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
    + "/998/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""]));

var frame = 0,
    frames = 1200;

var canvas = new Canvas(w, h),
    context = canvas.getContext("2d");

context.antialias = "subpixel";

loop();

function loop() {
  var i = ++frame;
  if (i > frames) return;
  image.render(context, function() {
    util.log(__dirname + "/" + i + ".png");
    fs.writeFile(__dirname + "/" + i + ".png", canvas.toBuffer(), function() {
      view.zoomBy(-.002).rotateBy(-.001);
      loop();
    });
  });
}
