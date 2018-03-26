// ---- LOCAL DEBUGGING CONFIGURATION ------- //

// function callback(error, message){
//     console.log(message);
//     process.exit();
// };

// ---- END OF LOCAL DEBUGGING CONFIGURATION ------- //

var mysql = require("mysql");
var AWS = require('aws-sdk');
const constants = require('./config');

var DB_DETAILS =  {
    host: null,
    user: null,
    password: null,
    database: null
},
s3_cover_image_base_url = null;

var ssm = new AWS.SSM(),
params = {
    Names: [ 
        constants.DB_HOST,
        constants.DB_USER,
        constants.DB_PASSWORD,
        constants.DB_DATABASE,
        constants.S3_COVER_BASE_URL
    ],
    WithDecryption: true
}, 
db = null; //we will populate this object with a connection from RDS.


exports.handler = function(event, context, callback) {
    //this parameter immediately return our response as soon as callback is called
    context.callbackWaitsForEmptyEventLoop = false;
    
    ssm.getParameters(params, function(err, data) {
        if (err){
            //not doing anything here, 
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
                    
                    case constants.S3_COVER_BASE_URL:
                    s3_cover_image_base_url = param.Value;
                    break;
                    
                    default:
                    break;
                }
            });
            
            //our database configuration. I am using an RDS MySQL instance on AWS
            db = mysql.createConnection(DB_DETAILS);
            
            if ( typeof db !== 'undefined' && db ){
                //proceed with API
                db.query(
                    `select id, name, concat('${s3_cover_image_base_url}', cover_image) as cover_image from category`,
                    [],
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
                
            }else{
                let response = {
                    "status": 0,
                    "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                    "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                    "data": null,
                    "err": "could not connect to the database"
                }
                callback(null, response);
            }
            
        }
    });
    
}




