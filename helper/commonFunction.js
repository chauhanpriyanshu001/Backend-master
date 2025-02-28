const axios = require("axios");
const Razorpay = require("razorpay");
var FCM = require("fcm-node");
var Sender = require("aws-sms-send");
var aws_topic = "arn:aws:sns:eu-north-1:188240114216:TexlyPvtLtd";

const checkNotication = process.env.CHECK_NOTIFICATION;
const pushNotication = process.env.PUSH_NOTIFICATION;
const pushNotiforUser = process.env.PUSH_NOTICATION_FOR_USER_SERVERKEY;
const findLocation = process.env.LOCATION_API_KEY;
const sendOtpKey = process.env.SEND_OTP_API_KEY;
const AwsAccessKey = process.env.AWS_ACCESS_KEY_ID;
const AwsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
const RazorpayApiKey = process.env.RAZORPAY_API_KEY;
const RazorpaySecretKey = process.env.RAZORPAY_SECRET_KEY;
var config = {
  AWS: {
    accessKeyId: AwsAccessKey,
    secretAccessKey: AwsSecretKey,
    region: "eu-north-1",
  },
  topicArn: aws_topic,
};

var sender = new Sender(config);

module.exports = {
  randomOTPGenerate() {
    var digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < 4; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  },

  razorpay: new Razorpay({
    key_id: RazorpayApiKey,
    key_secret: RazorpaySecretKey,
  }),

  paymentId() {
    var digits =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let OTP = "";
    for (let i = 0; i < 14; i++) {
      OTP += digits[Math.floor(Math.random() * 108)];
    }
    return OTP;
  },

  //*****************Trial Version*****************//
  sendMobileOtp(toNumbers, rawMessage) {
    const otp = rawMessage;
    const apiKey = sendOtpKey;
    const url = `http://login.quicksms.info/api/sendsms?apikey=72d2dd05c5114488b4948cc3971a8139&number=${toNumbers}&sendername=MYSPDH&service=TRANS&msg=Texly PVT LTD, YOUR otp ${otp} is your One Time Password`;
    const body = {
      apiKey: apiKey,
      numbers: toNumbers,
      sender: "MYSPDH",
      message: `Your OTP is ${otp} Texly Pvt Ltd Don't Share Other`,
    };
    return axios
      .post(url, body)
      .then((response) => {
        console.log(response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  },

  findLocation(latitude, longitude) {
    return new Promise((resolve, reject) => {
      var url = `https://maps.googleapis.com/maps/api/geocode/json?key=${findLocation}&latlng=' + latitude + ',' + longitude + '&sensor=true`;
      axios
        .get(url)
        .then(function (response) {
          resolve(response.data);
        })
        .catch(function (error) {
          console.log(resolve.data);
          reject(error);
        });
    });
  },

  pushNotificationForUser(deviceToken, deviceType, title, body) {
    return new Promise((resolve, reject) => {
      var serverKey = pushNotiforUser;
      var fcm = new FCM(serverKey);
      var message = {
        to: deviceToken,
        content_available: true,
        notification: {
          title: title,
          body: body,
        },
      };

      fcm.send(message, function (err, response) {
        if (err) {
          console.log("Error: ", err);
          return reject(err);
        } else {
          console.log("Response: ", response);
          return resolve(response);
        }
      });
    });
  },

  pushNotification(deviceToken, deviceType, title, body) {
    return new Promise((resolve, reject) => {
      var serverKey = pushNotication;
      var fcm = new FCM(serverKey);
      var message = {
        to: deviceToken,
        content_available: true,
        notification: {
          title: title,
          body: body,
        },
      };

      fcm.send(message, function (err, response) {
        if (err) {
          console.log("Error: ", err);
          return reject(err);
        } else {
          console.log("Response: ", response);
          return resolve(response);
        }
      });
    });
  },

  addMinutes(time, minutes) {
    var date = new Date(
      new Date("01/01/2024 " + time).getTime() + minutes * 60000
    );
    var tempTime =
      (date.getHours().toString().length == 1
        ? "0" + date.getHours()
        : date.getHours()) +
      ":" +
      (date.getMinutes().toString().length == 1
        ? "0" + date.getMinutes()
        : date.getMinutes()) +
      ":" +
      (date.getSeconds().toString().length == 1
        ? "0" + date.getSeconds()
        : date.getSeconds());
    return tempTime;
  },

  checkPushNotification: async (deviceToken, title, body) => {
    var serverKey = checkNotication;
    var fcm = new FCM(serverKey);
    var message = {
      to: deviceToken,
      content_available: true,
      notification: {
        title: title,
        body: body,
      },
    };
  },
};
