/**
 * Terrnix Encrypted Storage
 * 
 * Provides transparent AES-GCM encryption for localStorage values.
 * Uses domain-derived key (non-exportable) for encryption.
 * 
 * Features:
 * - Transparent get/set API matching localStorage
 * - Automatic migration from plain localStorage
 * - Graceful fallback if crypto unavailable
 * - Tamper detection via authentication tag
 * 
 * @author Terrnix Security Team
 * @version 1.0.0
 */

class EncryptedStorage {
  constructor(options = {}) {
    this.prefix = options.prefix || 'terrnix_enc_';
    this.plainPrefix = options.plainPrefix || 'terrnix_';
    this.isAvailable = this.checkAvailability();
    this.key = null;
    
    // Initialize crypto key
    if (this.isAvailable) {
      this.initKey();
    }
  }

  /**
   * Check if Web Crypto API is available
   */
  checkAvailability() {
    return (
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.subtle.encrypt === 'function'
    );
  }

  /**
   * Derive encryption key from domain and user agent
   * This creates a device-specific key that cannot be exported
   */
  async initKey() {
    try {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(this.deriveKeyMaterial()),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      this.key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('terrnix-salt-v1'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (e) {
      console.warn('[EncryptedStorage] Key derivation failed:', e);
      this.isAvailable = false;
    }
  }

  /**
   * Derive key material from browser fingerprint
   */
  deriveKeyMaterial() {
    // Combine domain, user agent, and language for device-specific key
    const components = [
      window.location.hostname,
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height
    ];
    return components.join('|');
  }

  /**
   * Wait for key initialization
   */
  async ready() {
    if (!this.isAvailable) return false;
    if (this.key) return true;
    
    // Wait for key initialization
    for (let i = 0; i < 50; i++) {
      if (this.key) return true;
      await new Promise(r => setTimeout(r, 10));
    }
    return false;
  }

  /**
   * Encrypt data
   */
  async encrypt(plaintext) {
    if (!await this.ready()) return null;
    
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(plaintext);
      
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.key,
        encoded
      );
      
      // Combine IV + ciphertext
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(ciphertext), iv.length);
      
      // Base64 encode
      return btoa(String.fromCharCode(...combined));
    } catch (e) {
      console.warn('[EncryptedStorage] Encryption failed:', e);
      return null;
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(ciphertext) {
    if (!await this.ready()) return null;
    
    try {
      // Base64 decode
      const combined = new Uint8Array(
        atob(ciphertext).split('').map(c => c.charCodeAt(0))
      );
      
      // Extract IV and ciphertext
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.key,
        data
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.warn('[EncryptedStorage] Decryption failed:', e);
      return null;
    }
  }

  /**
   * Get item from storage (auto-migrates plain data)
   */
  async getItem(key) {
    const encryptedKey = this.prefix + key;
    const plainKey = this.plainPrefix + key;
    
    // Try encrypted first
    const encrypted = localStorage.getItem(encryptedKey);
    if (encrypted) {
      const decrypted = await this.decrypt(encrypted);
      if (decrypted !== null) return decrypted;
    }
    
    // Fall back to plain and migrate
    const plain = localStorage.getItem(plainKey);
    if (plain && this.isAvailable) {
      // Migrate to encrypted
      await this.setItem(key, plain);
      localStorage.removeItem(plainKey);
      return plain;
    }
    
    return plain || null;
  }

  /**
   * Set item in storage (encrypts if available)
   */
  async setItem(key, value) {
    const encryptedKey = this.prefix + key;
    const plainKey = this.plainPrefix + key;
    
    if (this.isAvailable && typeof value === 'string') {
      const encrypted = await this.encrypt(value);
      if (encrypted) {
        localStorage.setItem(encryptedKey, encrypted);
        localStorage.removeItem(plainKey);
        return;
      }
    }
    
    // Fallback to plain storage
    localStorage.setItem(plainKey, value);
  }

  /**
   * Remove item from storage
   */
  removeItem(key) {
    localStorage.removeItem(this.prefix + key);
    localStorage.removeItem(this.plainPrefix + key);
  }

  /**
   * Clear all terrnix storage
   */
  clear() {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(this.prefix) || key.startsWith(this.plainPrefix)) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Get all keys
   */
  keys() {
    const keys = [];
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length));
      } else if (key.startsWith(this.plainPrefix)) {
        keys.push(key.slice(this.plainPrefix.length));
      }
    }
    return [...new Set(keys)];
  }
}

// Create global instance
const encryptedStorage = new EncryptedStorage();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EncryptedStorage, encryptedStorage };
}

if (typeof window !== 'undefined') {
  window.EncryptedStorage = EncryptedStorage;
  window.encryptedStorage = encryptedStorage;
}
