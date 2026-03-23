/**
 * fileHandleStorage.ts
 * File System Access API + IndexedDB를 이용한 로컬 파일 핸들 저장/복원
 *
 * 동작 방식:
 * 1. 사용자가 파일 선택 → FileSystemFileHandle 획득
 * 2. 핸들을 IndexedDB에 저장 (키: 아이템 ID)
 * 3. 재방문 시 IndexedDB에서 핸들 복원
 * 4. 핸들이 살아있으면 파일 재읽기 → ObjectURL 생성
 * 5. 권한이 만료된 경우 사용자에게 재확인 요청
 */

const DB_NAME = 'winterior_file_handles';
const STORE_NAME = 'handles';
const THUMBNAIL_STORE = 'thumbnails'; // 썸네일 base64 저장소
const DB_VERSION = 2; // 버전 업 (thumbnails store 추가)

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (event) => {
            const db = req.result;
            // handles 스토어 (기존)
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
            // thumbnails 스토어 (신규: 버전 2에서 추가)
            if (!db.objectStoreNames.contains(THUMBNAIL_STORE)) {
                db.createObjectStore(THUMBNAIL_STORE);
            }
            void event;
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
};

/** FileSystemFileHandle을 IndexedDB에 저장 */
export const saveFileHandle = async (id: string | number, handle: FileSystemFileHandle): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(handle, String(id));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

/** IndexedDB에서 FileSystemFileHandle 복원 */
export const loadFileHandle = async (id: string | number): Promise<FileSystemFileHandle | null> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(String(id));
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
};

/** IndexedDB에서 핸들 삭제 */
export const removeFileHandle = async (id: string | number): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(String(id));
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    } catch { }
};

/** 핸들에서 파일을 읽어 ObjectURL 반환. 권한 없으면 재요청 */
export const readFileAsUrl = async (handle: FileSystemFileHandle): Promise<string | null> => {
    try {
        const h = handle as any; // queryPermission/requestPermission은 최신 API
        if (h.queryPermission) {
            let perm = await h.queryPermission({ mode: 'read' });
            if (perm !== 'granted') {
                perm = await h.requestPermission({ mode: 'read' });
            }
            if (perm !== 'granted') return null;
        }
        const file = await handle.getFile();
        return URL.createObjectURL(file);
    } catch {
        return null;
    }
};

/** File System Access API 지원 여부 */
export const isFileSystemAccessSupported = (): boolean =>
    typeof window !== 'undefined' && 'showOpenFilePicker' in window;

/** 파일 선택 대화상자 열기 (이미지 전용) */
export const pickImageFile = async (): Promise<{ handle: FileSystemFileHandle; file: File } | null> => {
    try {
        const [handle] = await (window as any).showOpenFilePicker({
            types: [{
                description: '이미지 파일',
                accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
            }],
            multiple: false,
        });
        const file = await handle.getFile();
        return { handle, file };
    } catch {
        // 사용자가 취소한 경우
        return null;
    }
};

// ─── 썸네일 IndexedDB 저장/로드 (localStorage 용량 한계 회피) ───────────────

/** 썸네일 base64를 IndexedDB에 저장 */
export const saveThumbnail = async (id: string | number, base64: string): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(THUMBNAIL_STORE, 'readwrite');
            tx.objectStore(THUMBNAIL_STORE).put(base64, String(id));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch { /* 썸네일 저장 실패 시 무시 */ }
};

/** IndexedDB에서 썸네일 base64 로드 */
export const loadThumbnail = async (id: string | number): Promise<string | null> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(THUMBNAIL_STORE, 'readonly');
            const req = tx.objectStore(THUMBNAIL_STORE).get(String(id));
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
};

/** IndexedDB에서 모든 썸네일 로드 → { id: base64 } 형태로 반환 */
export const loadAllThumbnails = async (): Promise<Record<string, string>> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const result: Record<string, string> = {};
            const tx = db.transaction(THUMBNAIL_STORE, 'readonly');
            const req = tx.objectStore(THUMBNAIL_STORE).openCursor();
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    result[String(cursor.key)] = cursor.value as string;
                    cursor.continue();
                } else {
                    resolve(result);
                }
            };
            req.onerror = () => resolve(result);
        });
    } catch {
        return {};
    }
};

/** IndexedDB에서 썸네일 삭제 */
export const removeThumbnail = async (id: string | number): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(THUMBNAIL_STORE, 'readwrite');
            tx.objectStore(THUMBNAIL_STORE).delete(String(id));
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    } catch { }
};
