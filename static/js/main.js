'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

/////////////////////////////////////////////

var room = '';
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = new WebSocket("ws://" + window.location.host + "/ws");

socket.onopen = function(event) {
  document.getElementById('create').onclick = function() {
    sendMessage({type: 'create-room'});
    isInitiator = true;
    main();
  };
  document.getElementById('join').onclick = function() {
    room = prompt('Enter room name:');
    sendMessage({type: 'join-room', body: { room: room }});
    main();
  };
};

socket.onmessage = function(event) {
  var msg = JSON.parse(event.data);

  switch(msg.type) {
    case "created-room": {
      room = msg.body.room;
      console.log('Created room ' + room);
      isInitiator = true;
    }
    break;
    case "joined-room-inform": {
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      isChannelReady = true;
      maybeStart();
    }
    break;
    case "joined-room": {
      console.log('joined: ' + room);
      isChannelReady = true;
    }
    break;
    case "got-user-media": {
      maybeStart();
    }
    break;
    case "offer": {
      if (!isInitiator && !isStarted) {
        maybeStart();
      }
      pc.setRemoteDescription(new RTCSessionDescription(msg.body));
      doAnswer();
    }
    break;
    case "answer": {
      if (isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(msg.body));
      }
    }
    break;
    case "candidate": {
      if (isStarted) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: msg.body.label,
          candidate: msg.body.candidate
        });
        pc.addIceCandidate(candidate);
      }
    }
    break;
    case "bye": {
      if (isStarted) {
        handleRemoteHangup();
      }
    }
    break;
  }
};

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.send(JSON.stringify(message));
}

function main() {
  if (isInitiator) {
    var constraints = {
      audio: true,
      video: true
    };
    navigator.mediaDevices.getUserMedia(constraints)
      .then(gotStream)
      .catch(function(e) {
        alert('getUserMedia() error: ' + e.name);
      });

    console.log('Getting user media with constraints', constraints);
  }

  // if (location.hostname !== 'localhost') {
  //   requestTurn(
  //     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  //   );
  // }

}

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');


function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage({ type: 'got-user-media' });
  if (isInitiator) {
    maybeStart();
  }
}


function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && (typeof localStream !== 'undefined' || !isInitiator) && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      pc.addStream(localStream);
      doCall();
    }
  }
}

window.onbeforeunload = function() {
  sendMessage({ type: 'bye' });
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      body: {
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      }
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage({ type: sessionDescription.type, body: sessionDescription });
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage({type: 'bye'});
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  // stop();
  // isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}
