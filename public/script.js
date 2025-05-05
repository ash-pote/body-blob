let scene, camera, renderer, mesh, uniforms;
let oscValues = {
  alpha: 0.0,
  beta: 0.0,
  delta: 0.0
};

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.z = 3;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const geometry = new THREE.SphereGeometry(1, 128, 128);

  uniforms = {
    uTime: { value: 0.0 },
    uIntensity: { value: 0.2 },
    uSpeed: { value: 0.0 },
    uColor: { value: 0.0 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
      uniform float uTime;
      uniform float uIntensity;
      uniform float uSpeed;
      varying vec2 vUv;

      float noise(vec3 p) {
        return sin(p.x * 10.0 + uTime * uSpeed) * 0.1;
      }

      void main() {
        vUv = uv;
        vec3 newPosition = position + normal * noise(position) * uIntensity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uColor;
      varying vec2 vUv;

      void main() {
        vec3 color = vec3(vUv.x, vUv.y, uColor);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    wireframe: false
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  //const controls = new OrbitControls(camera, renderer.domElement);

  const socket = new WebSocket('ws://localhost:3000');
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const [val] = data.args;

    switch (data.address) {
      case '/muse/elements/alpha_absolute':
        oscValues.alpha = val;
        break;
      case '/muse/elements/beta_absolute':
        oscValues.beta = val;
        break;
      case '/muse/elements/delta_absolute':
        oscValues.delta = val;
        break;
      default:
        console.log("Unknown OSC:", data);
    }
  };
}

function animate(time) {
  requestAnimationFrame(animate);
  uniforms.uTime.value = time * 0.001;
uniforms.uIntensity.value = THREE.MathUtils.lerp(uniforms.uIntensity.value, oscValues.delta*1.2, 0.1);
uniforms.uSpeed.value = THREE.MathUtils.lerp(uniforms.uSpeed.value, oscValues.alpha*1.7, 0.1);
uniforms.uColor.value = THREE.MathUtils.lerp(uniforms.uColor.value, oscValues.beta*1.2, 0.1);
  renderer.render(scene, camera);
}