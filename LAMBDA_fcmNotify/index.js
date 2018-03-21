// ---- LOCAL DEBUGGING CONFIGURATION ------- //

// var event = {  
//     "body-json": {
//         title: "notificaiton title",
//         message: "notification body",
//         type: "broadcast",
//         superhero: 69,
//         image_thumb_url: "http://d1eekkxccru7xx.cloudfront.net/300x300/756813_1511880322.jpeg",
//         image_full_url: "http://d1eekkxccru7xx.cloudfront.net/original/756813_1511880322.jpeg"
//     }
// };

// function callback(error, message){
//     console.log(message);
//     process.exit();
// };

// ---- END OF LOCAL DEBUGGING CONFIGURATION ------- //

var admin = require("firebase-admin");
const constants = require('./config');


exports.handler = (event, context, callback) => {
    
    //this parameter immediately return our response as soon as callback is called
    context.callbackWaitsForEmptyEventLoop = false;
    
    var jsonBody = event['body-json'];
    
    //for production lamdba use
    var payload = {
        notification: {
            title: jsonBody.title,
            body: jsonBody.message
        },
        data: {
            title: jsonBody.title,
            message: jsonBody.message,
            type: jsonBody.type,
            superhero: jsonBody.superhero,
            image_thumb_url: jsonBody.image_thumb_url,
            image_full_url: jsonBody.image_full_url
        }
    };
    
    admin.initializeApp({
        credential: admin.credential.cert(constants.FCM_SERVICE_ACCOUNT),
        databaseURL: constants.FCM_DB_URL
    });
    
    // Send a message to devices subscribed to the provided topic.
    admin.messaging().sendToTopic("general", payload)
    .then(function (response) {
        //delete the firebase object
        admin.app('[DEFAULT]').delete();
        // See the MessagingTopicResponse reference documentation for the
        // contents of response.
        let apiResponse = {
            "status": 0,
            "msg": "notification sent",
            "mobile_msg": "notification sent",
            "data": response,
            "err": null
        }
        callback(null, apiResponse);
        
    })
    .catch(function (error) {
        //delete the firebase object
        admin.app('[DEFAULT]').delete();
        
        let apiResponse = {
            "status": 1,
            "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
            "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
            "data": null,
            "err": JSON.stringify(error)
        }
        callback(null, apiResponse);
        
    });
    
}

