import * as THREE from 'three';
import WebGL from './WebGL.js';
import { ARButton } from 'https://unpkg.com/three@0.145.0/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.145.0/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer, loader;
let icosahedron, torus, model;

init();

function init() {
	const container = document.createElement('div');
	document.body.appendChild(container);

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	});
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.xr.enabled = true;

	const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
	light.position.set(0.5, 1, 0.25);
	scene.add(light);

	const icosahedronGeometry = new THREE.IcosahedronGeometry(0.1, 1);
	const icosahedronMaterial = new THREE.MeshPhongMaterial({
		color: new THREE.Color("rgb(226, 35, 213)"),
		shininess: 6,
		flatShading: true,
		transparent: 1,
		opacity: 0.8
	});
	icosahedron = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
	icosahedron.position.set(0, 0, -0.5);
	scene.add(icosahedron);

	const torusGeometry = new THREE.TorusGeometry( 1, 0.4, 8, 8 );
	const torusMaterial = new THREE.MeshPhongMaterial({
		color: new THREE.Color("rgb(226, 35, 213)"),
		shininess: 6,
		flatShading: true,
		transparent: 1,
		opacity: 0.8
	});
	torus = new THREE.Mesh( torusGeometry, torusMaterial );
	torus.position.set(2, 0.5, -3);
	scene.add(torus);

	camera.position.z = 0.5;

	container.appendChild(renderer.domElement);

	// 3D model. Learn more at ThreeJS: Loading 3D models
	const modelUrl = 'https://raw.githubusercontent.com/immersive-web/webxr-samples/main/media/gltf/space/space.gltf';

	// loader object. GLTF loader
	loader = new GLTFLoader();
	loader.load(
		modelUrl,
		// gets called when model has finished loading
		(gltf) => {
			model = gltf.scene;
			model.position.y = 5;
			scene.add(model);
		},
		(event) => {
			console.log(event);
		}
	);

	// Button to start WebXR
	const button = ARButton.createButton(renderer);
	document.body.appendChild(button);

	if (WebGL.isWebGLAvailable()) {
		// Initiate function or other initializations here
		animate();
		window.addEventListener('resize', onWindowResize, false);
	} else {
		const warning = WebGL.getWebGLErrorMessage();
		document.body.appendChild(warning);
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	renderer.setAnimationLoop(render);
}

function render() {
	icosahedron.rotation.x += 0.01;
    icosahedron.rotation.y += 0.01;

	torus.rotation.x += 0.01;
	torus.rotation.y += 0.01;

	rotateModel();

	renderer.render(scene, camera);
}

function rotateModel() {
	if (model !== undefined) {
		model.rotation.y -= 0.0002; //radians
		// model.rotation.y = THREE.MathUtils.degToRad(degrees);
	}
}
