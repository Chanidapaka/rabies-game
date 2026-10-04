export type UnityInstance = {
  SendMessage: (objectName: string, methodName: string, value?: string | number) => void;
  SetFullscreen: (fullscreen: 0 | 1) => void;
  Quit: () => Promise<void>;
};

export type ResultPayload = {
  levelId: number;
  score: number;
  timeSpentSec: number;
  decisions: { choiceKey: string; isCorrect: boolean }[];
};

declare global {
  interface Window {
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: Record<string, unknown>,
      onProgress?: (p: number) => void,
    ) => Promise<UnityInstance>;
    /** Unity (ผ่าน .jslib) เรียกใช้ตัวนี้เพื่อส่งผลกลับมาที่หน้าเว็บ */
    RabiesBridge?: {
      submitResult: (json: string) => void;
      ready: () => void;
    };
  }
}
