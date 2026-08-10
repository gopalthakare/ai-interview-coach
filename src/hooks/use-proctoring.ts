import { useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { ObjectDetection, DetectedObject } from "@tensorflow-models/coco-ssd";

export type ProctoringViolationType =
  "no_face" | "multiple_faces" | "looking_away" | "phone_detected" | "tab_switched";

export interface ProctoringViolation {
  type: ProctoringViolationType;
  message: string;
  timestamp: number;
}

export interface ProctoringStatus {
  /** Models finished loading and checks have started. */
  ready: boolean;
  /** Models are currently downloading/initializing. */
  loading: boolean;
  /** false if model setup failed (e.g. no WebGL, blocked CDN, unsupported browser) — proctoring is silently skipped rather than breaking the interview. */
  supported: boolean;
  faceDetected: boolean;
  lookingAway: boolean;
  phoneDetected: boolean;
  tabSwitchCount: number;
  violations: ProctoringViolation[];
}

const CHECK_INTERVAL_MS = 1500;
// How far off-center (degrees) the head can turn before it's flagged as
// "looking away". Estimated from the face landmark transformation matrix —
// this is a coarse heuristic, not precise gaze tracking, so it's tuned loose
// on purpose to avoid flagging normal head movement while talking.
const YAW_THRESHOLD_DEG = 28;
// Require this many consecutive bad checks before flagging, so a single
// blink or a quick glance at the keyboard doesn't register as a violation.
const CONSECUTIVE_HITS_TO_FLAG = 2;
// Don't log the same violation type again within this window, so one
// sustained issue (e.g. stepping away) produces one log entry, not dozens.
const VIOLATION_DEBOUNCE_MS = 8000;

const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_BASE_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

/**
 * Runs lightweight face-presence, head-pose, and phone-detection checks
 * against an existing <video> element, entirely on-device.
 *
 * @param videoEl the camera preview element already receiving a MediaStream
 * @param enabled set false to pause all checks (e.g. interview not started yet)
 */
export function useProctoring(
  videoEl: HTMLVideoElement | null,
  enabled: boolean,
): ProctoringStatus {
  const [status, setStatus] = useState<ProctoringStatus>({
    ready: false,
    loading: false,
    supported: true,
    faceDetected: false,
    lookingAway: false,
    phoneDetected: false,
    tabSwitchCount: 0,
    violations: [],
  });

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const objectDetectorRef = useRef<ObjectDetection | null>(null);
  const hitCountRef = useRef({ noFace: 0, lookingAway: 0 });
  const lastLoggedRef = useRef<Partial<Record<ProctoringViolationType, number>>>({});

  const logViolation = useRef(
    (type: ProctoringViolationType, message: string, debounceMs: number) => {
      const now = Date.now();
      const last = lastLoggedRef.current[type] ?? 0;
      if (now - last < debounceMs) return;
      lastLoggedRef.current[type] = now;
      setStatus((s) => ({
        ...s,
        tabSwitchCount: type === "tab_switched" ? s.tabSwitchCount + 1 : s.tabSwitchCount,
        violations: [...s.violations, { type, message, timestamp: now }].slice(-50),
      }));
    },
  ).current;

  // Flag switching away from the interview tab/window — independent of the
  // camera checks, so it works even while the ML models are still loading.
  useEffect(() => {
    if (!enabled) return;

    function onVisibilityChange() {
      if (document.hidden) {
        logViolation("tab_switched", "Switched away from the interview tab", 1000);
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [enabled, logViolation]);

  // Load models once camera + interview are active.
  useEffect(() => {
    if (!enabled || !videoEl) return;
    let cancelled = false;
    setStatus((s) => ({ ...s, loading: true }));

    (async () => {
      try {
        const [visionTasks, tf, coco] = await Promise.all([
          import("@mediapipe/tasks-vision"),
          import("@tensorflow/tfjs"),
          import("@tensorflow-models/coco-ssd"),
        ]);
        await import("@tensorflow/tfjs-backend-webgl");
        await tf.ready();

        const { FilesetResolver, FaceLandmarker } = visionTasks;
        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: MODEL_ASSET_PATH, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 2,
          outputFacialTransformationMatrixes: true,
          outputFaceBlendshapes: false,
        });
        const objectDetector = await coco.load({ base: "lite_mobilenet_v2" });

        if (cancelled) {
          faceLandmarker.close();
          return;
        }
        faceLandmarkerRef.current = faceLandmarker;
        objectDetectorRef.current = objectDetector;
        setStatus((s) => ({ ...s, ready: true, loading: false }));
      } catch (err) {
        console.error("Proctoring: model setup failed, disabling checks", err);
        if (!cancelled) setStatus((s) => ({ ...s, supported: false, loading: false }));
      }
    })();

    return () => {
      cancelled = true;
      faceLandmarkerRef.current?.close?.();
      faceLandmarkerRef.current = null;
      objectDetectorRef.current = null;
    };
  }, [enabled, videoEl]);

  // Run periodic checks once models are ready.
  useEffect(() => {
    if (!enabled || !videoEl || !status.ready) return;

    function logCheck(type: ProctoringViolationType, message: string) {
      logViolation(type, message, VIOLATION_DEBOUNCE_MS);
    }

    function checkFace() {
      const landmarker = faceLandmarkerRef.current;
      if (!landmarker || !videoEl || videoEl.readyState < 2) return;

      try {
        const result = landmarker.detectForVideo(videoEl, performance.now());
        const matrices = result.facialTransformationMatrixes ?? [];

        if (matrices.length === 0) {
          hitCountRef.current.noFace += 1;
          setStatus((s) => ({ ...s, faceDetected: false, lookingAway: false }));
          if (hitCountRef.current.noFace >= CONSECUTIVE_HITS_TO_FLAG) {
            logCheck("no_face", "No face detected in frame");
          }
          return;
        }

        hitCountRef.current.noFace = 0;
        setStatus((s) => ({ ...s, faceDetected: true }));

        if (matrices.length > 1) {
          logCheck("multiple_faces", "More than one face detected");
        }

        // Coarse yaw estimate from the rotation part of the 4x4 transform.
        const m = matrices[0].data;
        const yawRad = Math.atan2(-m[8], Math.sqrt(m[0] * m[0] + m[4] * m[4]));
        const yawDeg = Math.abs(yawRad * (180 / Math.PI));

        if (yawDeg > YAW_THRESHOLD_DEG) {
          hitCountRef.current.lookingAway += 1;
          if (hitCountRef.current.lookingAway >= CONSECUTIVE_HITS_TO_FLAG) {
            setStatus((s) => ({ ...s, lookingAway: true }));
            logCheck("looking_away", "Looked away from the screen");
          }
        } else {
          hitCountRef.current.lookingAway = 0;
          setStatus((s) => ({ ...s, lookingAway: false }));
        }
      } catch {
        // A single bad frame isn't worth surfacing — just skip to the next tick.
      }
    }

    async function checkPhone() {
      const detector = objectDetectorRef.current;
      if (!detector || !videoEl || videoEl.readyState < 2) return;
      try {
        const predictions = await detector.detect(videoEl);
        const phone = predictions.find(
          (p: DetectedObject) => p.class === "cell phone" && p.score > 0.6,
        );
        setStatus((s) => ({ ...s, phoneDetected: !!phone }));
        if (phone) logCheck("phone_detected", "Phone detected in frame");
      } catch {
        // ignore transient detection errors
      }
    }

    const interval = window.setInterval(() => {
      checkFace();
      checkPhone();
    }, CHECK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [enabled, videoEl, status.ready, logViolation]);

  return status;
}
