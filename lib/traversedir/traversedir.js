
var fs=require("fs");
var path=require("path");
var selff, _toabs, path, gen_stat_cb, throwit, nothing;
var EventEmitter =  require('events').EventEmitter;
_toabs=function(dir){
  return function(fname){
    return path.join(dir,fname)
  };
};

throwit=function(err){
  if(err)
    throw err;
};
nothing=function(){};

var default_set = {
  follow_sym_links:true,
  maxdepth:10,
};

selff=function(dir, settings){
  var settings=settings||{};
  for(var k in default_set){
    if(typeof settings[k]==typeof undefined)
      settings[k]=default_set[k];
  }
  var out = new EventEmitter();
  out.settings=settings;
  
  out.on("error",function(err){
    if(out.listeners("error").length<2)
      throw err;
  });
  
  fs.readdir(dir,function(err,files){
    var cbs;
    if(err)
      return out.emit("error",err);

    files = files.map(_toabs(dir));
    cbs   = files.map(gen_stat_cb(out));
    
    if(!files.length)
      return out.emit("done");
    
    var stating = files.length;
    var dcount = 0;
    var sfunc = "stat";
    if(!settings.follow_sym_links)
      sfunc = "lstat";
    for (var i = 0; i < files.length; i++) {
      fs[sfunc](files[i],cbs[i]);
    }
    out.on("__one_done",function(){
      dcount++;
      if(dcount==stating)
        out.emit("done");
    });
  });
  return out;
};

gen_stat_cb=function(pout){
  
  return function(absname){
    pout.emit("file",absname);
    return function(err,stats){
      if(err){
        return pout.emit("error",err);
      }
      pout.emit("filestat",absname,stats);
      if(stats.isDirectory()){
        var scopy = {};
        for(var k in pout.settings){
          scopy[k]=pout.settings[k];
        }
        scopy.maxdepth--;
        if(scopy.maxdepth>0){
          var subo = selff(absname,scopy);
          subo.on("file",function(file){
            pout.emit("file",file);
          });
          subo.on("filestat",function(file,fstat){
            pout.emit("filestat",file,fstat);
          });
          subo.on("error",function(err){
            pout.emit("error",err);
          });
          subo.on("done",function(){
            pout.emit("__one_done",absname);
          });
        } else
          pout.emit("__one_done",absname);
      }
      else{
        pout.emit("__one_done",absname);
      }
    };
  };
};



module.exports=selff;
