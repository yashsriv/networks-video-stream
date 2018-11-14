import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '../users.service';
import { User } from '../models/user';
import { AuthService } from '../auth.service';

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
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss'],
})
export class JoinComponent {
  private room;
  private isChannelReady = false;
  private isStarted = false;
  private pc: RTCPeerConnection;
  private ownerId: string;
  private ownerUsername: string;
  private remoteStream: MediaStream;
  private turnReady;
  private socket: WebSocket;
  private missing = false;

  public chats: { from: string; body: string }[] = [];

  @ViewChild('chatContainer')
  private chatContainer: ElementRef<HTMLDivElement>;
  @ViewChild('chat')
  private chat: ElementRef<HTMLDivElement>;
  @ViewChild('remoteVideo')
  private remoteVideo: ElementRef<HTMLVideoElement>;

  get initial() {
    return `${window.location.protocol}//${window.location.host}/join/`;
  }

  get owner(): User {
    if (this.ownerUsername) {
      return this.users.entities[this.ownerUsername];
    }
  }

  get username(): string {
    return this.auth.currentUser;
  }

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private users: UsersService
  ) {}

  ngOnInit() {
    this.room = this.route.snapshot.paramMap.get('id');
    const socket = new WebSocket('ws://' + window.location.host + '/ws');
    this.socket = socket;
    socket.onopen = ev => {
      this.sendMessage({ type: 'join-room', body: { room: this.room } });
      this.main();
    };
    socket.onmessage = ev => this.handleMessage(ev);
  }

  private sendMessage(message) {
    console.log('Client sending message: ', message);
    this.socket.send(JSON.stringify(message));
  }

  private main() {
    // if (location.hostname !== 'localhost') {
    //   requestTurn(
    //     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    //   );
    // }
  }

  private handleMessage(event: MessageEvent) {
    const msg = JSON.parse(event.data);

    switch (msg.type) {
      case 'joined-room':
        {
          console.log('joined: ' + this.room);
          this.isChannelReady = true;
          this.ownerId = msg.from;
          this.ownerUsername = msg.body;
        }
        break;
      case 'got-user-media':
        {
          this.maybeStart();
        }
        break;
      case 'offer':
        {
          if (!this.isStarted) {
            this.maybeStart();
          }
          this.pc.setRemoteDescription(new RTCSessionDescription(msg.body));
          this.doAnswer();
        }
        break;
      case 'candidate':
        {
          if (this.isStarted) {
            var candidate = new RTCIceCandidate({
              sdpMLineIndex: msg.body.label,
              candidate: msg.body.candidate,
            });
            this.pc.addIceCandidate(candidate);
          }
        }
        break;
      case 'room-not-found':
        this.missing = true;
        break;
      case 'chat':
        this.chats = [...this.chats, { from: msg.from, body: msg.body }];
        break;
      case 'bye':
        {
          if (this.isStarted) {
            this.handleRemoteHangup();
          }
        }
        break;
    }
  }

  private maybeStart() {
    console.log('>>>>>>> maybeStart() ', this.isStarted, this.isChannelReady);
    if (!this.isStarted && this.isChannelReady) {
      console.log('>>>>>> creating peer connection');
      this.createPeerConnection();
      this.isStarted = true;
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler(event) {
    this.stop();
    this.sendMessage({ type: 'bye', to: this.ownerId });
  }

  private createPeerConnection() {
    try {
      this.pc = new RTCPeerConnection(null);
      this.pc.onicecandidate = ev => this.handleIceCandidate(ev);
      (<any>this.pc).onaddstream = ev => this.handleRemoteStreamAdded(ev);
      (<any>this.pc).onremovestream = ev => this.handleRemoteStreamRemoved(ev);
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
  }

  private handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      this.sendMessage({
        to: this.ownerId,
        type: 'candidate',
        body: {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
        },
      });
    } else {
      console.log('End of candidates.');
    }
  }

  private doAnswer() {
    console.log('Sending answer to peer.');
    this.pc
      .createAnswer()
      .then(
        desc => this.setLocalAndSendMessage(desc),
        err => this.onCreateSessionDescriptionError(err)
      );
  }

  private setLocalAndSendMessage(sessionDescription) {
    this.pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    this.sendMessage({
      to: this.ownerId,
      type: sessionDescription.type,
      body: sessionDescription,
    });
  }

  private onCreateSessionDescriptionError(error) {
    console.trace('Failed to create session description: ' + error.toString());
  }

  private handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    this.remoteStream = event.stream;
    this.remoteVideo.nativeElement.srcObject = this.remoteStream;
  }

  private handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }

  public hangup() {
    console.log('Hanging up.');
    this.stop();
    this.sendMessage({ type: 'bye', to: this.ownerId });
  }

  private handleRemoteHangup() {
    console.log('Session terminated.');
    this.missing = true;
    this.stop();
  }

  private stop() {
    if (!this.isStarted) {
      return;
    }
    let tracks = this.remoteStream.getTracks();

    tracks.forEach(function(track) {
      track.stop();
    });
    this.remoteVideo.nativeElement.srcObject = null;

    this.isStarted = false;
    this.pc.close();
    this.pc = null;
  }

  ngOnDestroy() {
    this.stop();
  }

  send() {
    this.sendMessage({
      type: 'chat',
      body: this.chat.nativeElement.textContent,
    });
    this.chat.nativeElement.innerHTML = '';
  }

  private scrollBottom() {
    this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
  }
}
