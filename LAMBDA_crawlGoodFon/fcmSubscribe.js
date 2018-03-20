'use strict';

//we will be using the following 3 plugins. 
var admin = require("firebase-admin");
var mysql = require("mysql");
var moment = require("moment");

const constants = require('./config');

//our database configuration. I am using an RDS MySQL instance on AWS
var config = constants.DB_DETAILS,
db = mysql.createConnection(config);


exports.handler = (event, context, callback) => {
    
    //setting the below attribute ensures our Lambda function returns control as soon as callback() is invoked
    //it does not wait for empty loop scenarios
    context.callbackWaitsForEmptyEventLoop = false;
    
    //for local console testing we can use below hardcoded values
    // var fcm = 'dnsZAwtjO00:APA91bHiftMExHxxtsmKv-48Wp-t0sa6l3GKuRCqEvErALcPCiZeg2HO84EfXpLLBR90JkfoeHQym95bTTYBxEPjrjdVTok0smu_1Fal_40z8au2QvfFa6yn9P5LybEpLWdUPnUupAK0';
    // var mobile_id = '9848055649e2f783';
    
    //for production lamdba use
    var jsonBody = event['body-json'];
    
    //fcm is the unique token generated for each device by Firebase
    var fcm = jsonBody.fcm;
    //mobile_id is a unique device identifier generated for each device
    var mobile_id = jsonBody.mobile_id;
    
    //replace the contents below with the JSON object we downloaded from the FCM console.
    var serviceAccount = {
        "type": "service_account",
        "project_id": "superhero-wallpaper-89fff",
        "private_key_id": "1bcbc30f8ec610dcd74a85a5d5da76ebecb07bb2",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCcPZLXvi7u+2GB\n1TH3MXC4d2Oj+P/LTl1L0wx0gOuWybi1ITXQg4dR59EKp9z/ijdFNwEWXMD0eRxN\nXM/qgG+FWP7QBOAV8Mlwv8bIRIO939P+u3/9RNCoM9P/sIFYGs8hr3zViaYk59ax\nermS6VvpeWryJErnvtAiCxk2c4BFQC73C6w+pwvEcgok7N8XcgZILmbaEYwLq1k2\nl/SYkiNAtSpd39BVU2KfZTWz2dRyK3qyme4HKh/bD0L6grWIyQP/WlCpf035Mk2p\n3ORIxxOqxaH9LAWYNJe6dawb3hegsopx7FVt0JSNu5LRJ1ch5aELi4F9IrA9QDnv\nc4aFAA3JAgMBAAECggEACkCeHKsdsE/tl5PyWeq0H16yOqXRvzkOtTWNqS12iCgH\nh1c9DUg8PnssQ/s87MXYl6Gi4CFJBiHWYhs3h4dTChiLbAIN5FKvHUdwV17rmC+S\nXTJXlTqJSKhR/oLKEgp8UhUOZ4LHVL+j3nSTrdjDT8BIbMhF5Awo4zsANgsBPUn9\nIGOJ5XXYvyPmES147Ba65GzQcPkmvj4bT6UtzuUPsiz4/rpZgKTIXhGne5RTPc8Y\n8ukfXPOKCzI/1+tPay0lKjEehzKcaq9y+O41OBx5+F/IMZUW+NY4OupI4STp5GNp\nkAHo7uzXPZgsnrr3P9IAJF3P1LZLor40j2tcezqCyQKBgQDT6GixPuZeRT/j9+oD\nfjSzUzs0bGyqybwYZyki4UXuyyg/rGiXtiG/bpC7WBuOUPHFHo47bia3dy0rVEYi\nxnoT1KhdPAjSEKTzH/uf/IdsSH8PC89DtLdEMuhwF83EX/bco2l9rEZiDcw3hY3d\nUMGaqsxA5ovTg7YpVsA32SfTTQKBgQC8v/Xqa6mRjJxdS0789dsiQPR0fLqYQLkj\nmMlsbL8l4/b8RZSdQRfNOe+9GuYjef2/0Q6/PjWPdM0qetyBOpSvQuBW/76YZ5fC\n/NFVir3J60OnML4kUo6suWAvGkAQgQjy+6KLgrEWw3l6fl8rXzB373fWNdlN8dUc\njd76G0BubQKBgQCVWeIfukNHAeur0pk+aP7fvLOnmRtlq9VEJcEackeFq+3sIql8\n88MJVvXu9IRHY8lissxwGoxzFi3hsf3UmKqFu4YGYD+fPlfjexEvix4vNVFH23zz\nLTVVfcPQ7RX7Z99nVk0NZBQfG7ZpE1oPN9GcHvDidRrrspL6w8eqFQU6qQKBgD35\nzfaGGWyYPfOIOcxnsediaqIhHmfFwMTGc0TtxCnd24hkFHM6H2Wco3J1daGqeb5V\nF8GF3LJZCNDs/KBWKuINVHpciSmjwjodJ2MuJjk5zcIFCDoG/aALUmDE/soshFK8\ne1fRtvIhhy7IddlY7SJEeBXXIp4sTOyOTOvUrOhVAoGAb9tSIJ/Q+WZ/R4jG3L+H\n/JirpLhwOv2tC0kqGeCySfroG2dYEaxThsJhaNRQmzlx0ESnSim6emAUZm2u9JwT\nXCEhNa2R7e8v6PgPP0GxOjZlxx05hRBJtuLocZVpRnoJ2YGGBKSM8MfoP5vCmK9K\niHcGy8Gb8/AsKrmvbtf07XQ=\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-ap2n2@superhero-wallpaper-89fff.iam.gserviceaccount.com",
        "client_id": "114094436281444967883",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ap2n2%40superhero-wallpaper-89fff.iam.gserviceaccount.com"
    };
    
    //databaseURL below is provided in the FCM console.
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://superhero-wallpaper-89fff.firebaseio.com"
    });
    
    db.connect();
    
    
    db.query(
        "SELECT * FROM user WHERE mobile_id = ?",
        [mobile_id],
        function (err, users) {
            if (users.length > 0) {
                //if the mobile_id already exists in our database, simply update the FCM token for all matching mobile_ids
                db.query(
                    "UPDATE user SET fcm = ?, updated_on = ? WHERE mobile_id = ?",
                    [fcm, moment().format("YYYY-MM-DD HH:mm:ss"), mobile_id],
                    function (err, status) {
                        
                        db.end();
                        
                        if(err){
                            var response = {
                                statusCode: 200,
                                headers: {},
                                body: "error updating data to DB"
                            };
                            callback(null, response);
                        }else{
                            //subcribe to the 'general' topic in FCM. 
                            admin.messaging().subscribeToTopic(fcm, "general")
                            .then(function (fcmResp) {
                                //delete the firebase object. This is especially important in lambda
                                admin.app('[DEFAULT]').delete();
                                
                                var response = {
                                    statusCode: 200,
                                    headers: {},
                                    body: "fcm subscribed sucessfully"
                                };
                                callback(null, response);
                            })
                            .catch(function (fcmError) {
                                //delete the firebase object. This is especially important in lambda
                                admin.app('[DEFAULT]').delete();
                                
                                var response = {
                                    statusCode: 200,
                                    headers: {},
                                    body: "some error during fcm subscription"
                                };
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
                            db.end();
                            
                            if (err) {
                                var response = {
                                    statusCode: 200,
                                    headers: {},
                                    body: "error inserting data to DB"
                                };
                                callback(null, response);
                            } else {
                                //subcribe to the 'general' topic in FCM. 
                                admin.messaging().subscribeToTopic(fcm, "general")
                                .then(function (fcmResp) {
                                    //delete the firebase object. This is especially important in lambda
                                    admin.app('[DEFAULT]').delete();
                                    var response = {
                                        statusCode: 200,
                                        headers: {},
                                        body: "fcm subscribed sucessfully"
                                    };
                                    callback(null, response);
                                })
                                .catch(function (fcmError) {
                                    //delete the firebase object. This is especially important in lambda
                                    admin.app('[DEFAULT]').delete();
                                    var response = {
                                        statusCode: 200,
                                        headers: {},
                                        body: "some error during fcm subscription"
                                    };
                                    callback(null, response);
                                });
                            }
                        }
                    );
                }
            }
        );
        
    }
    
    