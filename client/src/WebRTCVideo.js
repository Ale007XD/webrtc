import React, { useRef, useState } from 'react';
import io from "socket.io-client";
import jwt_decode from 'jwt-decode';

const SIGNALING_URL = "wss://your-signaling-server.com";
const STUN_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Для TURN:
    // { urls: 'turn:yourdomain.com:3478', username: 'username', credential: 'password' }
  ]
};

export default function WebRTCVideo({ token }) {
  const localVideo = useRef();
  const remoteVideo = useRef();
  const [peerId, setPeerId] = useState("");
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);

  // connect to signaling
  const connect = async () => {
    const s = io(SIGNALING_URL, {
      auth: { token }
    });
    setSocket(s);

    s.on('id', id => setPeerId(id));
    s.on('signal', async ({ from, data }) => {
      if (data.type === 'offer') {
        await handleOffer(from, data);
      } else if (data.type === 'answer') {
        await peer.setRemoteDescription(data);
      } else if (data.candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(data));
      }
    });

    // get user media
    let localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.current.srcObject = localStream;

    // E2EE insertable streams (демо)
    const pc = new RTCPeerConnection(STUN_CONFIG);
    setPeer(pc);

    localStream.getTracks().forEach(track => {
      // В реале: track.insertableStreams + шифрование аудио/видео пакетов
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      remoteVideo.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) s.emit('signal', { to: /* receiver id */, data: e.candidate });
    };
  };

  // отправка offer
  const call = async (theirId) => {
    if (!peer) return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('signal', { to: theirId, data: offer });
  };

  // обработка offer
  const handleOffer = async (from, offer) => {
    if (!peer) return;
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit('signal', { to: from, data: answer });
  };

  return (
    <div>
      <button onClick={connect}>Connect</button>
      <div>Your peer id: {peerId}</div>
      <input placeholder="Their id" id="theirId" />
      <button onClick={() => call(document.getElementById('theirId').value)}>Call</button>
      <video ref={localVideo} autoPlay muted />
      <video ref={remoteVideo} autoPlay />
    </div>
  );
}
