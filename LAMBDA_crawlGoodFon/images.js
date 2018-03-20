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

    // db.connect();

    const CATEGORY = event["queryStringParameters"]['category'];
    
    db.query(
        `select id, concat('${constants.S3_THUMB_URL}', name) as thumb, concat('${constants.S3_FULL_URL}', name) as full from image where category_id = ?`,
        [CATEGORY],
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




