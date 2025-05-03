import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { Holistic } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";
import { marchingCubes, metaBalls, gridHelper } from "./MarchingCubes";

// ==== Constants ====
const NOSE_TIP_INDEX = 1;
const HAND_INDEX = 20;

// ==== DOM Setup ====
const container = document.getElementById("container");
const videoElement = document.createElement("video");
document.body.appendChild(videoElement);
videoElement.style.position = "absolute"; // Position the video on top of the body
videoElement.style.top = "0";
videoElement.style.left = "0";
videoElement.style.width = "100%"; // Ensure the video takes up the full screen width
videoElement.style.height = "100%"; // Ensure the video takes up the full screen height
videoElement.style.zIndex = "-1"; // Make sure video stays behind the 3D content

// Create a canvas element for MediaPipe drawing (optional, you can remove this if not needed)
const canvasElement = document.createElement("canvas");
canvasElement.style.display = "none";
const canvasCtx = canvasElement.getContext("2d");
document.body.appendChild(canvasElement);

// ==== Three.js Setup ====
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.01,
  1000
);
camera.position.set(0, 0, 20);
scene.add(camera);

scene.add(gridHelper);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true, // Enable transparent background
});
renderer.setPixelRatio(sizes.pixelRatio);
renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 3;
container.appendChild(renderer.domElement);

// ==== Environment Map ====
new RGBELoader().load("./urban_alley_01_1k.hdr", (envMap) => {
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = envMap;
  scene.background = envMap;
});

// ==== Lights ====
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(0.5, 1, 1);
scene.add(dirLight);

// ==== Flubber Material ====
const blobMaterial = new THREE.MeshPhysicalMaterial({
  color: "#00ff00",
  metalness: 0.1,
  roughness: 0.25,
  transmission: 1.0,
  ior: 1.5,
  thickness: 2,
  transparent: true,
  opacity: 0.75,
  side: THREE.DoubleSide,
});

// ==== MediaPipe Holistic Setup ====
const holistic = new Holistic({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
});
holistic.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  refineFaceLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

holistic.onResults((results) => {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  metaBalls.length = 0;

  console.log(results);

  // === Add Nose Tip Landmark Only ===
  const nose = results.faceLandmarks?.[NOSE_TIP_INDEX];
  if (nose) {
    // Map MediaPipe normalized coordinates to Three.js world space
    const point = new THREE.Vector3(
      (nose.x - 0.5) * 10, // Convert x from [0, 1] to [-5, 5] (scale by 10)
      -(nose.y - 0.5) * 10, // Convert y from [0, 1] to [-5, 5] (scale by 10)
      (nose.z || 0) * 10 // Use z directly, scaled by 10
    );
    metaBalls.push({ center: point, radius: 1.1 });
  }

  const leftHand = results.leftHandLandmarks?.[HAND_INDEX];
  if (leftHand) {
    const point = new THREE.Vector3(
      (leftHand.x - 0.5) * 10,
      -(leftHand.y - 0.5) * 5,
      (leftHand.z || 0) * 10
    );
    metaBalls.push({ center: point, radius: 0.1 });
  }

  // const rightHand = results.leftHandLandmarks?.[19];
  // if (rightHand) {
  //   const point = new THREE.Vector3(
  //     (rightHand.x - 0.5) * 25,
  //     -(rightHand.y - 0.5) * 5,
  //     (rightHand.z || 0) * 10
  //   );
  //   metaBalls.push({ center: point, radius: 0.1 });
  // }

  const leftElbow = results.poseLandmarks?.[13];
  if (leftElbow) {
    const point = new THREE.Vector3(
      (leftElbow.x - 0.5) * 20,
      -(leftElbow.y - 0.5) * 10,
      (leftElbow.z || 0) * 10
    );
    metaBalls.push({ center: point, radius: 0.1 });
  }

  const rightElbow = results.poseLandmarks?.[14];
  if (rightElbow) {
    const point = new THREE.Vector3(
      (rightElbow.x - 0.5) * 25,
      -(rightElbow.y - 0.5) * 10,
      (rightElbow.z || 0) * 10
    );
    metaBalls.push({ center: point, radius: 0.1 });
  }

  // const leftKnee = results.poseLandmarks?.[25];
  // if (leftKnee) {
  //   const point = new THREE.Vector3(
  //     (leftKnee.x - 0.5) * 10,
  //     -(leftKnee.y - 0.5) * 10,
  //     (leftKnee.z || 0) * 10
  //   );
  //   metaBalls.push({ center: point, radius: 0.01 });
  // }

  // const rightKnee = results.poseLandmarks?.[26];
  // if (rightKnee) {
  //   const point = new THREE.Vector3(
  //     (rightKnee.x - 0.5) * 10,
  //     -(rightKnee.y - 0.5) * 10,
  //     (rightKnee.z || 0) * 10
  //   );
  //   metaBalls.push({ center: point, radius: 0.01 });
  // }

  // === Torso Center Landmark ===
  if (results.poseLandmarks) {
    const torsoCenter = getTorsoCenter(results.poseLandmarks);
    if (torsoCenter) {
      metaBalls.push({ center: torsoCenter, radius: 2.1 });
    }
  }

  const triangles = marchingCubes();
  updateBlobMesh(triangles);
  render();
});

// Helper function to calculate the torso center from pose landmarks
function getTorsoCenter(poseLandmarks) {
  if (!poseLandmarks) return null;

  const leftShoulder = poseLandmarks[11];
  const rightShoulder = poseLandmarks[12];
  const leftHip = poseLandmarks[23];
  const rightHip = poseLandmarks[24];

  if (!(leftShoulder && rightShoulder && leftHip && rightHip)) return null;

  const avg = (a, b, c, d) => (a + b + c + d) / 4;

  // Calculate average of shoulders and hips in 3D space
  const x = avg(leftShoulder.x, rightShoulder.x, leftHip.x, rightHip.x);
  const y = avg(leftShoulder.y, rightShoulder.y, leftHip.y, rightHip.y);
  const z = avg(leftShoulder.z, rightShoulder.z, leftHip.z, rightHip.z);

  // Map MediaPipe normalized coordinates to Three.js world space
  return new THREE.Vector3(
    (x - 0.5) * 10, // Map x to the Three.js space
    -(y - 0.5) * 10, // Map y to the Three.js space
    (z || 0) * 10 // Map z to the Three.js space
  );
}

// ==== Camera Feed ====
const liveCam = new Camera(videoElement, {
  onFrame: async () => {
    await holistic.send({ image: videoElement });
  },
  width: window.innerWidth,
  height: window.innerHeight,
});
liveCam.start();

// ==== Blob Rendering ====
function updateBlobMesh(trianglePoints) {
  scene.traverse((obj) => {
    if (obj.isMesh && obj.userData.isBlob) {
      scene.remove(obj);
    }
  });

  const vertices = new Float32Array(trianglePoints.length * 3);
  for (let i = 0; i < trianglePoints.length; i++) {
    const p = trianglePoints[i];
    vertices[i * 3] = p.x;
    vertices[i * 3 + 1] = p.y;
    vertices[i * 3 + 2] = p.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, blobMaterial);
  mesh.userData.isBlob = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  scene.add(mesh);
}

// ==== Animation Loop ====
function render() {
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

animate();

// ==== Resize Handling ====
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});
