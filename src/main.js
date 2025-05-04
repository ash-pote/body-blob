import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { Holistic } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";
import { marchingCubes, metaBalls, gridHelper } from "./MarchingCubes";
// import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
// import CustomShaderMaterial from "three-custom-shader-material/vanilla";
// import wobbleVertexShader from "./shaders/wobble/vertex.glsl";
// import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";

// ==== Constants ====
const NOSE_TIP_INDEX = 1;

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

// scene.add(gridHelper);

scene.background = new THREE.Color(0x000000);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true, // Enable transparent background
});
renderer.setPixelRatio(sizes.pixelRatio);
renderer.setSize(sizes.width, sizes.height);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 3;
container.appendChild(renderer.domElement);

// ==== Environment Map ====
new RGBELoader().load("./urban_alley_01_1k.hdr", (envMap) => {
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = envMap;
  // scene.background = envMap;
});

//beam
// Declare spotlight first
// const spotLight = new THREE.SpotLight(
//   0x00ff00,
//   10.5,
//   10,
//   Math.PI * 0.1,
//   0.75,
//   1
// );
// spotLight.position.set(0, 3, 0);
// scene.add(spotLight);

// // Add target
// spotLight.target.position.set(0, 3, 0);
// scene.add(spotLight.target);

// THEN create beam
// const beamGeometry = new THREE.CylinderGeometry(
//   3, // top radius (wider opening)
//   4, // bottom radius (narrow)
//   22, // height
//   32, // radial segments
//   1, // height segments
//   true // open-ended
// );

// const beamMaterial = new THREE.MeshBasicMaterial({
//   color: 0x00ff00,
//   transparent: true,
//   opacity: 0.1,
//   depthWrite: false,
//   side: THREE.DoubleSide,
// });
// const beam = new THREE.Mesh(beamGeometry, beamMaterial);
// beam.position.copy(spotLight.position);
// beam.lookAt(spotLight.target.position);
// scene.add(beam);

// scene.fog = new THREE.Fog(0x000000, 5, 40); // color, near, far

// ==== Flubber Material ====
const blobMaterial = new THREE.MeshPhysicalMaterial({
  color: "#00ff00",
  metalness: 0.1,
  roughness: 0.05,
  transmission: 0.9,
  ior: 1.5,
  thickness: 2,
  transparent: true,
  opacity: 0.75,
  side: THREE.DoubleSide,
  envMap: scene.environment, // Use the scene's environment map for reflections
  reflectivity: 1, // This makes it reflective
});

// const uniforms = {
//   uTime: new THREE.Uniform(0),
//   uPositionFrequency: new THREE.Uniform(0.1),
//   uTimeFrequency: new THREE.Uniform(0.4),
//   uStrength: new THREE.Uniform(0.3),
//   uWarpPositionFrequency: new THREE.Uniform(0.38),
//   uWarpTimeFrequency: new THREE.Uniform(0.12),
//   uWarpStrength: new THREE.Uniform(1.7),
//   // uColorA: new THREE.Uniform(new THREE.Color(`hsl(10, 100%, 50%)`)),
//   uColorA: new THREE.Uniform(new THREE.Color(0x00ff00)),
//   uColorB: new THREE.Uniform(new THREE.Color(0x00ff00)),
// };

// const uniforms2 = {
//   ...uniforms,
//   uColorA: new THREE.Uniform(new THREE.Color(0x0000ff)), // Set to a different color, e.g., blue
// };

// const material = new CustomShaderMaterial({
//   // CSM
//   baseMaterial: THREE.MeshPhysicalMaterial,
//   vertexShader: wobbleVertexShader,
//   fragmentShader: wobbleFragmentShader,
//   uniforms: uniforms,
//   silent: true,
//   flatShading: true,

//   // MeshPhysicalMaterial
//   metalness: 0,
//   roughness: 0.2,
//   color: "#00ff00",
//   transmission: 0.9,
//   ior: 1.5,
//   thickness: 1.5,
//   transparent: true,
//   wireframe: false,
//   envMap: scene.environment,
//   reflectivity: 1,
// });

