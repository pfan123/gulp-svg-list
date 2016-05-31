'use strict';
var through = require("through-gulp"); 
var fs = require('fs');
var path = require("path");
var cheerio = require('cheerio')
var gutil = require('gulp-util');

/**
 * [writeToFile 写入文件]
 * @param  {[type]} data [数组数据列表或对象列表]
 * @param  {[type]} path [写入的路径]
 */
function writeToFile(data,path,calllback){
    var data = JSON.stringify(data,null, "\t");
    fs.writeFile(path,data,"utf-8",function(err){
        if(err) throw err;
        calllback && calllback();
    });
}



function convertSvgData(opts) {
  var  mergeBool = opts.mergeBool || false;
  var fileList,i = 0;
  if(mergeBool){
    fileList = []
  }else{
    fileList = {}
  }

  //通过through创建流stream
  var stream = through(function(file, encoding,callback) {
    
    //进程文件判断
    if (file.isNull()) {
         throw "NO Files,Please Check Files!"
    }

    var dir = path.basename(file.path);  //文件夹
    var extName = path.extname(file.path); //后缀名
    var fileName = path.basename(file.path,extName); //文件名
    var cate = file.path.split(/[\/,\\]/);

    //增加数据
    function addList(){
        var $ = cheerio.load(content.toString("utf-8"));
        var viewbox = $("svg").attr("viewbox");

        if(Number(viewbox.split(" ")[2])%1 != 0 || Number(viewbox.split(" ")[3])%1 != 0 ){
          gutil.log(gutil.colors.red("Warning! "+ fileName + ".svg文件svg宽度高度值不为整数，请调整修正。"));
        }

        if(mergeBool){
            fileList.push({"name":fileName,size:viewbox.split(" ")[2]+"x"+viewbox.split(" ")[3]});       
        }else{
        
            if(typeof fileList[cate[cate.length-2]] == "undefined"){fileList[cate[cate.length-2]] = []}
            fileList[cate[cate.length-2]].push({"name":fileName,size:viewbox.split(" ")[2]+"x"+viewbox.split(" ")[3]});
        }
        

             
    }

    if (file.isBuffer()) {
        
        //拿到单个文件buffer
        var content = file.contents;

        extName = extName.replace(".","").toLowerCase();

        addList(); 
    }
    if (file.isStream()) {
        var content = fs.readFileSync(file.path).toString("utf-8");

        addList();     
    }

      this.push(file);

      i++;

      callback();
    },function(callback) {
     
     //判断对象属性值长度
      var k = 0;
      for(var key in fileList){
        
        k++;
        
        //删除多余文件
        fs.exists(path.join(opts.outPath,key), function (exists) {
          if(exists){fs.rmdir(path.join(opts.outPath,key))}
        });

      }
      fs.exists(path.join(opts.outPath,"svg-symbols.css"), function(exists) { 
         if(exists){fs.unlinkSync(path.join(opts.outPath,"svg-symbols.css"))}
      });
      if(k === 1){
           for(var key in fileList){
            fileList = fileList[key]
          }       
      }
      

      writeToFile(fileList,path.join(opts.outPath,opts.outFilename),function(){
        gutil.log(gutil.colors.red(i)+gutil.colors.green("个文件已经处理完毕，写入列表！"));
      })
      
      callback();
    });
  
  //返回这个流文件
  return stream;
};
  
module.exports = convertSvgData;
