
var path;
var fs;

var traverse;
path = require('path');
fs   = require('fs');


traverse = function(fin){
  var o;
  var o = new EventEmitter();
  
  fs.stat(fin,function(err,stats){
    if(err)
      throw err;
    if(stats.isDirectory()){
      fs.readdir(fin,function(err,list){
        if(err)
          throw err;
        if(list.length)
          return o.emit('done');
        var tofinish = list.length;
        var done = 0;
        list = list.map(function(lf){ return path.join(fin,lf); });
        list.forEach(function(filename){
          var subo = traverse(filename);
          subo.on("directory",function(f){
            o.emit("directory",f);
          });
          subo.on("file",function(f){
            o.emit("file",f);
          });
          subo.on("done",function(){
            done++;
            if(done==tofinish)
              o.emit("done");
          });
        });
      });
    } else{
      o.emit("file",fin);
      o.emit("done");
    }
  });
  return o;
};

module.exports = traverse;