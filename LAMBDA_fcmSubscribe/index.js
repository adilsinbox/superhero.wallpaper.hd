// ---- LOCAL DEBUGGING CONFIGURATION ------- //

// var event = {  
//     "body-json": {
//         "fcm": "lskdjflksdfjkdfjdlsfjslkfjfldkjdl",
//         "mobile_id": "9892216536"
//     }
// };

// function callback(error, message){
//     console.log(message);
//     process.exit();
// };

// ---- END OF LOCAL DEBUGGING CONFIGURATION ------- //

//we will be using the following 3 plugins. 
var admin = require("firebase-admin");
var mysql = require("mysql");
var moment = require("moment");
var AWS = require('aws-sdk');

const constants = require('./config');
//databaseURL below is provided in the FCM console.
admin.initializeApp({
    credential: admin.credential.cert(constants.FCM_SERVICE_ACCOUNT),
    databaseURL: constants.FCM_DB_URL
});
//we are initializing the firebase admin outside of handler function on purpose.
//read more about it here https://groups.google.com/forum/#!topic/firebase-talk/aBonTOiQJWA

var DB_DETAILS =  {
    host: null,
    user: null,
    password: null,
    database: null
};

var ssm = new AWS.SSM(),
params = {
    Names: [ 
        constants.DB_HOST,
        constants.DB_USER,
        constants.DB_PASSWORD,
        constants.DB_DATABASE
    ],
    WithDecryption: true
}, 
db = null; //we will populate this object with a connection from RDS.


exports.handler = (event, context, callback) => {
    
    //setting the below attribute ensures our Lambda function returns control as soon as callback() is invoked
    //it does not wait for empty loop scenarios
    context.callbackWaitsForEmptyEventLoop = false;
    
    //for local console testing we can use below hardcoded values
    // var fcm = 'dnsZAwtjO00:APA91bHiftMExHxxtsmKv-48Wp-t0sa6l3GKuRCqEvErALcPCiZeg2HO84EfXpLLBR90JkfoeHQym95bTTYBxEPjrjdVTok0smu_1Fal_40z8au2QvfFa6yn9P5LybEpLWdUPnUupAK0';
    // var mobile_id = '9848055649e2f783';
    
    //for production lamdba use
    let jsonBody = event['body-json'];
    
    //fcm is the unique token generated for each device by Firebase
    let fcm = jsonBody.fcm;
    //mobile_id is a unique device identifier generated for each device
    let mobile_id = jsonBody.mobile_id;
    
    ssm.getParameters(params, function(err, data) {
        if (err){
            let response = {
                "status": 0,
                "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                "data": null,
                "err": err
            }
            //delete the firebase object. This is especially important in lambda
            //admin.app('[DEFAULT]').delete();
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
                    
                    default:
                    break;
                }
            });
            
            //our database configuration. I am using an RDS MySQL instance on AWS
            db = mysql.createConnection(DB_DETAILS);
            
            db.query(
                "SELECT * FROM user WHERE mobile_id = ?",
                [mobile_id],
                function (err, users) {
                    //delete the firebase object. This is especially important in lambda
                    //admin.app('[DEFAULT]').delete();
                    if(err){
                        
                        //closing the db connection to avoid error 1040 (too many connections error from MySQL RDS)
                        //need to test this with at least 1000 concurrent invocations to this lambda function.
                        db.end();
                        
                        let response = {
                            "status": 0,
                            "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                            "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                            "data": null,
                            "err": err
                        }
                        callback(null, response);
                    }else{
                        
                        if (users.length > 0) {
                            //if the mobile_id already exists in our database, simply update the FCM token for all matching mobile_ids
                            db.query(
                                "UPDATE user SET fcm = ?, updated_on = ? WHERE mobile_id = ?",
                                [fcm, moment().format("YYYY-MM-DD HH:mm:ss"), mobile_id],
                                function (err, status) {
                                    
                                    //closing the db connection to avoid error 1040 (too many connections error from MySQL RDS)
                                    //need to test this with at least 1000 concurrent invocations to this lambda function.
                                    db.end();
                                    
                                    if(err){
                                        
                                        //delete the firebase object. This is especially important in lambda
                                        //admin.app('[DEFAULT]').delete();
                                        let response = {
                                            "status": 0,
                                            "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                            "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                            "data": null,
                                            "err": err
                                        }
                                        callback(null, response);
                                    }else{
                                        //subcribe to the 'general' topic in FCM. 
                                        admin.messaging().subscribeToTopic(fcm, "general")
                                        .then(function (fcmResp) {
                                            //delete the firebase object. This is especially important in lambda
                                            //admin.app('[DEFAULT]').delete();
                                            
                                            let response = {
                                                "status": 1,
                                                "msg": "fcm subscribed sucessfully",
                                                "mobile_msg": "fcm subscribed sucessfully",
                                                "data": fcmResp,
                                                "err": null
                                            }
                                            callback(null, response);
                                        })
                                        .catch(function (fcmError) {
                                            //delete the firebase object. This is especially important in lambda
                                            //admin.app('[DEFAULT]').delete();
                                            
                                            let response = {
                                                "status": 0,
                                                "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                "data": null,
                                                "err": fcmError
                                            }
                                            callback(null, response);
                                        });
                                    }
                                });
                            } else {
                                //the passed mobile_id does not exist in our DB. So, we create a fresh entry
                                var data = {
                                    "fcm": fcm,
                                    "mobile_id": mobile_id,
                                    "added_on": moment().format("YYYY-MM-DD HH:mm:ss"),
                                    "updated_on": moment().format("YYYY-MM-DD HH:mm:ss")
                                };
                                
                                db.query(
                                    "INSERT INTO user set ? ",
                                    data,
                                    function (err, status) {
                                        
                                        //closing the db connection to avoid error 1040 (too many connections error from MySQL RDS)
                                        //need to test this with at least 1000 concurrent invocations to this lambda function.
                                        db.end();
                                        
                                        if (err) {
                                            //delete the firebase object. This is especially important in lambda
                                            //admin.app('[DEFAULT]').delete();
                                            let response = {
                                                "status": 0,
                                                "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                "data": null,
                                                "err": err
                                            }
                                            callback(null, response);
                                        } else {
                                            //subcribe to the 'general' topic in FCM. 
                                            admin.messaging().subscribeToTopic(fcm, "general")
                                            .then(function (fcmResp) {
                                                //delete the firebase object. This is especially important in lambda
                                                //admin.app('[DEFAULT]').delete();
                                                
                                                let response = {
                                                    "status": 1,
                                                    "msg": "fcm subscribed sucessfully",
                                                    "mobile_msg": "fcm subscribed sucessfully",
                                                    "data": fcmResp,
                                                    "err": null
                                                }
                                                callback(null, response);
                                            })
                                            .catch(function (fcmError) {
                                                //delete the firebase object. This is especially important in lambda
                                                //admin.app('[DEFAULT]').delete();
                                                
                                                let response = {
                                                    "status": 0,
                                                    "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                    "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                    "data": null,
                                                    "err": fcmError
                                                }
                                                callback(null, response);
                                            });
                                        }
                                    }
                                );
                            }
                        }
                    }
                    
                );
                
            }
        });
        
    }
    
    