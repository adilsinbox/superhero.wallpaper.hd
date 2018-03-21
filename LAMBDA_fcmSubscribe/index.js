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

exports.handler = (event, context, callback) => {
    
    //setting the below attribute ensures our Lambda function returns control as soon as callback() is invoked
    //it does not wait for empty loop scenarios
    context.callbackWaitsForEmptyEventLoop = false;
    
    //databaseURL below is provided in the FCM console.
    admin.initializeApp({
        credential: admin.credential.cert(constants.FCM_SERVICE_ACCOUNT),
        databaseURL: constants.FCM_DB_URL
    });
    
    //for local console testing we can use below hardcoded values
    // var fcm = 'dnsZAwtjO00:APA91bHiftMExHxxtsmKv-48Wp-t0sa6l3GKuRCqEvErALcPCiZeg2HO84EfXpLLBR90JkfoeHQym95bTTYBxEPjrjdVTok0smu_1Fal_40z8au2QvfFa6yn9P5LybEpLWdUPnUupAK0';
    // var mobile_id = '9848055649e2f783';
    
    //for production lamdba use
    let jsonBody = event['body-json'];
    
    //fcm is the unique token generated for each device by Firebase
    let fcm = jsonBody.fcm;
    //mobile_id is a unique device identifier generated for each device
    let mobile_id = jsonBody.mobile_id;
    
    
    var ssm = new AWS.SSM();
    var params = {
        Names: [ 
            constants.DB_HOST,
            constants.DB_USER,
            constants.DB_PASSWORD,
            constants.DB_DATABASE
        ],
        WithDecryption: true
    };
    
    
    ssm.getParameters(params, function(err, data) {
        if (err){
            let response = {
                "status": 1,
                "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                "data": null,
                "err": JSON.stringify(err)
            }
            callback(null, response);
        }
        else{
            //successfully retrieved the configuration values, lets identify what is what
            let DB_DETAILS =  {
                host: null,
                user: null,
                password: null,
                database: null
            };
            
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
            let db = mysql.createConnection(DB_DETAILS);
            db.query(
                "SELECT * FROM user WHERE mobile_id = ?",
                [mobile_id],
                function (err, users) {
                    
                    if(err){
                        let response = {
                            "status": 1,
                            "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                            "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                            "data": null,
                            "err": JSON.stringify(err)
                        }
                        callback(null, response);
                    }else{

                        if (users.length > 0) {
                            //if the mobile_id already exists in our database, simply update the FCM token for all matching mobile_ids
                            db.query(
                                "UPDATE user SET fcm = ?, updated_on = ? WHERE mobile_id = ?",
                                [fcm, moment().format("YYYY-MM-DD HH:mm:ss"), mobile_id],
                                function (err, status) {
                                    
                                    if(err){
                                        let response = {
                                            "status": 1,
                                            "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                            "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                            "data": null,
                                            "err": JSON.stringify(err)
                                        }
                                        callback(null, response);
                                    }else{
                                        //subcribe to the 'general' topic in FCM. 
                                        admin.messaging().subscribeToTopic(fcm, "general")
                                        .then(function (fcmResp) {
                                            //delete the firebase object. This is especially important in lambda
                                            admin.app('[DEFAULT]').delete();
                                            
                                            let response = {
                                                "status": 0,
                                                "msg": "fcm subscribed sucessfully",
                                                "mobile_msg": "fcm subscribed sucessfully",
                                                "data": {},
                                                "err": null
                                            }
                                            callback(null, response);
                                        })
                                        .catch(function (fcmError) {
                                            //delete the firebase object. This is especially important in lambda
                                            admin.app('[DEFAULT]').delete();
                                            
                                            let response = {
                                                "status": 1,
                                                "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                "data": null,
                                                "err": JSON.stringify(err)
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
                                        
                                        if (err) {
                                            let response = {
                                                "status": 1,
                                                "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                "data": null,
                                                "err": JSON.stringify(err)
                                            }
                                            callback(null, response);
                                        } else {
                                            //subcribe to the 'general' topic in FCM. 
                                            admin.messaging().subscribeToTopic(fcm, "general")
                                            .then(function (fcmResp) {
                                                //delete the firebase object. This is especially important in lambda
                                                admin.app('[DEFAULT]').delete();
                                                
                                                let response = {
                                                    "status": 0,
                                                    "msg": "fcm subscribed sucessfully",
                                                    "mobile_msg": "fcm subscribed sucessfully",
                                                    "data": fcmResp,
                                                    "err": null
                                                }
                                                callback(null, response);
                                            })
                                            .catch(function (fcmError) {
                                                //delete the firebase object. This is especially important in lambda
                                                admin.app('[DEFAULT]').delete();
                                                
                                                let response = {
                                                    "status": 1,
                                                    "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                    "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
                                                    "data": null,
                                                    "err": JSON.stringify(fcmError)
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
    
    