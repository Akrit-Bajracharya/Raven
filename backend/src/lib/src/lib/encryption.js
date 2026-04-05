// src/lib/encryption.js
// Raven Chat — End-to-End Encryption
// Uses Diffie-Hellman (ECDH) for key exchange + AES-256-GCM for message encryption

const encryption = {

  // ─────────────────────────────────────────
  // STEP 1: Generate your key pair (run once on login)
  // Private key stays on YOUR device only
  // Public key gets shared with the server so others can message you
  // ─────────────────────────────────────────
  async generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    );

    // Export public key to send to server
    const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

    // Export private key to store locally (IndexedDB)
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

    // Save to IndexedDB immediately
    await encryption.savePrivateKey(privateKeyBase64);

    return { publicKeyBase64, privateKeyBase64 };
  },

  // ─────────────────────────────────────────
  // STEP 2: Diffie-Hellman magic
  // You + recipient both have each other's public keys
  // This derives the SAME shared secret on both sides
  // Neither of you ever sent the secret — it just... appears
  // ─────────────────────────────────────────
  async deriveSharedSecret(myPrivateKeyBase64, theirPublicKeyBase64) {
    // Import your private key
    const privateKeyBuffer = Uint8Array.from(atob(myPrivateKeyBase64), c => c.charCodeAt(0));
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveKey"]
    );

    // Import their public key
    const publicKeyBuffer = Uint8Array.from(atob(theirPublicKeyBase64), c => c.charCodeAt(0));
    const theirPublicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    // Derive the shared AES key using Diffie-Hellman
    // Both users run this and get the EXACT same key
    const sharedKey = await crypto.subtle.deriveKey(
      { name: "ECDH", public: theirPublicKey },
      privateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    return sharedKey;
  },

  // ─────────────────────────────────────────
  // STEP 3: Encrypt a message with AES-256-GCM
  // Uses the shared secret derived from Diffie-Hellman above
  // Returns an object you can safely send over the network
  // ─────────────────────────────────────────
  async encryptMessage(plaintext, sharedKey) {
    // Random IV — different every single message (critical for security)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encodedMessage = new TextEncoder().encode(plaintext);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      encodedMessage
    );

    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  },

  // ─────────────────────────────────────────
  // STEP 4: Decrypt a received message
  // ─────────────────────────────────────────
  async decryptMessage(ciphertext, ivBase64, sharedKey) {
    const encryptedBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      encryptedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  },

  // ─────────────────────────────────────────
  // KEY STORAGE — IndexedDB (safer than localStorage)
  // Private key never leaves the device
  // ─────────────────────────────────────────
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

  // ─────────────────────────────────────────
  // HELPER: Full send flow
  // Call this in useChatStore.js when sending a message
  // ─────────────────────────────────────────
  async prepareMessage(plaintext, myPrivateKeyBase64, theirPublicKeyBase64) {
    const sharedKey = await encryption.deriveSharedSecret(myPrivateKeyBase64, theirPublicKeyBase64);
    const { ciphertext, iv } = await encryption.encryptMessage(plaintext, sharedKey);
    return { ciphertext, iv };
  },

  // HELPER: Full receive flow
  // Call this in ChatContainer.jsx when displaying messages
  async readMessage(ciphertext, iv, myPrivateKeyBase64, theirPublicKeyBase64) {
    const sharedKey = await encryption.deriveSharedSecret(myPrivateKeyBase64, theirPublicKeyBase64);
    return await encryption.decryptMessage(ciphertext, iv, sharedKey);
  },
};

export default encryption;


// ─────────────────────────────────────────
// HOW TO USE IN YOUR APP
// ─────────────────────────────────────────

// 1. On login — in useAuthStore.js:
//
//    import encryption from "../lib/encryption";
//    const { publicKeyBase64 } = await encryption.generateKeyPair();
//    await axiosInstance.post("/auth/save-public-key", { publicKey: publicKeyBase64 });

// 2. Sending a message — in useChatStore.js:
//
//    import encryption from "../lib/encryption";
//    const myPrivateKey = await encryption.loadPrivateKey();
//    const theirPublicKey = selectedUser.publicKey; // must be stored on user object from server
//    const { ciphertext, iv } = await encryption.prepareMessage(text, myPrivateKey, theirPublicKey);
//    socket.emit("sendMessage", { ciphertext, iv, receiverId: selectedUser._id });

// 3. Displaying a message — in ChatContainer.jsx:
//
//    import encryption from "../lib/encryption";
//    const myPrivateKey = await encryption.loadPrivateKey();
//    const theirPublicKey = message.senderPublicKey; // server must attach this to each message
//    const plaintext = await encryption.readMessage(message.ciphertext, message.iv, myPrivateKey, theirPublicKey);