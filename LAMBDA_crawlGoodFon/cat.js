// function callback(error, message){
//     console.log(message);
//     process.exit();
// };

var mysql = require("mysql");

const constants = require('./config');

//our database configuration. I am using an RDS MySQL instance on AWS
var config = constants.DB_DETAILS,
db = mysql.createConnection(config);


exports.handler = function(event, context, callback) {
    //this parameter immediately return our response as soon as callback is called
    context.callbackWaitsForEmptyEventLoop = false;
    
    db.query(
        `select id, name, concat('${constants.S3_COVER_BASE_URL}', cover_image) as cover_image from category`,
        [],
        function (err, result, status) {
            if(err){
                // db.end();
                callback(null, {"statusCode": 200, "body": JSON.stringify(err)});
            }else{
                // db.end();
                callback(null, {"statusCode": 200, "body": JSON.stringify(result)});
                
            }
        }
    );
}




