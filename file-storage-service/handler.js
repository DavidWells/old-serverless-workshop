'use strict';

const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();

module.exports.save = (event, context, callback) => {
  console.log(event)
  const imageURL = event.image_url || JSON.parse(event.body).image_url
  const key = event.key || JSON.parse(event.body).key

  fetch(imageURL)
    .then(response => response.buffer())
    .then(buffer => (
      s3.putObject({
        Bucket: process.env.BUCKET,
        Key: key,
        Body: buffer,
      }).promise()
    ))
    .then(() => {
      callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        success: true
      }),
    });
    })
    .catch((error) => {
      callback(error, null);
    });
};

module.exports.notify = (event, context, callback) => {
  console.log('Notify Admin of new image')
};
