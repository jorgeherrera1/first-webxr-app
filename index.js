import * as THREE from "three";
import WebGL from "./WebGL.js";
import { ARButton } from "https://unpkg.com/three@0.145.0/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "https://unpkg.com/three@0.145.0/examples/jsm/loaders/GLTFLoader.js";

let camera, scene, renderer, loader, controller;
let icosahedron, torus, model;
let reticle, hitTestInitialized = false, hitTestSource, localSpace;

init();

function init() {
   const container = document.createElement("div");
   document.body.appendChild(container);

   scene = new THREE.Scene();
   camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      40
   );
   renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
   });
   renderer.setSize(window.innerWidth, window.innerHeight);
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
      opacity: 0.8,
   });
   icosahedron = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
   icosahedron.position.set(0, 0, -0.5);
   scene.add(icosahedron);

   const torusGeometry = new THREE.TorusGeometry(1, 0.4, 8, 8);
   const torusMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color("rgb(226, 35, 213)"),
      shininess: 6,
      flatShading: true,
      transparent: 1,
      opacity: 0.8,
   });
   torus = new THREE.Mesh(torusGeometry, torusMaterial);
   torus.position.set(2, 0.5, -3);
   scene.add(torus);

   camera.position.z = 0.5;

   container.appendChild(renderer.domElement);

   // 3D model. Learn more at ThreeJS: Loading 3D models
   const modelUrl =
      "https://raw.githubusercontent.com/immersive-web/webxr-samples/main/media/gltf/space/space.gltf";

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

   controller = renderer.xr.getController(0);
   controller.addEventListener('select', onSelect);
   scene.add(controller);
   
   addReticleToScreen();

   // Button to start WebXR
   const button = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test']
   });
   document.body.appendChild(button);

   if (WebGL.isWebGLAvailable()) {
      // Initiate function or other initializations here
      animate();
      window.addEventListener("resize", onWindowResize, false);
   } else {
      const warning = WebGL.getWebGLErrorMessage();
      document.body.appendChild(warning);
   }
}

function addReticleToScreen() {
   const circleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
   const circleMaterial = new THREE.MeshBasicMaterial();
   reticle = new THREE.Mesh(circleGeometry, circleMaterial);

   // we will calculate the position and rotation every frame manually
   reticle.matrixAutoUpdate = false;

   // reticle will start not visible
   reticle.visible = false;

   scene.add(reticle);
}

function onSelect() {
   const coneGeometry = new THREE.ConeGeometry(0.1, 0.2, 32).rotateX(Math.PI / 2);
   const coneMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff * Math.random(),
      shininess: 6,
      flatShading: true,
      transparent: 1,
      opacity: 0.8
   });
   const cone = new THREE.Mesh(coneGeometry, coneMaterial);

   cone.position.set(0, 0, -0.6).applyMatrix4(controller.matrixWorld);
   cone.quaternion.setFromRotationMatrix(controller.matrixWorld); // rotate the object to point to the camera

   scene.add(cone);
}

function onWindowResize() {
   camera.aspect = window.innerWidth / window.innerHeight;
   camera.updateProjectionMatrix();

   renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
   renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
   if (frame) {
      // create hit test source and keep it for all frames
      if (!hitTestInitialized) {
         initializeHitTestSource();
      } else {
         // hit test can find multiple surfaces so it returns an array.
         // the first one is the closest one to the camera
         const hitTestResults = frame.getHitTestResults(hitTestSource);
         
         if (hitTestResults.length > 0) {
            const hit = hitTestResults[0]; // closest to the camera

            // represents a point on a surface
            // we use local space because even if we move the camera, we still want the object to remain there
            const pose = hit.getPose(localSpace); 

            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
         } else { // there is no surface
            reticle.visible = false;
         }
      }

      icosahedron.rotation.x += 0.01;
      icosahedron.rotation.y += 0.01;
   
      torus.rotation.x += 0.01;
      torus.rotation.y += 0.01;
   
      rotateModel();
   
      renderer.render(scene, camera);
   }
}

async function initializeHitTestSource() {
   // get the current session of XR
   const session = renderer.xr.getSession();

   // for hit testing, we want the phone to be the origin of the coordinate system
   const viewerSpace = await session.requestReferenceSpace('viewer');
   hitTestSource = await session.requestHitTestSource({space: viewerSpace});
   console.log(hitTestSource);

   // we want to use the 'local' reference space for drawing things
   localSpace = await session.requestReferenceSpace('local');
   console.log(localSpace);

   hitTestInitialized = true;

   session.addEventListener('end', () => {
      hitTestInitialized = false;
      hitTestSource = null;
   })
}

function rotateModel() {
   if (model !== undefined) {
      model.rotation.y -= 0.0002; //radians
      // model.rotation.y = THREE.MathUtils.degToRad(degrees);
   }
}
