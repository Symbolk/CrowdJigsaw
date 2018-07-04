/**
 * Process images automatically
 */
const glob = require('glob');
var gm = require('gm');

function checkSizes(folder) {
    glob(folder, function (err, files) {
        if (err) {
            console.log(err);
        } else {
            // Get image width/height
            files.forEach(function (item, index, input) {
                if (!item.endsWith("_thumb.jpg")) {
                    gm(item).size(function (err, value) {
                        if (err) {
                            console.log(err);
                        } else {
                            if (value.width % 64 != 0 || value.height % 64 != 0) {
                                console.log(item + ': ' + value.width + 'x' + value.height);
                            }
                        }
                    });
                    // Get image file size
                    // gm(pattern).filesize(function(err,value){});
                }
            });
        }
    });
}

function genThumbs(folder) {
    glob(folder, function (err, files) {
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
                        .write(path, err => {
                            if (!err) {
                                console.log('Done: ' + path);
                            } else {
                                console.log(err);
                            }
                        })
                }
            });
        }
    });
}

function genRawImages(srcFolder, dstFolder, min, max) {
    glob(srcFolder, function (err, files) {
        if (err) {
            console.log(err);
        } else {
            // Generate raw images with different sizes
            files.forEach(function (item, index, input) {
                for (let i = min; i <= max; i++) {
                    let name = item.split('/')[item.split('/').length - 1];
                    name = name.slice(0, name.length - 4);
                    let path = dstFolder + name + '_' + i + 'x' + i + '.jpg';
                    gm(item)
                        .resize(64 * i, 64 * i, "!")
                        .setFormat("JPEG")
                        .quality(100)
                        .strip()
                        .autoOrient()
                        .write(path, err => {
                            if (!err) {
                                console.log('Done: ' + path);
                            } else {
                                console.log(err);
                            }
                        });
                    ;
                    //btw, generate the thumbnails
                    let thumbPath = dstFolder + name + '_' + i + 'x' + i + '_thumb.jpg'
                    gm(item)
                        .resize(200, 200)
                        .setFormat('JPEG')
                        .quality(70)
                        .strip()
                        .autoOrient()
                        .write(thumbPath, err => {
                            if (!err) {
                                console.log('Done: ' + path);
                            } else {
                                console.log(err);
                            }
                        });
                }
            });
        }
    });
}
// genThumbs("./public/images/raw/*.jpg");

genRawImages("./public/images/original/pig&angel.jpg", "./public/images/raw/", 4, 10);

// checkSizes("./public/images/raw/*.jpg");