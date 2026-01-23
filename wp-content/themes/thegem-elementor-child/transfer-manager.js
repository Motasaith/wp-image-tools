/**
 * Transfer Manager
 * Handles client-side image storage for transferring files between tools using IndexedDB.
 * This ensures images are not uploaded to the server during transfer.
 */

const DB_NAME = 'UpscaleToolsDB';
const STORE_NAME = 'transfer_store';
const DB_VERSION = 1;

class TransferManager {
    constructor() {
        this.db = null;
        this.initPromise = this.initDB();
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("TransferManager DB Error:", event.target.error);
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
        });
    }

    async saveImage(blob, filename) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const item = {
                id: 'active_transfer',
                blob: blob,
                filename: filename,
                timestamp: Date.now()
            };

            const request = store.put(item);

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async getImage() {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('active_transfer');

            request.onsuccess = (event) => {
                const result = event.target.result;
                // Optional: Check timestamp to expire old images (e.g., > 1 hour)
                if (result) {
                    resolve(result);
                } else {
                    resolve(null);
                }
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async clearImage() {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete('active_transfer');
            
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }
}

// Global Instance
window.transferManager = new TransferManager();
