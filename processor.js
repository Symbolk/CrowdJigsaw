/**
 * Process images automatically(unfinished)
 */
const glob = require('glob');
var gm = require('gm');

glob('./public/images/raw/*.jpg', function (err, files) {
    if (err) {
        console.log(err);
    } else {
        // Generate thumbnails
        files.forEach(function (item, index, input) {
            let path = item.slice(0, item.length - 4);
            if (!path.endsWith("_thumb")) {
                path += "_thumb.jpg";
                console.log(path);
                gm(item)
                    .resize(200, 200)     //设置压缩后的w/h
                    .setFormat('JPEG')
                    .quality(70)       //设置压缩质量: 0-100
                    .strip()
                    .autoOrient()
                    .write(path,
                        function (err) { console.log("err: " + err); })
            }
            // Get image width/height
            // gm(item).size(function (err, value) {
            //     if(err){
            //         console.log(err);
            //     }else{
            //         console.log(value);
            //     }
            // });
            // Get image file size
            // gm("图片路径").filesize(function(err,value){});
        });
    }
});
