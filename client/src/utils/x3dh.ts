// Simplified X3DH Key Exchange for WebRTC E2EE

export interface ContactInfo {
  userId: string;
  publicKeys: {
    identity: ArrayBuffer;
    signedPreKey: ArrayBuffer;
    signature: ArrayBuffer;
  };
}

export class X3DHKeyExchange {
  private identityKeyPair: CryptoKeyPair | null = null;

  async generateKeyBundle() {
    this.identityKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    return {
      identityKey: this.identityKeyPair.publicKey
    };
  }

  async performX3DH(remoteContact: ContactInfo): Promise<Uint8Array> {
    if (!this.identityKeyPair) {
      throw new Error('Local key bundle not generated');
    }

    const remoteIdentityKey = await crypto.subtle.importKey(
      'raw',
      remoteContact.publicKeys.identity,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const sharedSecret = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: remoteIdentityKey },
      this.identityKeyPair.privateKey,
      256
    );

    return await this.deriveSessionKey(sharedSecret);
  }

  private async deriveSessionKey(sharedSecret: ArrayBuffer): Promise<Uint8Array> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    const sessionKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32),
        info: new TextEncoder().encode('WebRTC-E2EE-Session-Key')
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const rawKey = await crypto.subtle.exportKey('raw', sessionKey);
    return new Uint8Array(rawKey);
  }

  async generateSAS(sessionKey: Uint8Array): Promise<string> {
    const sasData = await crypto.subtle.digest('SHA-256', sessionKey.slice(0, 16));
    const sasBytes = new Uint8Array(sasData);
    const sasNumbers = [];

    for (let i = 0; i < 6; i++) {
      sasNumbers.push(sasBytes[i] % 100);
    }

    return sasNumbers.map(n => n.toString().padStart(2, '0')).join('-');
  }
}