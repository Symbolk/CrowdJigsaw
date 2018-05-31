/**
 * Process images automatically(unfinished)
 */
const glob = require('glob');
var gm = require('gm');

glob('./public/images/*.jpg', function (err, files) {
    if (err) {
        console.log(err);
    } else {
        files.forEach(function(item, index, input){
            //     gm(item)
            // .resize(200,0)     //设置压缩后的w/h
            // .setFormat('JPEG')
            // .quality(70)       //设置压缩质量: 0-100
            // .strip()
            // .autoOrient()
            // .write("压缩后保存路径" , 
            // function(err){console.log("err: " + err);})
            gm(item).size(function (err, value) {
                if(err){
                    console.log(err);
                }else{

                    console.log(value);
                }
            });
            // gm("图片路径").filesize(function(err,value){});
        });
    }
});
