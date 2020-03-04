const WebSocket = require('ws')
var express = require('express')
var app = express()
var expressWs = require('express-ws')(app)
const users = []
const PORT = process.env.PORT || 8080


app.ws('/', (ws, req) => {
    console.log('User connected')

    ws.on('message', message => {
        let data = null

        try {
            data = JSON.parse(message)
            console.log('otherUsername', data.otherUsername)
        } catch (error) {
            console.error('Invalid JSON', error)
            data = {}
        }

        switch (data.type) {
            case 'login':
                console.log('User logged', data.username)
                if (users[data.username]) {
                    sendTo(ws, { type: 'login', success: false, users: users })
                } else {
                    users[data.username] = ws
                    ws.username = data.username
                    sendTo(ws, { type: 'login', success: true, users: users })
                }
                break
            case 'offer':
                console.log('Sending offer to: ', data.otherUsername)
                if (users[data.otherUsername] != null) {
                    ws.otherUsername = data.otherUsername
                    sendTo(users[data.otherUsername], {
                        type: 'offer',
                        offer: data.offer,
                        username: ws.username
                    })
                }
                break
            case 'answer':
                console.log('Sending answer to: ', data.otherUsername)
                if (users[data.otherUsername] != null) {
                    ws.otherUsername = data.otherUsername
                    sendTo(users[data.otherUsername], {
                        type: 'answer',
                        answer: data.answer
                    })
                }
                break
            case 'candidate':
                console.log('Sending candidate to:', data.otherUsername)
                if (users[data.otherUsername] != null) {
                    sendTo(users[data.otherUsername], {
                        type: 'candidate',
                        candidate: data.candidate
                    })
                }
                break
            case 'close':
                console.log('Disconnecting from', data.otherUsername)
                users[data.otherUsername].otherUsername = null

                if (users[data.otherUsername] != null) {
                    sendTo(users[data.otherUsername], { type: 'close' })
                }

                break

            default:
                sendTo(ws, {
                    type: 'error',
                    message: 'Command not found: ' + data.type
                })

                break
        }
    })

    const removeArrayItem = (arr, item) => {
        var i = arr.indexOf(item);

        if (i !== -1) {
            arr.splice(i, 1);
        }
    }

    ws.on('close', () => {
        if (ws.username) {
            delete users[ws.username]

            if (ws.otherUsername) {
                console.log('Disconnecting from ', ws.otherUsername)
                users[ws.otherUsername].otherUsername = null

                if (users[ws.otherUsername] != null) {
                    sendTo(users[ws.otherUsername], { type: 'close' })
                }
            }
            if (username != null)
                removeArrayItem(users, username)

        }
    })
})

const sendTo = (ws, message) => {
    ws.send(JSON.stringify(message))
}
app.use(express.static('./public'))


app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})