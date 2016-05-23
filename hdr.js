/***************************

* This file batch-processes a folder, merging together HDR jpegs of given number exposures 
* (defaults to 2) and moves resulting jpegs to "enfused" folder in same directory

* Usage: 
*
*  - Capture HDR's (multiple images of different exposure but same composition) in camera
*  - Transfer to a folder on computer, make sure all images to be enfused end with ".JPG", are sequential and all have same # exposures
*  - Drag this script inside folder of HDR images
*  - Modify constants in this script as you see fit (e.g. if each HDR is 5 exposures, change numExposures to 5 instead of 2 default)
*  - Run in terminal "node {path}" (where {path} is the path to this script. An example of {path} would be "~/Desktop/My HDR Batch/hdr.js")
*  - Terminal should output progress, and if all goes well, the resulting HDR's should be in a folder called "enfused"
*

***************************/

//constants    
var command = "enfuse",
    path = process.cwd()+"/",
    folder_name = "enfused",
    numExposures = 2;

//requires
var fs = require("fs"),
    spawn = require('child_process').spawn;

//get all jpegs
var files = fs.readdirSync(path).filter(function(a){ return a.indexOf(".JPG") !== -1 });

if(!files.length) 
{
  console.log("Error: No jpegs in current directory. Move this script to the directory of jpegs.")
}

else
{ 
  
  console.log("");
  
  var i = 0,
      num = Math.floor(files.length/numExposures);
  (function loop()
  {
    var arr = [],
        str = "";
        
    for(var j = 0; j < numExposures; j++){ arr.push(files[i+j]) };
              
    var o = enfuse(arr, 
    
    function(data)
    {
      // console.log(data.toString());
    }, 
    function(data)
    {
      if(!str)
      {
        str = "";
        str += "Enfusing ";
        for(k in arr) str += " " + arr[k];
        process.stdout.write(str + "\n");
        process.stdout.write(+ ((i/numExposures) + 1) + " of " + num);
        process.stdout.write(progress( (((i/numExposures)+1)/num)*100 ) + "\n");
      }
      
    }, 
    function(err)
    {
      str = "";
      
      //do next, or if none, move enfused to new folder "enfused" in this directory
      if(!err) 
      {
        //clears 2 lines
        process.stdout.write('\r\x1b[1A\x1b[2K'+'\x1b[1A\x1b[2K');
        i += numExposures;
        loop();
      }
      else
      {
        var outputs = fs.readdirSync(path).filter(function(a){ return a.indexOf("enfused.jpg") !== -1 });
        var new_dir = path + folder_name;
                
        //make dir
        if(!fs.existsSync(new_dir)) fs.mkdirSync(new_dir);
        
        //move files to dir
        outputs.forEach(function(str)
        {
          var new_str = str.split("/");
          new_str.splice(new_str.length-1,0,folder_name);
          new_str = new_str.join("/");
          fs.renameSync(str, new_str);
        });
        
        console.log("\nMoved enfused images to new folder",new_dir,"\n");
      }
    });
  })();

  function enfuse(arr, out, err, finish)
  {
    if(!arr[arr.length-1] || !arr[0]) return finish(true);
    
    var output = arr[0].replace(".JPG", "") + "_enfused.jpg";
        
    var args = arr.concat("-o", output);
        
    var enfuse = spawn(command, args);
      
    //handle progress (for some reason all output is an stderr)
    enfuse.stdout.on('data', out);
    enfuse.stderr.on('data', err);
    enfuse.on("exit", finish);  
    
    return output;
  }
  
  function progress(percent, max, character)
  {
    var character = character || "x",
        str = " [ ",
        max = max || 50;
        
    for(var i = 0, e = percent/(100/max); i < e; i++) str += character;  
    for(; i < max; i++) str += " ";
    str += " ] "+Math.round(percent)+"% complete";
    
    return str;
  }
}
