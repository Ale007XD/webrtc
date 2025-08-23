// E2EE Worker for WebRTC Encoded Transforms
// Implements AES-GCM encryption/decryption for video/audio frames

interface E2EEConfig {
  role: 'sender' | 'receiver';
  sessionKey?: Uint8Array;
}

interface FrameMetadata {
  sequenceNumber: number;
  timestamp: number;
  keyId: number;
  isKeyFrame?: boolean;
}

class E2EETransformer {
  private sessionKey: Uint8Array | null = null;
  private keyId: number = 0;
  private sequenceNumber: number = 0;
  private role: 'sender' | 'receiver';
  private decryptionKeys: Map<number, Uint8Array> = new Map();

  constructor(config: E2EEConfig) {
    this.role = config.role;
    if (config.sessionKey) {
      this.setSessionKey(config.sessionKey);
    }
  }

  async setSessionKey(key: Uint8Array, keyId?: number): Promise<void> {
    this.sessionKey = key;
    this.keyId = keyId || this.keyId;

    if (this.role === 'receiver') {
      this.decryptionKeys.set(this.keyId, key);
      if (this.decryptionKeys.size > 3) {
        const oldestKeyId = Math.min(...this.decryptionKeys.keys());
        this.decryptionKeys.delete(oldestKeyId);
      }
    }
  }

  private async deriveFrameKey(sessionKey: Uint8Array, metadata: FrameMetadata, isAudio: boolean): Promise<CryptoKey> {
    const info = new TextEncoder().encode(`frame-${isAudio ? 'audio' : 'video'}-${metadata.keyId}-${metadata.sequenceNumber}`);

    const keyMaterial = await crypto.subtle.importKey('raw', sessionKey, { name: 'HKDF' }, false, ['deriveKey']);

    return await crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private createNonce(metadata: FrameMetadata): Uint8Array {
    const nonce = new Uint8Array(12);
    const view = new DataView(nonce.buffer);
    view.setUint32(0, metadata.sequenceNumber, false);
    view.setUint32(4, metadata.timestamp & 0xFFFFFFFF, false);
    view.setUint32(8, metadata.keyId, false);
    return nonce;
  }

  async encryptFrame(frame: RTCEncodedVideoFrame | RTCEncodedAudioFrame): Promise<RTCEncodedVideoFrame | RTCEncodedAudioFrame> {
    if (!this.sessionKey) return frame;

    try {
      const isAudio = frame.type === undefined;
      const metadata: FrameMetadata = {
        sequenceNumber: this.sequenceNumber++,
        timestamp: frame.timestamp,
        keyId: this.keyId,
        isKeyFrame: !isAudio ? (frame as RTCEncodedVideoFrame).type === 'key' : false
      };

      const frameKey = await this.deriveFrameKey(this.sessionKey, metadata, isAudio);
      const nonce = this.createNonce(metadata);
      const originalData = new Uint8Array(frame.data);

      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce, additionalData: new TextEncoder().encode(JSON.stringify(metadata)) },
        frameKey,
        originalData
      );

      const finalData = new ArrayBuffer(4 + JSON.stringify(metadata).length + encryptedData.byteLength);
      const finalView = new Uint8Array(finalData);
      let offset = 0;

      new DataView(finalData).setUint32(offset, JSON.stringify(metadata).length, false);
      offset += 4;

      const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
      finalView.set(metadataBytes, offset);
      offset += metadataBytes.length;

      finalView.set(new Uint8Array(encryptedData), offset);
      frame.data = finalData;

      return frame;
    } catch (error) {
      console.error('E2EE encryption error:', error);
      return frame;
    }
  }

  async decryptFrame(frame: RTCEncodedVideoFrame | RTCEncodedAudioFrame): Promise<RTCEncodedVideoFrame | RTCEncodedAudioFrame> {
    try {
      const frameData = new Uint8Array(frame.data);
      if (frameData.length < 8) return frame;

      let offset = 0;
      const metadataLength = new DataView(frameData.buffer).getUint32(offset, false);
      offset += 4;

      if (offset + metadataLength > frameData.length) return frame;

      const metadataBytes = frameData.slice(offset, offset + metadataLength);
      const metadata: FrameMetadata = JSON.parse(new TextDecoder().decode(metadataBytes));
      offset += metadataLength;

      const sessionKey = this.decryptionKeys.get(metadata.keyId);
      if (!sessionKey) return frame;

      const frameKey = await this.deriveFrameKey(sessionKey, metadata, frame.type === undefined);
      const nonce = this.createNonce(metadata);
      const encryptedData = frameData.slice(offset);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce, additionalData: new TextEncoder().encode(JSON.stringify(metadata)) },
        frameKey,
        encryptedData
      );

      frame.data = decryptedData;
      return frame;
    } catch (error) {
      console.error('E2EE decryption error:', error);
      return frame;
    }
  }
}

let transformer: E2EETransformer | null = null;

self.addEventListener('rtctransform', (event) => {
  const rtcTransformEvent = event as RTCTransformEvent;

  if (!transformer) {
    const config = rtcTransformEvent.transformer.options as E2EEConfig;
    transformer = new E2EETransformer(config);
  }

  const reader = rtcTransformEvent.transformer.readable.getReader();
  const writer = rtcTransformEvent.transformer.writable.getWriter();

  async function processFrames() {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let processedFrame;
        if (transformer!.role === 'sender') {
          processedFrame = await transformer!.encryptFrame(value);
        } else {
          processedFrame = await transformer!.decryptFrame(value);
        }

        await writer.write(processedFrame);
      }
    } catch (error) {
      console.error('E2EE frame processing error:', error);
    }
  }

  processFrames();
});

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'setSessionKey' && transformer) {
    await transformer.setSessionKey(data.key, data.keyId);
    self.postMessage({ type: 'sessionKeySet', keyId: data.keyId });
  }
});