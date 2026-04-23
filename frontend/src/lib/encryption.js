// src/lib/encryption.js
// Raven Chat — End-to-End Encryption
// Uses Diffie-Hellman (ECDH) for key exchange + AES-256-GCM for message encryption

const encryption = {

  async generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    );
    const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));
    await encryption.savePrivateKey(privateKeyBase64);
    return { publicKeyBase64, privateKeyBase64 };
  },

  async deriveSharedSecret(myPrivateKeyBase64, theirPublicKeyBase64) {
    const privateKeyBuffer = Uint8Array.from(atob(myPrivateKeyBase64), c => c.charCodeAt(0));
    const privateKey = await crypto.subtle.importKey(
      "pkcs8", privateKeyBuffer,
      { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]
    );
    const publicKeyBuffer = Uint8Array.from(atob(theirPublicKeyBase64), c => c.charCodeAt(0));
    const theirPublicKey = await crypto.subtle.importKey(
      "spki", publicKeyBuffer,
      { name: "ECDH", namedCurve: "P-256" }, false, []
    );
    return await crypto.subtle.deriveKey(
      { name: "ECDH", public: theirPublicKey },
      privateKey,
      { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  },

  async encryptMessage(plaintext, sharedKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedMessage = new TextEncoder().encode(plaintext);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv }, sharedKey, encodedMessage
    );
    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  },

  async decryptMessage(ciphertext, ivBase64, sharedKey) {
    const encryptedBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv }, sharedKey, encryptedBuffer
    );
    return new TextDecoder().decode(decryptedBuffer);
  },

  async savePrivateKey(privateKeyBase64) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("RavenKeys", 1);
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore("keys", { keyPath: "id" });
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("keys", "readwrite");
        tx.objectStore("keys").put({ id: "myPrivateKey", value: privateKeyBase64 });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async loadPrivateKey() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("RavenKeys", 1);
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore("keys", { keyPath: "id" });
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("keys", "readonly");
        const req = tx.objectStore("keys").get("myPrivateKey");
        req.onsuccess = () => resolve(req.result?.value || null);
        req.onerror = () => reject(req.error);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async prepareMessage(plaintext, myPrivateKeyBase64, theirPublicKeyBase64) {
    const sharedKey = await encryption.deriveSharedSecret(myPrivateKeyBase64, theirPublicKeyBase64);
    return await encryption.encryptMessage(plaintext, sharedKey);
  },

  async readMessage(ciphertext, iv, myPrivateKeyBase64, theirPublicKeyBase64) {
    const sharedKey = await encryption.deriveSharedSecret(myPrivateKeyBase64, theirPublicKeyBase64);
    return await encryption.decryptMessage(ciphertext, iv, sharedKey);
  },

  // ─────────────────────────────────────────
  // Encrypt private key with user's password for server backup
  // ─────────────────────────────────────────
  async encryptPrivateKeyWithPassword(privateKeyBase64, password) {
    const passwordKey = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password),
      "PBKDF2", false, ["deriveKey"]
    );
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const aesKey = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false, ["encrypt"]
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      new TextEncoder().encode(privateKeyBase64)
    );
    return {
      encryptedPrivateKey: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
    };
  },

  // ─────────────────────────────────────────
  // Decrypt private key backup using password
  // ─────────────────────────────────────────
  async decryptPrivateKeyWithPassword(encryptedPrivateKey, saltBase64, ivBase64, password) {
    const passwordKey = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password),
      "PBKDF2", false, ["deriveKey"]
    );
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const aesKey = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false, ["decrypt"]
    );
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const encrypted = Uint8Array.from(atob(encryptedPrivateKey), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv }, aesKey, encrypted
    );
    return new TextDecoder().decode(decrypted);
  },
};

export default encryption;