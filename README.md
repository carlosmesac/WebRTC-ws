## Creación de una APP de WebRTC con NodeJS y ws

En este proyecyo se pretende implementar una aplicación para webRTC implementando websocket como medio de señalización.

A continuación se irán explicando los pasos a seguir para el desarrollo de la aplicación.

Para comenzar crearemos una carpeta para contener el proyecto, en la cual iniciaremos node.

```shell
npm init
```

Instalamos ws para señalización usando npm

```shell
npm install ws
```

Para el uso de la comunicación se requerira conocer el usuario con el cual se desea comunicar.

Al inicio de la página web podremos ver un campo en el cual podemos rellenar con el nombre de usuario que deseemos.

```html
    <div id="login">
        <label for="username">Login</label>
        <input id="username" placeholder="login id" required autofocus>
        <button id="login">Login</button>
    </div>
```

En la parte del JavaScript del cliente iniciamos el websocket para el servidor.

```JavaScript
const ws = new WebSocket("ws://localhost:8080")
ws.onopen= function(){
console.log('Connected to signaling server')
};
ws.onerror= err =>{
    console.error(err)
};
```

A continuación, tenemos que implementar la función para que una vez el usuario pulse el botón se compruebe y se envie al servidor.

```JavaScript
document.querySelector('button#login').addEventListener('click', event => {
    username = document.querySelector('input#username').value

    if(username.length < 0){
        alert('please enter an username')
        return
    }

    sendMessage({
        type: 'login',
        username: username
    })
})
```

La función ``sendMessage`` envía mensajes JSON al servidor de WebSocket.

```JavaScript
const sendMessage = message =>{
    ws.send(JSON.stringify(message))
}
```

El lado del servidor es el encargado de decodificar el JSON y detenctar que tipo de mensaje es.

```JavaScript
ws.on('message', message =>{
    let data = null
    try {
        data = JSON.parse(meesage)
    } catch (err) {
     console.error('Invalid JSON',err)   
    }
    switch (data.type){
        case 'login':
            console.log('user logged',data.username)
            break
    }
})
```

En caso de que el _username_ ya exista se le envía un mensaje al usuaio, en caso contrario se añade al array de usuarios, almacenandola en la conexión websocket.

Para poder mostrar los videos en la aplicación debemos configurar un espacio para esto.

```html
    <div id="call">
        <video id='local' autoplay></video>
        <video id='remote' autoplay></video>
    </div>
```

Tenemos que configurar en el handler del login lo que debe ocurrir una vez se ha creado correctamente. Esto implica pillar los valores de la webcam local y usarla como local en el video de la página, asi como se deben crear los candidates y los servidores stun.

Ahora vamos a añadir la opción para que una vez se haya iniciado sesión se pueda llamar a otro usuario conociendo su username.

```html
<div>
  <input id="username-to-call" placeholder="Username to call" />
  <button id="call">Call</button>
  <button id="close-call">Close call</button>
</div>
```

Y ahora debemos de configurar el funcionamiento una vez se pulse el botón de llamada.

```JavaScript

document.querySelector('button#call').addEventListener('click', () => {
  const callToUsername = document.querySelector('input#username-to-call').value

  if (callToUsername.length === 0) {
    alert('Enter a username ')
    return
  }
```

También tenemos que crear el _offer_ para que el servidor pueda manejarlo, además hay que configurar como el servidor se encarga de manejar este tipo de datos.

En la parte del cliente tenemos que configuar para que una vez recibida una _offer_ se crea una respuesta

```JavaScript
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
      alert('Error when creating an answer')
      console.error(error)
    }
  )
}
```

Y en la parte del servidor tenemos que manejar esta respuesta.

En la parte del cliente el usuario obtendra la respuesta que iniciará ``handleAnswer()``. El cual se encarga de sincronizar las propiedades del lado remoto de la conexión.

```JavaScript
const handleAnswer = answer => {
  connection.setRemoteDescription(new RTCSessionDescription(answer))
}
```

Una vez se han sincronizado las descipciones de las sesiones, los extremos pueden empezar a determinar como establecer las conexiones mediante el **ICE Protocol**.

Para ello necesitamos establecer en el lado del cliente un ``onicecandidate``

```JavaScript
connection.onicecandidate = event => {
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      candidate: event.candidate
    })
  }
}
```

Y en el lado del servidor debemos manejar este tipo de mensajes.

Y el lado del cliente debe recivirlos.

```JavaScript
const handelCandidate = candidate => {
    connection.addIceCandidate(new RTCIceCandidate(candidate))
}
```


Por último, nos queda definir como se va a finalizar la conexión, para ello vamos a definir un botón el cual se encargará de esto.

```html
<button id='close-call'>Close call</button>
```

Al cual se le definirá una función al ser pulsado.

```JavaScript
document.querySelector('button#close-call').addEventListener('click', () => {
    sendMessage({
        type: 'close'
    })
    handleClose()
})
```

En el lado del servidor debemos manejar este caso.

```JavaScript
  console.log('Disconnecting from', data.otherUsername)
  users[data.otherUsername].otherUsername = null
  if (users[data.otherUsername] != null) {
    sendTo(users[data.otherUsername], { type: 'close' })
  }
  break
```

Así como en el lado del cliente.

Debido a que los métodos están desactualizados hay que corregir los siguientes campos:
1. Primero deemos añadir algunas librerias más

```shell
npm install express
```

```shell
npm install --save express-ws
```

2. Tenemos que modificar el lado del servidor para que soporte algunas modificadiones.


```JavaScript
const WebSocket = require('ws')
var express = require('express')
var app = express()
var expressWs = require('express-ws')(app)
const users = {}

app.ws('/', (ws, req) => {
    console.log('User connected')
```

```JavaScript
app.use(express.static('../public'))
app.listen(8080, () => {
    console.log('Listening on port 8080')
})
```

## Implemntación Heroku

Para hacer la comprobación del funcionamiento con https, vamos a utilizar heroku. Para ello vamos a necesitar:

1. Crear el archivo ``Procfile`` en el directorio raíz, en el cual incluimos lo siguiente

```shell
web : node server.js
```

2. Creamos un script en el archivo ``package.json`` 

