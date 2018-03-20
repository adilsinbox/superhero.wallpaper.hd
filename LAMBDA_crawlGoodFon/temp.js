var axios = require('axios');
var mysql = require("mysql");
const download = require('image-downloader');
var fs = require('fs');
var AWS = require('aws-sdk');

const constants = require('./config');

//our database configuration. I am using an RDS MySQL instance on AWS
var config = constants.DB_DETAILS,
db = mysql.createConnection(config);

AWS.config.update({ accessKeyId: constants.AWS_ACCESS_KEY, secretAccessKey: constants.AWS_SECRET_KEY });

db.query(
    `select id, name as cover_image from image where thumb_processed = 0`,
    [],
    function (err, result, status) {
        if(err){
            console.log('error while trying to fetch unprocessed fb images');
        }else{
            
            result.map(category => {
                
                // Download to a directory and save with the original filename
                const options = {
                    url: constants.GOODFON_URL + '' + category.cover_image, // add 'thumbs/' if you wnt to download thumbnails here
                    dest: constants.TEMP_IMAGES_DIR + category.cover_image,
                    timeout: 10000
                }
                
                download.image(options)
                .then(({ filename, imageFile }) => {
                    console.log('File saved to', filename); 
                    
                    // Read in the file, convert it to base64, store to S3
                    fs.readFile(filename, function (err, data) {
                        if (err) { throw err; }
                        
                        var base64data = new Buffer(data, 'binary');
                        
                        var s3 = new AWS.S3();
                        s3.putObject({
                            Bucket: constants.S3_BUCKET + '/original', //for thumbs use /300x300 for full use /original
                            Key: category.cover_image,
                            Metadata: {
                                'Content-Type': 'image/jpeg'
                            },
                            'ContentEncoding': 'base64',
                            Body: base64data,
                            ACL: 'public-read'
                        },function (resp) {
                            // console.log(resp);
                            
                            fs.unlinkSync(filename);
                            console.log(`${filename} deleted from local directory`);

                            db.query(
                                `update image set thumb_processed = 1 where id = ?`,
                                [category.id],
                                function (err, status) {
                                    if(err){
                                        console.log('could not update record in fb_images, ImageId: ' + image.id);
                                    }else{
                                        console.log('fb_images updated successfully');
                                        
                                    }
                                }
                            );
                            
                            
                        });
                        
                    });
                    
                    
                    
                    
                    
                })
                .catch((err) => {
                    console.log("error while downloading image");
                })
            })
            
        }
    }
);


