// ====================================================== 
// ************* RECEIVE FROM CLIENT QUEUE **************
// ====================================================== 

const database = require('../database/index.js');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const queueURL = "https://sqs.us-west-1.amazonaws.com/481569304347/sessioninfo";
AWS.config.loadFromPath('./config.json');

sqs.config.setPromisesDependency(require('bluebird'));

const params = {
  AttributeNames: [ "SentTimestamp" ],
  MaxNumberOfMessages: 1,
  MessageAttributeNames: [ "All" ],
  QueueUrl: queueURL,
  VisibilityTimeout: 60,
  WaitTimeSeconds: 10
 };

const getMessages = () => {
  sqs.receiveMessage(params).promise()
  .then((results) => {
    if (results.Messages === undefined) {
      throw "NO NEW SQS MESSAGES!!"
    } else {
      return results
    }
  })
  .then((results) => {
    // results = JSON.parse(results);
    database.insertClientData(results.Messages[0]);

    var deleteParams = {
      QueueUrl: queueURL,
      ReceiptHandle: results.Messages[0].ReceiptHandle
      };
      console.log(results.Messages[0].MessageAttributes)
      
      sqs.deleteMessage(deleteParams).promise()
      .then(() => {
        console.log("DELETED FROM CLIENT QUEUE!!!")
        getMessages()
      })
  })
  .catch(error => {
    console.log(error);
    setTimeout(getMessages, 5000)
  })
}

getMessages();

module.exports.getMessages = getMessages;