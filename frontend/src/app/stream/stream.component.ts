import {
  Component,
  HostListener,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';

const pcConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

// Set up audio and video regardless of what devices are present.
const sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
};

@Component({
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.scss'],
})
export class StreamComponent {
  private isStarted: { [key: string]: boolean } = {};
  private localStream: MediaStream;
  private id_idx: { [key: string]: RTCPeerConnection } = {};
  private turnReady;

  private room = '';
  private socket: WebSocket;

  @ViewChild('localVideo')
  public localVideo: ElementRef<HTMLVideoElement>;

  constructor(private zone: NgZone) {}

  get initial() {
    return `${window.location.protocol}//${window.location.host}/join/`;
  }

  ngOnInit() {
    const socket = new WebSocket('ws://' + window.location.host + '/ws');
    this.socket = socket;

    socket.onopen = event => {
      this.sendMessage({ type: 'create-room' });
      this.main();
    };
    socket.onmessage = ev => this.handleMessage(ev);
  }

  private sendMessage(message) {
    console.log('Client sending message: ', message);
    this.socket.send(JSON.stringify(message));
  }

  private main() {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: true,
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(m => this.gotStream(m))
      .catch(function(e) {
        alert('getUserMedia() error: ' + e.name);
        console.log(e);
      });

    console.log('Getting user media with constraints', constraints);
    // if (location.hostname !== 'localhost') {
    //   requestTurn(
    //     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    //   );
    // }
  }

  private gotStream(stream: MediaStream) {
    console.log('Adding local stream.');
    this.localStream = stream;
    this.localVideo.nativeElement.srcObject = stream;
    this.sendMessage({ type: 'got-user-media' });
  }

  private handleMessage(event: MessageEvent) {
    var msg = JSON.parse(event.data);

    switch (msg.type) {
      case 'created-room':
        {
          this.room = msg.body.room;
          console.log('Created room ' + this.room);
        }
        break;
      case 'joined-room-inform':
        {
          console.log('Another peer made a request to join room ' + this.room);
          console.log('This peer is the initiator of room ' + this.room + '!');
          this.startWith(msg.from);
        }
        break;
      case 'answer':
        {
          if (this.isStarted[msg.from]) {
            this.id_idx[msg.from].setRemoteDescription(
              new RTCSessionDescription(msg.body)
            );
          }
        }
        break;
      case 'candidate':
        {
          if (this.isStarted[msg.from]) {
            var candidate = new RTCIceCandidate({
              sdpMLineIndex: msg.body.label,
              candidate: msg.body.candidate,
            });
            this.id_idx[msg.from].addIceCandidate(candidate);
          }
        }
        break;
      case 'bye':
        {
          if (this.isStarted[msg.from]) {
            this.handleRemoteHangup(msg.from);
          }
        }
        break;
    }
  }

  private startWith(id: string) {
    if (!this.isStarted[id] && typeof this.localStream !== 'undefined') {
      console.log('>>>>>> creating peer connection with ', id);
      this.isStarted[id] = true;
      this.createPeerConnection(id);
      (<any>this.id_idx[id]).addStream(this.localStream);
      this.doCall(id);
    }
  }

  private createPeerConnection(id: string) {
    try {
      var pc = new RTCPeerConnection(null);
      pc.onicecandidate = ev => this.handleIceCandidate(id)(ev);
      this.id_idx[id] = pc;
      console.log('Created RTCPeerConnnection with ', id);
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
  }

  private handleIceCandidate(id: string) {
    return event => {
      console.log('icecandidate event: ', event);
      if (event.candidate) {
        this.sendMessage({
          type: 'candidate',
          to: id,
          body: {
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
          },
        });
      } else {
        console.log('End of candidates.');
      }
    };
  }

  private handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
  }

  private doCall(id: string) {
    console.log('Sending offer to peer');
    this.id_idx[id]
      .createOffer()
      .then(this.setLocalAndSendMessage(id))
      .catch(this.handleCreateOfferError);
  }

  private setLocalAndSendMessage(id) {
    return sessionDescription => {
      this.id_idx[id].setLocalDescription(sessionDescription);
      console.log('setLocalAndSendMessage sending message', sessionDescription);
      this.sendMessage({
        type: sessionDescription.type,
        to: id,
        body: sessionDescription,
      });
    };
  }

  private onCreateSessionDescriptionError(error) {
    console.trace('Failed to create session description: ' + error.toString());
  }

  public hangup() {
    console.log('Hanging up.');
    Object.keys(this.id_idx).forEach(id => {
      var pc = this.id_idx[id];
      pc.close();
      this.isStarted[id] = false;
    });
    this.id_idx = {};
    this.sendMessage({ type: 'bye' });
  }

  private handleRemoteHangup(id) {
    console.log('Session terminated.');
    this.id_idx[id].close();
    this.isStarted[id] = false;
    delete this.id_idx[id];
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler(event) {
    this.sendMessage({ type: 'bye' });
  }
}
