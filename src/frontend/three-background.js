// Three.js background animation
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('background-animation').appendChild(renderer.domElement);

// Create grid of particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
	posArray[i] = (Math.random() - 0.5) * 10;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
	size: 0.005,
	color: '#00ffff',
	transparent: true,
	opacity: 0.8,
	blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

camera.position.z = 3;

// Mouse movement effect
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
	mouseX = event.clientX / window.innerWidth - 0.5;
	mouseY = event.clientY / window.innerHeight - 0.5;
});

// Animation loop
function animate() {
	requestAnimationFrame(animate);
	
	particlesMesh.rotation.y += 0.001;
	particlesMesh.rotation.x += 0.001;
	
	// Mouse follow effect
	particlesMesh.rotation.y += mouseX * 0.1;
	particlesMesh.rotation.x += mouseY * 0.1;
	
	renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();