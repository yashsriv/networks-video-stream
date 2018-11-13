'use strict';

var isChannelReady = false;
var isStarted = false;
var pc;
var ownerId;
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

var remoteVideo = document.querySelector('#remoteVideo');

var room = '';
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = new WebSocket("ws://" + window.location.host + "/ws");

socket.onopen = function(event) {
  document.getElementById('join').onclick = function() {
    room = prompt('Enter room name:');
    sendMessage({type: 'join-room', body: { room: room }});
    main();
  };
};

socket.onmessage = function(event) {
  var msg = JSON.parse(event.data);

  switch(msg.type) {
    case "joined-room": {
      console.log('joined: ' + room);
      isChannelReady = true;
      ownerId = msg.from;
    }
    break;
    case "got-user-media": {
      maybeStart();
    }
    break;
    case "offer": {
      if (!isStarted) {
        maybeStart();
      }
      pc.setRemoteDescription(new RTCSessionDescription(msg.body));
      doAnswer();
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
  // if (location.hostname !== 'localhost') {
  //   requestTurn(
  //     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  //   );
  // }
}

function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, isChannelReady);
  if (!isStarted &&  isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    isStarted = true;
  }
}

window.onbeforeunload = function() {
  sendMessage({ type: 'bye', to: ownerId });
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
      to: ownerId,
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
  sendMessage({ to: ownerId, type: sessionDescription.type, body: sessionDescription });
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
  sendMessage({type: 'bye', to: ownerId});
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}
