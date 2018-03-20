var axios = require('axios');
var mysql = require("mysql");

const constants = require('./config');

//our database configuration. I am using an RDS MySQL instance on AWS
var config = constants.DB_DETAILS,
db = mysql.createConnection(config);


axios.get('http://wp.lapreprod.net/api.php')
.then(response => {
    // console.log(JSON.stringify(response.data));
    
    response.data.MaterialWallpaper.map(category => {
        console.log(category.category_name);
        
        var data = {
            "name": category.category_name,
            "cover_image": category.category_image
        };
        
        db.query(
            "INSERT INTO category set ?",
            [data],
            function (err, status) {
                if(err){
                    console.log(err.message);
                }else{  
                    console.log(status.insertId);
                    
                    //get images for this category
                    axios.get('http://wp.lapreprod.net/api.php?cat_id='+category.cid)
                    .then(imagesResponse => {
                        // console.log(JSON.stringify(response.data));
                        
                        imagesResponse.data.MaterialWallpaper.map(image => {
                            console.log(image.images);
                            
                            let data = {
                                "name": image.images,
                                "category_id": status.insertId
                            };
                            
                            db.query(
                                "INSERT INTO image set ?",
                                [data],
                                function (err, status) {
                                    if(err){
                                        console.log(err.message);
                                    }else{
                                        console.log(status);
                                    }
                                }
                            );
                            
                            
                        });
                        
                    });
                    
                    
                    
                    
                    
                }
            }
        );
        
        
        
        
        
        
    });
    
    
    
    
});
