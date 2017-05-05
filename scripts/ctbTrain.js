const AWS = require('aws-sdk');

const piSQS = process.env.PI_QUEUE;
const SQS = new AWS.SQS({region: 'us-east-1'});

module.exports = function(robot) {
  robot.hear(/ctb train/i, function(msg) {

    var message_payload = { action: 'play_sound', sound: 'train' };

    SQS.sendMessage({
       MessageBody:  JSON.stringify(message_payload),
       QueueUrl: piSQS
    }).promise().then(function(data) {
      console.log('Heard CTB Train and queued message');
    }).catch(function(err) {
      console.log(err);
    });


  })
}
