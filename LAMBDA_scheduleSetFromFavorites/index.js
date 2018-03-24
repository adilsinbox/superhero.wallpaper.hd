// ---- LOCAL DEBUGGING CONFIGURATION ------- //

// function callback(error, message){
//     console.log(message);
//     process.exit();
// };

// ---- END OF LOCAL DEBUGGING CONFIGURATION ------- //

var admin = require("firebase-admin");
const constants = require('./config');

//databaseURL below is provided in the FCM console.
admin.initializeApp({
    credential: admin.credential.cert(constants.FCM_SERVICE_ACCOUNT),
    databaseURL: constants.FCM_DB_URL
});
//we are initializing the firebase admin outside of handler function on purpose.
//read more about it here https://groups.google.com/forum/#!topic/firebase-talk/aBonTOiQJWA


exports.handler = (event, context, callback) => {
    
    //this parameter immediately return our response as soon as callback is called
    context.callbackWaitsForEmptyEventLoop = false;
    
    //for production lamdba use
    var payload = {
        data: {
            title: "null",
            message: "null",
            type: "favorite",
            category: "null",
            image_thumb_url: "null",
            image_full_url: "null"
        }
    };
    
    // Send a message to devices subscribed to the provided topic.
    admin.messaging().sendToTopic("general", payload)
    .then(function (response) {
        //delete the firebase object
        //admin.app('[DEFAULT]').delete();
        // See the MessagingTopicResponse reference documentation for the
        // contents of response.
        let apiResponse = {
            "status": 1,
            "msg": "notification sent",
            "mobile_msg": "notification sent",
            "data": response,
            "err": null
        }
        callback(null, apiResponse);
        
    })
    .catch(function (error) {
        //delete the firebase object
        //admin.app('[DEFAULT]').delete();
        
        let apiResponse = {
            "status": 0,
            "msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
            "mobile_msg": "Something went wrong. Looks like the Hulk accidently smashed our servers!",
            "data": null,
            "err": JSON.stringify(error)
        }
        callback(null, apiResponse);
        
    });
    
}

