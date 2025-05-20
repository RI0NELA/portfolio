import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

let scene, camera, renderer, stars;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let time = 0;

init();
animate();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 400;

  const starCount = 3000;
    const positions = [];
    const sizes = [];
    const colors = [];
    const phases = [];

    for (let i = 0; i < starCount; i++) {
      const radius = Math.random() * 1000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions.push(x, y, z);
      sizes.push(THREE.MathUtils.randFloat(3.0, 6.0));

      // Random pastel-ish star color
      const color = new THREE.Color();
      color.setHSL(Math.random(), 0.7, 0.8);
      colors.push(color.r, color.g, color.b);

      // Random phase offset for twinkling
      phases.push(Math.random() * Math.PI * 2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));

    const vertexShader = `
      attribute float size;
      attribute float phase;
      varying float vAlpha;
      varying vec3 vColor;
      uniform float time;
      attribute vec3 customColor;

      void main() {
        vColor = customColor;

        float twinkle = sin(time + phase) * 0.3 + 0.7;
        vAlpha = twinkle;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0.0 }
      }
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
  }

  function onMouseMove(event) {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
  }

  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    time += 0.02;
    stars.material.uniforms.time.value = time;

    // Space drift effect
    stars.rotation.y += 0.0005;
    stars.rotation.x += 0.0002;
    camera.position.x += (mouseX - camera.position.x) * 0.005;
    camera.position.y += (-mouseY - camera.position.y) * 0.005;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

// music 

const tracks = [
  'audio/windows96.mp3',
  'audio/september.mp3',
  'audio/home.mp3',
];

const audio = new Audio();
const currentTrack = Math.floor(Math.random() * tracks.length);
audio.src = tracks[currentTrack];
audio.volume = 0.3;

audio.play().catch(() => {
  // Some browsers require user interaction to play audio
  console.log('Playback failed: user interaction required.');
});