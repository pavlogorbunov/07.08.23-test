const amqp = require('amqplib/callback_api');
const fs = require('fs')

let rabbitChannel

async function handler(msg, channel) {
    const msgObj = JSON.parse(msg)
    const delay = Math.floor(Math.random() * 5000)
    const task = new Promise(resolve => {
        setTimeout(() => {
            msgObj.msg = msgObj.msg + ' - handled by M2 in ' + delay + ' ms'
            resolve(JSON.stringify(msgObj))
            logResponse(JSON.stringify(msgObj))
        }, delay)
    })
    task.then((msg) => sendResToUserViaQueue(msg, channel))
    return task
}

function sendResToUserViaQueue(msg, channel) {
    const queue = 'to-user'

    channel.assertQueue(queue, {
        durable: false
    })

    channel.sendToQueue(queue, Buffer.from(msg))
    console.log(msg + ' --- sent to ' + queue)
}

function logRequest(msg) {
    const now = new Date()
    fs.appendFileSync("m2.log", `'Message recieved form queue "to-handler"', '${now.toISOString()}', '${msg}'\n`)
}

function logResponse(msg) {
    const now = new Date()
    fs.appendFileSync("m2.log", `'Message sent to queue "to-user"', '${now.toISOString()}', '${msg}'\n`)
}

amqp.connect('amqp://localhost', function (error, connection) {

    connection.createChannel(function (error1, channel) {
        let queue = 'to-handler';

        rabbitChannel = channel

        channel.assertQueue(queue, {
            durable: false
        });

        channel.consume(queue, function (msg) {
            console.log(" [x] Received from user %s", msg.content.toString())
            logRequest(msg.content.toString())
            handler(msg.content.toString(), rabbitChannel)
        }, {
            noAck: true
        });
    });
});
