const aws = require("aws-sdk");
//*********************************AWS Credential of Company Account*********************************//
aws.config.update({
  accessKeyId: "AKIAYBJPFTJJFJUJNSPT",
  secretAccessKey: "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",
  region: "ap-south-1",
});
let uploadFile = async (file) => {
  return new Promise((resolve, reject) => {
    let s3 = new aws.S3({ apiVersion: "2006-03-01" });
    let uploadParam = {
      ACL: "public-read",
      Bucket: "texly",
      Key: "texly/" + file.originalname,
      Body: file.buffer,
    };
    s3.upload(uploadParam, function (err, data) {
      if (err) {
        return reject(err);
      }
      if (data) {
        return resolve(data.Location);
      }
    });
  });
};
deleteFile = async function (key) {
  return new Promise((resolve, reject) => {
    let keyData = key.split("/").pop();
    const s3 = new aws.S3();
    const params = {
      Bucket: "texlyfiles",
      Key: "texly/" + keyData, // replace with your actual object key
    };

    s3.deleteObject(params, (err, data) => {
      if (err) {
        reject("Error deleting object:", err.message);
      } else {
        resolve("Object deleted successfully:", data);
      }
    });
  });
};
module.exports = { uploadFile };
