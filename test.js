const request = require('request');

let i = 0;

function sendRequest() {
    request('http://localhost:3000/', {
        method: 'POST',
        body: JSON.stringify({ msg: "Test message #" + i }),
        headers: { 'Content-Type': 'application/json' }
    }, (err, res, body) => {
        const json = JSON.parse(body)
        console.log(json);
    })
    ++i
    if (i >= 10) {
        clearInterval(interval)
    }
}

const interval = setInterval(sendRequest, 1000)