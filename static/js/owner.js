'use strict';

var isStarted = {};
var localStream;
var id_idx = {};
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
var socket = new WebSocket("ws://" + window.location.host + "/ws");

socket.onopen = function(event) {
  document.getElementById('create').onclick = function() {
    sendMessage({type: 'create-room'});
    main();
  };
};

socket.onmessage = function(event) {
  var msg = JSON.parse(event.data);

  switch(msg.type) {
    case "created-room": {
      room = msg.body.room;
      console.log('Created room ' + room);
    }
    break;
    case "joined-room-inform": {
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      startWith(msg.from);
    }
    break;
    case "answer": {
      if (isStarted[msg.from]) {
        id_idx[msg.from].setRemoteDescription(new RTCSessionDescription(msg.body));
      }
    }
    break;
    case "candidate": {
      if (isStarted[msg.from]) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: msg.body.label,
          candidate: msg.body.candidate
        });
        id_idx[msg.from].addIceCandidate(candidate);
      }
    }
    break;
    case "bye": {
      if (isStarted[msg.from]) {
        handleRemoteHangup(msg.from);
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
  // if (location.hostname !== 'localhost') {
  //   requestTurn(
  //     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  //   );
  // }
}

function gotStream(stream) {
  var localVideo = document.querySelector('#localVideo');
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage({ type: 'got-user-media' });
}

function startWith(id) {
  if (!isStarted[id] && typeof localStream !== 'undefined') {
    console.log('>>>>>> creating peer connection with ', id);
    isStarted[id] = true;
    createPeerConnection(id);
    id_idx[id].addStream(localStream);
    doCall(id);
  }
}

window.onbeforeunload = function() {
  sendMessage({ type: 'bye' });
};

/////////////////////////////////////////////////////////

function createPeerConnection(id) {
  try {
    var pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate(id);
    id_idx[id] = pc;
    console.log('Created RTCPeerConnnection with ', id);
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(id) {
  return function (event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        to: id,
        body: {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        }
      });
    } else {
      console.log('End of candidates.');
    }
  };
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall(id) {
  console.log('Sending offer to peer');
  id_idx[id].createOffer(setLocalAndSendMessage(id), handleCreateOfferError);
}

function setLocalAndSendMessage(id) {
  return function (sessionDescription) {
    id_idx[id].setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage({ type: sessionDescription.type, to: id, body: sessionDescription });
  };
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

function hangup() {
  console.log('Hanging up.');
  Object.keys(id_idx).forEach(function (id) {
    var pc = id_idx[id];
    pc.close();
    isStarted[id] = false;
  });
  id_idx = {};
  sendMessage({type: 'bye'});
}

function handleRemoteHangup(id) {
  console.log('Session terminated.');
  id_idx[id].close();
  isStarted[id] = false;
  delete id_idx[id];
}
