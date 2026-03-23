/**
 * Google Vertex AI Studio - Imagen 3 API 유틸
 *
 * 설정 방법:
 * 1. console.cloud.google.com → Vertex AI → "API 키 가져오기" 클릭
 *    또는 aistudio.google.com → "Get API key"
 * 2. .env.local 에 아래 값 설정:
 *    NEXT_PUBLIC_VERTEX_AI_API_KEY=발급받은-키
 *
 * ✅ 프로젝트 ID 불필요 - API 키만으로 동작
 * ✅ 키 형식: AQ.Ab8... 또는 AIzaSy... 모두 지원
 */

export interface Imagen3Options {
    prompt: string;
    /** 참조 이미지 (base64 data URL) - 공간 이미지 배경 합성용 */
    referenceImageBase64?: string;
    /** 가로세로 비율. 기본 '16:9' */
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    /** 생성 이미지 수. 기본 1 */
    sampleCount?: number;
}

export interface Imagen3Result {
    /** base64 data URL (data:image/png;base64,...) */
    imageDataUrl: string;
}

// Vite 환경변수 (VITE_ 접두사만 브라우저에 노출됨)
const API_KEY = (import.meta as any).env?.VITE_VERTEX_AI_API_KEY || '';


// API 키가 설정되어 있는지 확인
export const isImagen3Configured = (): boolean => {
    return !!(API_KEY &&
        API_KEY !== 'your-api-key-here' &&
        API_KEY.length > 10);
};

/**
 * Imagen 3 이미지 생성
 * Vertex AI Studio API 키 방식 (generativelanguage.googleapis.com)
 */
export const generateWithImagen3 = async (options: Imagen3Options): Promise<Imagen3Result> => {
    if (!isImagen3Configured()) {
        throw new Error('Vertex AI API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
    }

    const { prompt, referenceImageBase64, aspectRatio = '16:9', sampleCount = 1 } = options;

    // Vertex AI Studio API 키로 접근 가능한 Imagen 3 엔드포인트
    const modelId = 'imagen-3.0-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${API_KEY}`;

    // 요청 바디 구성
    const instance: Record<string, any> = { prompt };

    // 참조 이미지 (img2img) - base64
    if (referenceImageBase64) {
        const base64Data = referenceImageBase64.startsWith('data:')
            ? referenceImageBase64.split(',')[1]
            : referenceImageBase64;
        const mimeType = referenceImageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
        instance.image = {
            bytesBase64Encoded: base64Data,
            mimeType,
        };
    }

    const parameters: Record<string, any> = {
        sampleCount,
        aspectRatio,
        safetyFilterLevel: 'BLOCK_SOME',
        personGeneration: 'DONT_ALLOW',
        addWatermark: false,
    };

    // 15초 타임아웃 설정 (응답 없으면 자동 에러 → Pollinations fallback)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instances: [instance], parameters }),
            signal: controller.signal,
        });
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('Imagen 3 API 타임아웃 (15초). Pollinations fallback을 사용합니다.');
        }
        throw new Error(`Imagen 3 네트워크 오류: ${err.message}`);
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
        const errText = await response.text();
        let errMsg = `Imagen 3 API 오류 (${response.status})`;
        try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.error?.message || errMsg;
        } catch { }
        throw new Error(errMsg);
    }

    const data = await response.json();
    const prediction = data.predictions?.[0];
    if (!prediction?.bytesBase64Encoded) {
        throw new Error('Imagen 3 응답에서 이미지 데이터를 찾을 수 없습니다.');
    }

    return {
        imageDataUrl: `data:image/png;base64,${prediction.bytesBase64Encoded}`,
    };
};

/**
 * 여러 이미지 병렬 생성
 */
export const generateBatchWithImagen3 = async (
    prompts: string[],
    commonOptions?: Omit<Imagen3Options, 'prompt'>
): Promise<Imagen3Result[]> => {
    const results = await Promise.allSettled(
        prompts.map(prompt => generateWithImagen3({ ...commonOptions, prompt }))
    );
    return results.map(r =>
        r.status === 'fulfilled' ? r.value : { imageDataUrl: '' }
    );
};
