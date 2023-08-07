const http = require('http')
const express = require('express')
const amqp = require('amqplib/callback_api')
const winston = require('winston')
const expressWinston = require('express-winston')
const resolvers = new Map

const PORT = 3000

let rabbitChannel

function sendMsg(msg, channel, queue) {
    channel.assertQueue(queue, {
        durable: false
    })

    channel.sendToQueue(queue, Buffer.from(msg))
    console.log(msg + ' --- sent to ' + queue)
}

function setChannel() {
    amqp.connect('amqp://localhost', function (error, connection) {
        if (error) {
            res.status(503)
            res.send('RabbitMQ must be installed')
        }

        connection.createChannel(function (error1, channel) {
            if (error1) {
                res.status(503)
                res.send('Queue access error')
            }

            setMsgFromHandlerListener(channel, 'to-user')

            rabbitChannel = channel
        });
    });
}

function generateId() {
    const now = new Date()
    return now.toISOString() + ', ' + Math.random().toString()
}

// function logRequest(req) {
//     const now = new Date()
//     fs.appendFileSync("m1.log", `'http request received', '${now.toISOString()}', '${JSON.stringify(req.body)}'\n`)
// }

// function logResponse(body) {
//     const now = new Date()
//     fs.appendFileSync("m1.log", `'http response sent successfully', '${now.toISOString()}', '${body}'\n`)
// }

function sendReqMsgToM2(req, res, next) {

    // logRequest(req)

    sendMsg(JSON.stringify(req.body), rabbitChannel, 'to-handler')
    let sendResResolver
    const sendRes = new Promise(resolver => { sendResResolver = resolver })
    resolvers.set(req.body.id, sendResResolver)
    sendRes.then((result) => {
        res.status(200)
        res.send(JSON.stringify({ "msg": result.msg }))
        // logResponse(JSON.stringify(result))
    })
}

function setMsgFromHandlerListener(channel, queue) {
    channel.assertQueue(queue, {
        durable: false
    })

    channel.consume(queue, function (msg) {

        console.log(" [x] Received %s", msg.content.toString())
        hanldeMsgFromExecutor(msg.content.toString())
    }, {
        noAck: true
    })
}

function hanldeMsgFromExecutor(str) {
    const { id, msg } = JSON.parse(str)
    if (!resolvers.has(id)) return
    resolvers.get(id)(JSON.parse(str))
    resolvers.delete(id)
}

setChannel()

const app = express()

app.use(express.json());

app.use('/', (req, res, next) => {
    req.body.id = generateId()
    next()
})

app.use(expressWinston.logger({
    transports: [
        new winston.transports.File({ filename: 'm1.log' }),
    ],
    format: winston.format.json(),
    msg: "HTTP {{req.method}}, {{req.url}}, '{{JSON.stringify(req.body)}}', {{res.statusCode}}, {{res.responseTime}}ms "
}))

app.use('/', sendReqMsgToM2)

app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.File({ filename: 'error.log' }),
    ],
    format: winston.format.json(),
}))

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})
