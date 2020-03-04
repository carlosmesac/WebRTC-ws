const ws = new WebSocket("wss://webrtc-carlos.herokuapp.com/")
ws.onopen = function() {
    console.log('Connected to signaling server')
}
ws.onerror = err => {
    console.error(err)
}
let connection = null
let username = null
let name = null
let otherUsername = null
document.querySelector('button#login').addEventListener('click', event => {
    username = document.querySelector('input#username').value
    if (username.length <= 0) {
        alert('please enter an username')
        return
    }


    sendMessage({
        type: 'login',
        username: username
    })
})

ws.onmessage = msg => {
    console.log('got message', msg.data)
    const data = JSON.parse(msg.data)
    switch (data.type) {

        case 'login':
            handleLogin(data.success)
            displayArrayUsers(data.users)
            break;
        case 'offer':
            handleOffer(data.offer, data.username)
            break
        case 'answer':
            handleAnswer(data.answer)
            break
        case 'candidate':
            handelCandidate(data.candidate)
            break
        case 'close':
            handleClose()
            break
        default:
            break;
    }
}

const loginSuccessfull = () => {
    document.querySelector('video#local').style.display = 'block';
    document.querySelector('video#remote').style.display = 'block';
    document.querySelector('div#user-call').style.display = 'block';
    document.querySelector('h1#user').innerHTML = 'Current username: ' + username
    document.querySelector('div#login').style.display = 'none'
    document.querySelector('div#call').style.display = 'block'
}
const displayArrayUsers = (users) => {
    var usersL = users.length
    var i, text
    text = '<ul>'
    for (i = 0; i < usersL; i++) {
        if (users[i] != null)
            text += '<li>' + users[i] + '</li>'
    }
    text += '</ul>'

    document.querySelector('p#users-list').innerHTML = text

}
const handleLogin = async success => {
    if (success === false) {
        alert('Username already taken')
    } else {
        loginSuccessfull()

        let localStream

        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
        } catch (error) {
            alert(`${error.name}`)
            console.error(error)
        }
        document.querySelector('video#local').srcObject = localStream

        //usando Servidores STUN publicos de google
        const configuration = {
            iceServers: [{ 'urls': 'stun:stun.services.mozilla.com' },
                { 'urls': 'stun:stun.l.google.com:19302' }
            ]
        }

        connection = new RTCPeerConnection(configuration)
        connection.addStream(localStream)
        connection.onaddstream = event => {
            document.querySelector('video#remote').srcObject = event.stream
        }
        connection.onicecandidate = event => {
            if (event.candidate) {
                sendMessage({
                    type: 'candidate',
                    candidate: event.candidate
                })
            }
        }
    }
}

const handleOffer = (offer, username) => {
    otherUsername = username
    connection.setRemoteDescription(new RTCSessionDescription(offer))
    connection.createAnswer(
        answer => {
            connection.setLocalDescription(answer)
            sendMessage({
                type: 'answer',
                answer: answer
            })
        },
        error => {
            alert('Error creating an answer')
            console.error(error)
        }
    )
}

const handleAnswer = answer => {
    connection.setRemoteDescription(new RTCSessionDescription(answer))
}

const handelCandidate = candidate => {
    connection.addIceCandidate(new RTCIceCandidate(candidate))
    document.querySelector('button#close-call').style.visibility = 'visible'
}

const handleClose = () => {
        otherUsername = null
        document.querySelector('video#remote').srcObjetc = null
        connection.close()
        connection.onicecandidate = null
        connection.onaddstream = null
        console.log('Conexion finalizada')
        location.reload()

    }
    //finalizar llamada

document.querySelector('button#close-call').addEventListener('click', () => {
    sendMessage({
        type: 'close'
    })

    handleClose()
})

document.querySelector('button#call').addEventListener('click', () => {
    const callToUsername = document.querySelector('input#username-to-call').value
    if (callToUsername.length === 0) {
        alert('Enter a username')
        return
    }
    otherUsername = callToUsername

    connection.createOffer(
        offer => {
            sendMessage({
                type: 'offer',
                offer: offer
            })

            connection.setLocalDescription(offer)
        },
        error => {
            alert('Error when creating an offer')
            console.error(error)
        }
    )
})

const sendMessage = message => {
    if (otherUsername) {
        message.otherUsername = otherUsername
    }

    ws.send(JSON.stringify(message))
}