'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { LevelView } from '@/lib/levels';
import type { ResultPayload, UnityInstance } from '@/types/unity';
import Stars from './Stars';

type Msg = { kind: 'ok' | 'error'; text: string } | null;

export default function GameShell({
  initialLevels,
  userName,
  unityBuild,
}: {
  initialLevels: LevelView[];
  userName: string;
  unityBuild?: string;
}) {
  const [levels, setLevels] = useState(initialLevels);
  const [current, setCurrent] = useState<number>(() => (initialLevels.find((l) => l.unlocked && !l.completed) ?? initialLevels[0]).id);
  const [msg, setMsg] = useState<Msg>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const unityRef = useRef<UnityInstance | null>(null);

  /** ส่งผลไปบันทึกที่เซิร์ฟเวอร์ แล้วแจ้งผลกลับไปที่ Unity */
  const submit = useCallback(async (payload: ResultPayload) => {
    setMsg(null);
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ kind: 'error', text: data.error ?? 'บันทึกผลไม่สำเร็จ' });
      return;
    }
    setLevels(data.levels);
    const s = data.summary;
    setMsg({
      kind: 'ok',
      text: s.passed
        ? `ผ่านด่านแล้ว ได้ ${s.stars} ดาว${s.newBest ? ' (คะแนนดีที่สุดใหม่)' : ''}`
        : 'ยังไม่ผ่านด่านนี้ ลองเล่นอีกครั้งได้เลย',
    });
    unityRef.current?.SendMessage('GameBridge', 'OnResultSaved', JSON.stringify(s));
  }, []);

  // ให้ bridge เรียก handler ล่าสุดเสมอ โดยไม่ต้องสร้าง bridge ใหม่ทุกครั้งที่ render
  const submitRef = useRef(submit);
  submitRef.current = submit;

  const startLevel = useCallback((id: number) => {
    setCurrent(id);
    setMsg(null);
    unityRef.current?.SendMessage('GameBridge', 'LoadLevel', id);
  }, []);

  useEffect(() => {
    if (!unityBuild) return;

    window.RabiesBridge = {
      submitResult: (json: string) => {
        try {
          submitRef.current(JSON.parse(json) as ResultPayload);
        } catch {
          setMsg({ kind: 'error', text: 'ข้อมูลผลคะแนนจากเกมไม่ถูกต้อง' });
        }
      },
      ready: () => setLoaded(true),
    };

    const script = document.createElement('script');
    script.src = `/unity/Build/${unityBuild}.loader.js`;
    script.async = true;
    script.onload = () => {
      window
        .createUnityInstance?.(
          canvasRef.current!,
          {
            dataUrl: `/unity/Build/${unityBuild}.data`,
            frameworkUrl: `/unity/Build/${unityBuild}.framework.js`,
            codeUrl: `/unity/Build/${unityBuild}.wasm`,
            streamingAssetsUrl: 'StreamingAssets',
            companyName: 'RabiesGame',
            productName: 'RabiesGame',
            productVersion: '0.1',
          },
          (p) => setProgress(p),
        )
        .then((inst) => {
          unityRef.current = inst;
          setLoaded(true);
        })
        .catch((e) => setMsg({ kind: 'error', text: `โหลดเกมไม่สำเร็จ: ${String(e)}` }));
    };
    script.onerror = () => setMsg({ kind: 'error', text: `ไม่พบไฟล์เกมที่ /unity/Build/${unityBuild}.loader.js` });
    document.body.appendChild(script);

    return () => {
      unityRef.current?.Quit().catch(() => undefined);
      unityRef.current = null;
      delete window.RabiesBridge;
      script.remove();
    };
  }, [unityBuild]);

  const cur = levels.find((l) => l.id === current)!;

  return (
    <div className="container game-layout">
      <aside className="side" aria-label="เลือกด่าน">
        <h2 style={{ fontSize: '1.15rem' }}>สวัสดี {userName}</h2>
        <ol>
          {levels.map((l) => (
            <li key={l.id}>
              <button
                className="lv-btn"
                disabled={!l.unlocked}
                aria-current={l.id === current}
                onClick={() => startLevel(l.id)}
              >
                <strong>ด่าน {l.id}</strong> {l.title}
                <br />
                {l.unlocked ? <Stars value={l.stars} /> : <span className="muted">ผ่านด่านก่อนหน้าเพื่อปลดล็อก</span>}
              </button>
            </li>
          ))}
        </ol>
        <p style={{ marginTop: '1rem', fontSize: '.9rem' }}>
          <Link href="/leaderboard">ดูอันดับของคุณ</Link>
        </p>
      </aside>

      <section>
        {msg && (
          <div className={`alert ${msg.kind === 'ok' ? 'alert-ok' : 'alert-error'}`} role="status">
            {msg.text}
          </div>
        )}

        {unityBuild ? (
          <div className="stage">
            <canvas ref={canvasRef} id="unity-canvas" tabIndex={-1} />
            {!loaded && (
              <div className="stage-overlay">
                <div>
                  <div>กำลังโหลดเกม… {Math.round(progress * 100)}%</div>
                  <div className="bar"><i style={{ width: `${progress * 100}%` }} /></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="stage">
              <div className="stage-overlay">
                <div>
                  <h2 style={{ color: '#fff' }}>ยังไม่ได้เชื่อมเกม Unity</h2>
                  <p style={{ marginInline: 'auto' }}>
                    วางไฟล์ build ไว้ที่ public/unity/Build แล้วตั้งค่า UNITY_BUILD_NAME ในไฟล์ .env
                    ระหว่างนี้ใช้ตัวจำลองด้านล่างเพื่อทดสอบการบันทึกคะแนนได้
                  </p>
                </div>
              </div>
            </div>
            <Simulator level={cur} onSubmit={submit} />
          </>
        )}

        <h2 style={{ marginTop: '1.5rem' }}>ด่าน {cur.id}: {cur.title}</h2>
        <p className="muted">{cur.description}</p>
      </section>
    </div>
  );
}

/** ตัวจำลองผลจาก Unity สำหรับทดสอบ API ระหว่างพัฒนา */
function Simulator({ level, onSubmit }: { level: LevelView; onSubmit: (p: ResultPayload) => void }) {
  const [score, setScore] = useState(80);
  const [time, setTime] = useState(60);
  return (
    <div className="sim">
      <h3>ตัวจำลองผล (ใช้ทดสอบเท่านั้น)</h3>
      <div className="row">
        <div className="field">
          <label htmlFor="sim-score">คะแนน (0–{level.maxScore})</label>
          <input id="sim-score" type="number" min={0} max={level.maxScore} value={score} onChange={(e) => setScore(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="sim-time">เวลา (วินาที)</label>
          <input id="sim-time" type="number" min={1} value={time} onChange={(e) => setTime(Number(e.target.value))} />
        </div>
        <button
          className="btn btn-primary"
          onClick={() =>
            onSubmit({
              levelId: level.id,
              score,
              timeSpentSec: time,
              decisions: [
                { choiceKey: `L${level.id}_wash_soap`, isCorrect: score >= 50 },
                { choiceKey: `L${level.id}_go_hospital`, isCorrect: score >= 70 },
              ],
            })
          }
        >
          ส่งผลด่าน {level.id}
        </button>
      </div>
    </div>
  );
}
