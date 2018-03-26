// ---- LOCAL DEBUGGING CONFIGURATION ------- //

// var event = {  
//     "body-json": {
//         "category": "1"
//     }
// };

// function callback(error, message){
//     console.log(message);
//     process.exit();
// };

// ---- END OF LOCAL DEBUGGING CONFIGURATION ------- //

var mysql = require("mysql");
var AWS = require('aws-sdk');
const constants = require('./config');

var ssm = new AWS.SSM(),
params = {
    Names: [ 
        constants.DB_HOST,
        constants.DB_USER,
        constants.DB_PASSWORD,
        constants.DB_DATABASE,
        constants.S3_THUMB_URL,
        constants.S3_FULL_URL
    ],
    WithDecryption: true
}, 
db = null; //we will populate this object with a connection from RDS.

var DB_DETAILS =  {
    host: null,
    user: null,
    password: null,
    database: null
},
s3_thumb_url = null,
s3_full_url = null;


exports.handler = function(event, context, callback) {
    //this parameter immediately return our response as soon as callback is called
    context.callbackWaitsForEmptyEventLoop = false;
    
    //get category ID passed as a POST parameter from API gateway
    let jsonBody = event['body-json'];
    const CATEGORY = jsonBody.category;
    
    ssm.getParameters(params, function(err, data) {
        if (err){
            let response = {
                "status": 0,
                "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                "data": null,
                "err": err
            }
            callback(null, response);
        }
        else{
            //successfully retrieved the configuration values, lets identify what is what
            
            
            data.Parameters.map(param => {
                switch(param.Name){
                    case constants.DB_HOST:
                    DB_DETAILS.host = param.Value;
                    break;
                    
                    case constants.DB_USER:
                    DB_DETAILS.user = param.Value;
                    break;
                    
                    case constants.DB_PASSWORD:
                    DB_DETAILS.password = param.Value;
                    break;
                    
                    case constants.DB_DATABASE:
                    DB_DETAILS.database = param.Value;
                    break;
                    
                    case constants.S3_THUMB_URL:
                    s3_thumb_url = param.Value;
                    break;
                    
                    case constants.S3_FULL_URL:
                    s3_full_url = param.Value;
                    break;
                    
                    default:
                    break;
                }
            });
            
            //our database configuration. I am using an RDS MySQL instance on AWS
            db = mysql.createConnection(DB_DETAILS);
            
            db.query(
                `select id, concat('${s3_thumb_url}', name) as thumb, concat('${s3_full_url}', name) as full from image where category_id = ?`,
                [CATEGORY],
                function (err, result, status) {

                    //closing the db connection to avoid error 1040 (too many connections error from MySQL RDS)
                    //need to test this with at least 1000 concurrent invocations to this lambda function.
                    db.end();

                    if(err){
                        let response = {
                            "status": 0,
                            "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                            "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                            "data": null,
                            "err": err
                        }
                        callback(null, response);
                    }else{
                        let response = {
                            "status": 1,
                            "msg": "command completed successfully",
                            "mobile_msg": "command completed successfully",
                            "data": result,
                            "err": null
                        }
                        callback(null, response);
                        
                    }
                }
            );
            
        }
    });
}