// const depthMaterial = new CustomShaderMaterial({
//   // CSM
//   baseMaterial: THREE.MeshDepthMaterial,
//   vertexShader: wobbleVertexShader,
//   uniforms: uniforms,
//   silent: true,

//   // MeshDepthMaterial
//   depthPacking: THREE.RGBADepthPacking,
// });

// let geometry2 = new THREE.IcosahedronGeometry(2.5, 50);
// geometry2 = mergeVertices(geometry2);
// geometry2.computeTangents();

// const wobble = new THREE.Mesh(geometry2, material);
// wobble.customDepthMaterial = depthMaterial;
// wobble.position.set(1, 1, 1);
// scene.add(wobble);

// ==== MediaPipe Holistic Setup ====
const holistic = new Holistic({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
});

holistic.setOptions({
  modelComplexity: 0,
  smoothLandmarks: false,
  enableSegmentation: false,
  refineFaceLandmarks: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  // Disable hand and face detection to focus on pose only
  selfieMode: true,
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

  // const leftElbow = results.poseLandmarks?.[13];
  // if (leftElbow) {
  //   const point = new THREE.Vector3(
  //     (leftElbow.x - 0.5) * 35,
  //     -(leftElbow.y - 0.5) * 10,
  //     (leftElbow.z || 0) * 10
  //   );
  //   metaBalls.push({ center: point, radius: 0.1 });
  // }

  const leftIndexTip = results.leftHandLandmarks?.[8]; // Left hand index finger tip (Landmark 8)
  if (leftIndexTip) {
    const point = new THREE.Vector3(
      (leftIndexTip.x - 0.5) * 20, // Map x to [-5, 5] range
      -(leftIndexTip.y - 0.5) * 5,
      // Map y to [-5, 5] range
      (leftIndexTip.z || 0) * 10 // Map z directly (scaled)
    );
    metaBalls.push({ center: point, radius: 0.1 }); // Add the left index tip as a MetaBall
  }

  // const rightElbow = results.poseLandmarks?.[14];
  // if (rightElbow) {
  //   const point = new THREE.Vector3(
  //     (rightElbow.x - 0.5) * 35,
  //     -(rightElbow.y - 0.5) * 10,
  //     (rightElbow.z || 0) * 10
  //   );
  //   metaBalls.push({ center: point, radius: 0.1 });
  // }

  const rightIndexTip = results.rightHandLandmarks?.[8]; // Right hand index finger tip (Landmark 8)
  if (rightIndexTip) {
    const point = new THREE.Vector3(
      (rightIndexTip.x - 0.5) * 20, // Map x to [-5, 5] range
      -(rightIndexTip.y - 0.5) * 5, // Map y to [-5, 5] range
      (rightIndexTip.z || 0) * 10 // Map z directly (scaled)
    );
    metaBalls.push({ center: point, radius: 0.1 }); // Add the right index tip as a MetaBall
  }

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

  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  // geometry = mergeVertices(geometry);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, blobMaterial);
  // mesh.customDepthMaterial = depthMaterial;
  mesh.userData.isBlob = true;

  scene.add(mesh);
}

// const plane2 = new THREE.Mesh(
//   new THREE.CircleGeometry(10.5, 64), // radius, segments
//   new THREE.MeshStandardMaterial({
//     envMap: scene.environment,
//     reflectivity: 1,
//     side: THREE.DoubleSide, // recommended to avoid one-sided rendering
//   })
// );
// plane2.receiveShadow = true;
// plane2.rotation.y = -1.6;
// plane2.position.set(-6, 0, -2);
// scene.add(plane2);

// ==== Animation Loop ====
function render() {
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

animate();

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  // const elapsedTime = clock.getElapsedTime();

  // uniforms.uTime.value = elapsedTime;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

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
