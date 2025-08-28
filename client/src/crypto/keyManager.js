// Функция для генерации пары ключей ECDH (Curve25519)
export async function generateExchangeKeys() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "X25519", // Curve25519 для ECDH
    },
    true, // Ключ можно экспортировать
    ["deriveKey", "deriveBits"] // Разрешенные операции
  );
  return keyPair;
}

// Функция для вычисления общего секрета
export async function deriveSharedSecret(privateKey, theirPublicKey) {
  const sharedSecret = await window.crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: theirPublicKey,
    },
    privateKey,
    256 // Длина секрета в битах
  );
  // На основе секрета можно вывести ключ для AES-GCM
  return sharedSecret;
}
