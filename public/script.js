// === SETUP THREE.JS ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 2;

// === Create 33 blob joints (spheres)
const joints = [];
for (let i = 0; i < 33; i++) {
  const geo = new THREE.SphereGeometry(0.02, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
  const sphere = new THREE.Mesh(geo, mat);
  scene.add(sphere);
  joints.push(sphere);
}

//RENDER LOOP 
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Update Pose Blob from Landmarks
function updateBlobPose(landmarks) {
  landmarks.forEach((lm, i) => {
    joints[i].position.set(-lm.x + 0.5, -lm.y + 0.5, -lm.z);
  });
}

// RECORDING LOGIC
let isRecording = false;
let isReplaying = false;
let poseRecording = [];

document.addEventListener('keydown', (e) => {
    if (e.key === 'r') {
      poseRecording = [];
      isRecording = true;
      const startTime = performance.now();
      console.log('Recording started for 5 seconds...');
  
      setTimeout(() => {
        isRecording = false;
        console.log('Recording ended. Saving file...');
        savePoseToServer(poseRecording); // ✅ Call here
      }, 5000); // Stop recording after 5 seconds
    }
  });
  
  function savePoseToServer(data) {
    fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.text())
      .then(msg => console.log(msg))
      .catch(err => console.error('Save failed:', err));
  }

// REPLAY LOGIC 
const replayBtn = document.getElementById('replayBtn');

replayBtn.addEventListener('click', () => {
  loadRandomPose(); // randomly selects a pose
});
function loadRandomPose() {
  fetch('/random-pose')                         
    .then(res => res.json())                    
    .then(data => replayPoseData(data))         
    .catch(err => console.error('Failed to load pose:', err)); // 4
}



function replayPoseData(data) {
    if (!data || data.length === 0) return;
  
    isReplaying = true;
    console.log("Replaying pose data...");
  
    let i = 0;
  
    function step() {
      if (i >= data.length) {
        isReplaying = false; // ✅ done replaying
        return;
      }
  
      const frame = data[i];
      updateBlobPose(frame.landmarks);
  
      const nextTimestamp = i < data.length - 1 ? data[i + 1].timestamp : null;
      const delay = nextTimestamp
        ? nextTimestamp - frame.timestamp
        : 33;
  
      i++;
      setTimeout(step, delay);
    }
  
    step();
  }
// === SETUP MEDIAPIPE POSE ===
const videoElement = document.createElement('video');
videoElement.style.display = 'none';
document.body.appendChild(videoElement);

const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`
});
pose.setOptions({
  modelComplexity: 0,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults((results) => {
    if (isReplaying) return; // ⛔ skip updating during replay
  
    if (results.poseLandmarks) {
      updateBlobPose(results.poseLandmarks);
  
      if (isRecording) {
        poseRecording.push({
          timestamp: performance.now(),
          landmarks: results.poseLandmarks.map(p => ({
            x: p.x,
            y: p.y,
            z: p.z,
            visibility: p.visibility
          }))
        });
      }
    }
  });

// === CAMERA SETUP ===
const cameraUtils = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
cameraUtils.start();