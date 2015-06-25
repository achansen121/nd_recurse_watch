
var EventEmitter, path, fs;

path = require('path');
fs   = require('fs');
EventEmitter =  require('events').EventEmitter;

var watch, default_opt, traverse;

default_opt = {
  follow_sym_links:false,
  maxdepth:10,
  send_initial_event:false,
};

traverse = require("./lib/traversedir/traversedir.js");


watch = function(dir,opt){
  var out, td, addwatch
  opt = opt || {};
  dir = path.resolve(dir);
  
  for(var k in default_opt){
    if(typeof opt[k]==typeof undefined)
      opt[k] = default_opt[k];
  }
  
  out = new EventEmitter();
  out.watcher={};
  out.settings = opt;
  
  addwatch=function(fabs){
    if(out.watcher[fabs])
      return;
    out.watcher[fabs] = function(event, filename){
      var fcabs = path.join(fabs, filename);
      out.emit("change",fcabs);
      fs.stat(fcabs,function(err,stats){
        out.emit("changestat",fcabs,stats);
        if(err)
          return out.emit("error",err);
        if(stats.isDirectory())
          addwatch(fcabs);
      });
    };
    fs.watch(fabs, out.watcher[fabs]);
  };
  
  td = traverse(dir, opt);
  td.on("filestat",function(dpath, fstat){
    if(opt.send_initial_event){
      out.emit("change",dpath);
      out.emit("changestat",dpath,fstat);
    }
    if(!fstat.isDirectory())
      return;
    addwatch(dpath);
  });
  addwatch(dir);
  return out;
};


module.exports = watch;



