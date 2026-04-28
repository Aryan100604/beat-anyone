// Face detection using face-api.js
// Models loaded from CDN

let modelsLoaded = false;
let faceapi: any = null;

async function loadFaceApi(): Promise<any> {
  if (faceapi) return faceapi;
  // Dynamically import face-api.js
  faceapi = await import('face-api.js');
  return faceapi;
}

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  const fa = await loadFaceApi();

  // Load models from jsDelivr CDN
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

  await Promise.all([
    fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    fa.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function detectFace(
  img: HTMLImageElement,
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const fa = await loadFaceApi();

  const detection = await fa.detectSingleFace(
    img,
    new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }),
  ).withFaceLandmarks(true);

  if (!detection) return null;

  const box = detection.detection.box;
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

export async function cropFaceToBitmap(
  img: HTMLImageElement,
  box: { x: number; y: number; width: number; height: number },
): Promise<ImageBitmap> {
  // Add padding around the face for a natural look
  const padding = box.width * 0.35;
  const sx = Math.max(0, box.x - padding);
  const sy = Math.max(0, box.y - padding * 1.2);
  const sw = Math.min(img.naturalWidth - sx, box.width + padding * 2);
  const sh = Math.min(img.naturalHeight - sy, box.height + padding * 2.5);

  return createImageBitmap(img, sx, sy, sw, sh);
}
