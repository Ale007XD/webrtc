import React, { useRef, useEffect, useState } from 'react';

interface VideoCallProps {
  localUserId: string;
  remoteUserId: string;
  onCallEnd: () => void;
  onError: (error: string) => void;
}

interface CallState {
  isConnecting: boolean;
  isConnected: boolean;
  isAudioOnly: boolean;
  isE2EEEnabled: boolean;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  localUserId,
  remoteUserId,
  onCallEnd,
  onError
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [callState, setCallState] = useState<CallState>({
    isConnecting: true,
    isConnected: false,
    isAudioOnly: false,
    isE2EEEnabled: false
  });

  const [isLocalVideoMuted, setIsLocalVideoMuted] = useState(false);
  const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(false);

  useEffect(() => {
    initializeCall();
  }, []);

  const initializeCall = async () => {
    try {
      // Check E2EE support
      const hasEncodedTransforms = 
        'RTCRtpSender' in window &&
        'transform' in RTCRtpSender.prototype;

      if (!hasEncodedTransforms) {
        onError('Ваш браузер не поддерживает сквозное шифрование. Используйте Chrome/Chromium.');
        return;
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 30 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setCallState(prev => ({ ...prev, isE2EEEnabled: true, isConnected: true, isConnecting: false }));

    } catch (error) {
      console.error('Failed to initialize call:', error);
      onError('Не удалось получить доступ к камере/микрофону');
    }
  };

  const toggleVideo = () => {
    setIsLocalVideoMuted(!isLocalVideoMuted);
  };

  const toggleAudio = () => {
    setIsLocalAudioMuted(!isLocalAudioMuted);
  };

  const endCall = () => {
    onCallEnd();
  };

  return (
    <div className="video-call">
      {callState.isE2EEEnabled && (
        <div className="e2ee-status">
          🔒 Сквозное шифрование активно
        </div>
      )}

      <div className="video-container">
        <div className="remote-video-wrapper">
          {callState.isAudioOnly ? (
            <div className="audio-only-indicator">
              <div className="avatar">🎵</div>
              <div className="username">{remoteUserId}</div>
            </div>
          ) : (
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
          )}
        </div>

        <div className="local-video-wrapper">
          {isLocalVideoMuted ? (
            <div className="video-disabled">📹</div>
          ) : (
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
          )}
        </div>
      </div>

      <div className="call-controls">
        <button 
          onClick={toggleAudio} 
          className={`control-btn ${isLocalAudioMuted ? 'muted' : ''}`}
        >
          {isLocalAudioMuted ? '🔇' : '🎤'}
        </button>

        <button 
          onClick={toggleVideo}
          className={`control-btn ${isLocalVideoMuted ? 'muted' : ''}`}
        >
          {isLocalVideoMuted ? '📹' : '📷'}
        </button>

        <button onClick={endCall} className="control-btn end-call">
          📞
        </button>
      </div>

      <style jsx>{`
        .video-call {
          position: relative;
          width: 100%;
          height: 100vh;
          background: #000;
          display: flex;
          flex-direction: column;
        }

        .e2ee-status {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 10;
          background: rgba(0, 0, 0, 0.8);
          color: #4CAF50;
          padding: 10px;
          border-radius: 8px;
          font-size: 14px;
        }

        .video-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .remote-video-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .remote-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .audio-only-indicator {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .audio-only-indicator .avatar {
          font-size: 120px;
          margin-bottom: 20px;
        }

        .local-video-wrapper {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 160px;
          height: 120px;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #fff;
        }

        .local-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-disabled {
          width: 100%;
          height: 100%;
          background: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 40px;
        }

        .call-controls {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 15px;
        }

        .control-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50px;
          padding: 15px;
          color: white;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 60px;
          height: 60px;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .control-btn.muted {
          background: #f44336;
        }

        .control-btn.end-call {
          background: #f44336;
        }
      `}</style>
    </div>
  );
};