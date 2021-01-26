import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import * as dat from 'dat.gui';
import * as CANNON from 'cannon-es';
import { Reflector } from 'three/examples/jsm/objects/Reflector';

/**
 * GUI
 */

const gui = new dat.GUI();
const debugObject = {};
//create sphere
debugObject.createSphere = () => {
  createSphere(Math.random() * 0.5, {
    x: (Math.random() - 0.5) * 3,
    y: 3,
    z: (Math.random() - 0.5) * 3,
  });
};

//create box
debugObject.createBox = () => {
  createBox(Math.random(), Math.random(), Math.random(), {
    x: (Math.random() - 0.5) * 3,
    y: 3,
    z: (Math.random() - 0.5) * 3,
  });
};

//create cylinder
// debugObject.createCylinder = () => {
//   createCylinder(1, 1, 1, {
//     x: (Math.random() - 0.5) * 3,
//     y: 3,
//     z: (Math.random() - 0.5) * 3,
//   });
// };

debugObject.reset = () => {
  for (const object of objectsToUpdate) {
    //remove physical body
    object.body.removeEventListener('collide', playHitSound);
    world.removeBody(object.body);

    //remove THREE mesh
    scene.remove(object.mesh);
  }
};

gui.add(debugObject, 'createSphere');
gui.add(debugObject, 'createBox');
// gui.add(debugObject, 'createCylinder');
gui.add(debugObject, 'reset');

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Sounds
 */
const hitSound = new Audio('/sounds/hit.mp3');

const playHitSound = (collision) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal();
  if (impactStrength > 1.5) {
    impactStrength < 10
      ? (hitSound.volume = impactStrength * 0.1)
      : (hitSound.volume = 0.9);
    hitSound.currentTime = 0;
    hitSound.play();
  }
};

const metalSound = new Audio('/sounds/metal.mp3');

const playMetalSound = (collision) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal();
  if (impactStrength > 1.5) {
    impactStrength < 10
      ? (metalSound.volume = impactStrength * 0.1)
      : (metalSound.volume = 0.9);
    metalSound.currentTime = 0;
    metalSound.play();
  }
};

const glassSound = new Audio('/sounds/glass_ping-Go445-1207030150.mp3');

const playGlassSound = (collision) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal();
  if (impactStrength > 0.5) {
    impactStrength < 10
      ? (glassSound.volume = impactStrength * 0.1)
      : (glassSound.volume = 0.9);
    glassSound.currentTime = 0;
    glassSound.play();
  }
};

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
  '/textures/environmentMaps/3/px.png',
  '/textures/environmentMaps/3/nx.png',
  '/textures/environmentMaps/3/py.png',
  '/textures/environmentMaps/3/ny.png',
  '/textures/environmentMaps/3/pz.png',
  '/textures/environmentMaps/3/nz.png',
]);

scene.background = environmentMapTexture;

/**
 * Physics
 */
//World
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.gravity.set(0, -9.82, 0);

//Cannon Marble
const marbleShape = new CANNON.Sphere(0.5);
const marbleBody = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(0, 3, 0),
  shape: marbleShape,
});
marbleBody.addEventListener('collide', playGlassSound);
world.addBody(marbleBody);

/**
 * Three.js Marble
 */
const marbleGeometry = new THREE.IcosahedronBufferGeometry(0.75);
const marbleMaterial = new THREE.MeshMatcapMaterial();
const matcapTexture = new THREE.TextureLoader().load(
  '/textures/img/crystal-matcap.png'
);
marbleMaterial.matcap = matcapTexture;
const marble = new THREE.Mesh(marbleGeometry, marbleMaterial);

marble.castShadow = true;
scene.add(marble);

//Materials
const defaultMaterial = new CANNON.Material('default');
const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.7,
  }
);
world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

/**
 * Cannon Floor
 */
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body();
floorBody.mass = 0;
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);

/**
 * Three Floor
 */
const groundMirror = new Reflector(new THREE.PlaneBufferGeometry(50, 50), {
  color: new THREE.Color(0x222222),
  clipBias: 0.003,
});
groundMirror.receiveShadow = true;
groundMirror.position.y = -0.05;
groundMirror.rotation.x = -Math.PI * 0.5;
scene.add(groundMirror);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-3, 3, 3);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Utils
 */
const objectsToUpdate = [];

//Sphere
const sphereGeometry = new THREE.SphereBufferGeometry(1, 20, 20);
const sphereMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
});

const createSphere = (radius, position) => {
  //Three.js mesh
  const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  mesh.scale.set(radius, radius, radius);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  //Cannon.js body
  const shape = new CANNON.Sphere(radius);
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 7, 0),
    shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  body.addEventListener('collide', playMetalSound);
  world.addBody(body);

  //Save the new sphere in objectsToUpdate array
  objectsToUpdate.push({
    mesh,
    body,
  });
};

//Box
const boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
const boxTexture = new THREE.TextureLoader();
const boxMaterial = new THREE.MeshStandardMaterial({
  map: boxTexture.load('/textures/img/woodTexture.jpg'),
});

