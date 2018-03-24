We will be using this function to trigger a specific type of notification to all subscribers.

The app will receive this notification, pick up a random wallpaper from their favorites and then set it.

This notification will be triggered everyday at midnight on production.
On staging we will set the interval to 15 mins.

This lambda function will be triggered using Cloudwatch events cron.


Expected payload:

{
       "title": null,
       "message": null,
       "type": "favorite",
       "category": null,
       "image_thumb_url": null,
       "image_full_url": null
}