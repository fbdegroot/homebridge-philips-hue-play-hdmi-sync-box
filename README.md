## Hue HDMI Sync Box API
https://developers.meethue.com/develop/hue-entertainment/hue-hdmi-sync-box-api/

---

## Prepare Sync Box
You have to create new credentials to communicate with the Philips Hue Sync Box:

* Make sure the Sync Box is on
* Make sure synchronization is stopped
* Make an HTTP POST request to https://<SYNC-BOX-IP>/api/v1/registrations
* The body of the request has to be JSON: { "appName": "homebridge", "appSecret": "MDAwMTExMDAwMTExMDAwMTExMDAwMTExMDAwMTExMDA=", "instanceName": "homebridge" }
* One way to do this is to enter the following into the Terminal: curl -k -H "Content-Type: application/json" -X POST -d '{"appName": "homebridge", "appSecret":"MDAwMTExMDAwMTExMDAwMTExMDAwMTExMDAwMTExMDA=", "instanceName": "homebridge"}' https://<SYNC-BOX-IP>/api/v1/registrations, replacing <SYNC-BOX-IP> with the IP address of your Sync Box.
* The first response to the request will be { "code": 16, "message": "Invalid State" }
* IMPORTANT: Now, click and hold the button of the Sync Box until the LED switches to green. Immediately release the button as soon as the LED is green! It will switch to white again.
* Immediately make the request again
* The response contains an accessToken string