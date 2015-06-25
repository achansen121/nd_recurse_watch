
var traversedir=require("./traversedir.js");
var path = require("path");

var colors = require("colors");





var o = traversedir(path.join(__dirname));

o.on("filestat",function(file){
  console.log(file);
});
o.on("done",function(){
  console.log("done".green.bold);
});

