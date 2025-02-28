const cronJob = require('cron').CronJob;
let userModel = require('../models/userModel');
let notification = require('../models/notificationModel');
let commonFunction = require("../helper/commonFunction")
let cashInHand = require('../models/cashInHand');

new cronJob('0 */24 * * *', async function () {
    let findUser = await userModel.find({ userType: "PROVIDER", bookingBlock: true });
    if (findUser.length == 0) {
        console.log("for notification no data found.");
    } else {
        for (let i = 0; i < findUser.length; i++) {
            let findCash = await cashInHand.findOne({ userId: findUser[i]._id });
            let subject = "Please pay admin amount.";
            let body = `Dear ${findUser[i].name} your have pending admin commission ₹ ${findCash.adminCash} in your cash wallet. Please make payment to continue reciving booking.`
            let d = new Date(), date = d.getDate(); let month = d.getMonth() + 1; let year = d.getFullYear(), hr = d.getHours(), min = d.getMinutes(), sec = d.getSeconds();
            let fullDate = await dateTimeCalculate(date, month, year, hr, min, sec);
            if (findUser.deviceToken != null || findUser.deviceToken != undefined) {
                let result = await commonFunction.pushNotification(findUser[i].deviceToken, findUser[i].deviceType, subject, body);
                let obj = {
                    title: subject,
                    body: body,
                    driverId: findUser[i]._id,
                    date: fullDate,
                    notificationType: "AMOUNT"
                }
                var notif = await notification.create(obj);
            } else {
                let obj = {
                    title: subject,
                    body: body,
                    driverId: findUser[i]._id,
                    date: fullDate,
                    notificationType: "AMOUNT"
                }
                var notif = await notification.create(obj);
            }

        }
    }
}).start();
// }).stop()
const dateTimeCalculate = async (date, month, year, hr, min, sec) => {
    let date1, hr1, min1, sec1;
    if (date < 10) {
        date1 = '' + 0 + date;
    }
    else {
        date1 = date
    }
    if (hr < 10) {
        hr1 = '' + 0 + hr;
    }
    else {
        hr1 = hr
    }
    if (min < 10) {
        min1 = '' + 0 + min;
    }
    else {
        min1 = min
    }
    if (sec < 10) {
        sec1 = '' + 0 + sec;
    }
    else {
        sec1 = sec
    }
    let fullDate = `${date1}/${month}/${year} ${hr1}:${min1}:${sec1}`
    return fullDate
}