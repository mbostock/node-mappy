var fs = require("fs"),
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

var canvas = new Canvas(w, h),
    context = canvas.getContext("2d");

image.render(context, done);

function done() {
  var out = fs.createWriteStream("/tmp/test.png")
  canvas.createPNGStream().on("data", function(chunk) {
    out.write(chunk);
  });
}