const createBox = (width, height, depth, position) => {
  //Three.js mesh
  const mesh = new THREE.Mesh(boxGeometry, boxMaterial);
  mesh.scale.set(width, height, depth);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  //Cannon.js body
  const shape = new CANNON.Box(
    new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5)
  );
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 7, 0),
    shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  body.addEventListener('collide', playHitSound);
  world.addBody(body);

  //Save the new box in objectsToUpdate array
  objectsToUpdate.push({
    mesh,
    body,
  });
};

//Cylinder
// const cylinderGeometry = new THREE.CylinderBufferGeometry(1, 1, 1);
// const cylinderMaterial = new THREE.MeshStandardMaterial({
//   metalness: 0.3,
//   roughness: 0.4,
//   envMap: environmentMapTexture,
// });

// const createCylinder = (radiusTop, radiusBottom, height, position) => {
//   //Three.js mesh
//   const mesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
//   mesh.scale.set(radiusTop, radiusBottom, height);
//   mesh.castShadow = true;
//   mesh.position.copy(position);
//   scene.add(mesh);

//   //Cannon.js body
//   const shape = new CANNON.Cylinder(
//     new CANNON.Vec3(radiusTop, radiusBottom, height)
//   );
//   const body = new CANNON.Body({
//     mass: 1,
//     position: new CANNON.Vec3(0, 7, 0),
//     shape,
//     material: defaultMaterial,
//   });
//   body.position.copy(position);
//   body.addEventListener('collide', playHitSound);
//   world.addBody(body);

//   //Save the new cylinder in objectsToUpdate array
//   objectsToUpdate.push({
//     mesh,
//     body,
//   });
// };

/**
 * The car
 */

let chassisShape = new CANNON.Box(new CANNON.Vec3(2, 1, 0.5));
let chassisBody = new CANNON.Body({ mass: 1 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 10, 4);
chassisBody.angularVelocity.set(0, 0, 0.5);

let options = {
  radius: 0.5,
  directionLocal: new CANNON.Vec3(0, 0, -1),
  suspensionStiffness: 30,
  suspensionRestLength: 0.3,
  frictionSlip: 5,
  dampingRelaxation: 2.3,
  dampingCompression: 4.4,
  maxSuspensionForce: 100000,
  rollInfluence: 0.01,
  axleLocal: new CANNON.Vec3(0, 1, 0),
  chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
  maxSuspensionTravel: 0.3,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
};

// Create the vehicle
let vehicle = new CANNON.RaycastVehicle({
  chassisBody: chassisBody,
});

const vehicleMesh = new THREE.Mesh(
  new THREE.BoxBufferGeometry(4, 2, 1),
  boxMaterial
);
// vehicleMesh.scale.set(4, 2, 1);
vehicleMesh.castShadow = true;
// vehicleMesh.position.copy(chassisBody.position);
scene.add(vehicleMesh);

options.chassisConnectionPointLocal.set(1, 1, 0);
vehicle.addWheel(options);

options.chassisConnectionPointLocal.set(1, -1, 0);
vehicle.addWheel(options);

options.chassisConnectionPointLocal.set(-1, 1, 0);
vehicle.addWheel(options);

options.chassisConnectionPointLocal.set(-1, -1, 0);
vehicle.addWheel(options);

vehicle.addToWorld(world);

/**
 * Marble controls
 */
const onKeyDown = function (event) {
  switch (event.keyCode) {
    case 87: // w
      marbleBody.applyLocalForce(
        new CANNON.Vec3(100, 0, 0),
        new CANNON.Vec3(0, 0, 1)
      );
      chassisBody.applyLocalForce(
        new CANNON.Vec3(100, 0, 0),
        new CANNON.Vec3(0, 0, 1)
      );
      break;
    case 65: // a
      marbleBody.applyLocalForce(
        new CANNON.Vec3(0, 0, 100),
        new CANNON.Vec3(1, 0, 0)
      );
      chassisBody.applyLocalForce(
        new CANNON.Vec3(0, 0, 100),
        new CANNON.Vec3(1, 0, 0)
      );
      break;
    case 83: // s
      marbleBody.applyLocalForce(
        new CANNON.Vec3(-100, 0, 0),
        new CANNON.Vec3(0, 0, -1)
      );
      chassisBody.applyLocalForce(
        new CANNON.Vec3(-100, 0, 0),
        new CANNON.Vec3(0, 0, -1)
      );
      break;
    case 68: // d
      marbleBody.applyLocalForce(
        new CANNON.Vec3(0, 0, -100),
        new CANNON.Vec3(-1, 0, 0)
      );
      chassisBody.applyLocalForce(
        new CANNON.Vec3(0, 0, -100),
        new CANNON.Vec3(-1, 0, 0)
      );
      break;
    case 32: //spacebar
      marbleBody.applyLocalForce(
        new CANNON.Vec3(0, 500, 0),
        new CANNON.Vec3(0, 0, 0)
      );
      chassisBody.applyLocalForce(
        new CANNON.Vec3(0, 500, 0),
        new CANNON.Vec3(0, 0, 0)
      );
      break;
  }
};
document.addEventListener('keydown', onKeyDown, false);

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  //Update physics world

  world.step(1 / 60, deltaTime, 3);

  marble.position.copy(marbleBody.position);
  vehicleMesh.position.copy(chassisBody.position);

  for (const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
