// วางที่ Assets/Scripts/GameBridge.cs แล้วผูกกับ GameObject ที่ตั้งชื่อว่า "GameBridge" ใน Scene แรก
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;

public class GameBridge : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")] private static extern void SubmitResultToWeb(string json);
    [DllImport("__Internal")] private static extern void NotifyReadyToWeb();
#else
    private static void SubmitResultToWeb(string json) { Debug.Log("[Editor] SubmitResult: " + json); }
    private static void NotifyReadyToWeb() { Debug.Log("[Editor] Ready"); }
#endif

    [Serializable] public class Decision { public string choiceKey; public bool isCorrect; }
    [Serializable] public class ResultPayload
    {
        public int levelId;
        public int score;
        public int timeSpentSec;
        public List<Decision> decisions = new List<Decision>();
    }
    [Serializable] public class SavedSummary
    {
        public int levelId; public int score; public int stars; public bool passed; public bool newBest;
    }

    public static event Action<int> LevelRequested;       // เว็บสั่งให้โหลดด่าน (ให้ระบบเกมมา subscribe)
    public static event Action<SavedSummary> ResultSaved; // เซิร์ฟเวอร์บันทึกแล้ว (ใช้โชว์ดาว/คะแนน)

    void Start() { NotifyReadyToWeb(); }

    // ถูกเรียกจากเว็บ: unity.SendMessage('GameBridge', 'LoadLevel', id)
    public void LoadLevel(int levelId) { LevelRequested?.Invoke(levelId); }

    // ถูกเรียกจากเว็บหลังบันทึกคะแนนสำเร็จ: unity.SendMessage('GameBridge', 'OnResultSaved', json)
    public void OnResultSaved(string json)
    {
        ResultSaved?.Invoke(JsonUtility.FromJson<SavedSummary>(json));
    }

    /// เรียกตอนจบด่าน  เช่น GameBridge.Submit(2, 85, 140, decisions)
    public static void Submit(int levelId, int score, int seconds, List<Decision> decisions)
    {
        var p = new ResultPayload { levelId = levelId, score = score, timeSpentSec = seconds, decisions = decisions };
        SubmitResultToWeb(JsonUtility.ToJson(p));
    }
}
