
const el = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const container = document.querySelector('#container');

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const loadingManager = new THREE.LoadingManager();
let animationController;

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(el.clientWidth, el.clientHeight);	
container.appendChild(renderer.domElement);

let keysEntered = "";
renderer.domElement.addEventListener('mousedown', (evt) => {
	mouse.x = (evt.offsetX / evt.target.width) * 2 - 1;
	mouse.y = -(evt.offsetY / evt.target.height) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	
	const intersects = raycaster.intersectObjects(scene.children, true); // make sure it's recursive
	
	// we want to pick up only raycasts that hit any of the black buttons on the right panel of the machine
	const targets = intersects.filter(x => x.object.name.indexOf("key") > 0); // each key is a cube so the ray will hit the front and back faces leaving us with 2 targets (but same object)
	
	if(targets.length > 0){
		const keyPressed = targets[0].object;
		keysEntered += keyPressed.name[0];
		
		// display keys entered as text on the display panel?
		// this might be helpful: https://stackoverflow.com/questions/15248872/dynamically-create-2d-text-in-three-js
		// otherwise, split the display screen into 2 faces that you can just swap textures on, with the textures being
		// the letters/numbers. that would probably be easier?
		
		//TODO:
		if(keysEntered.length === 2){
			console.log("code " + keysEntered + " was entered!");
			// then check format. should be 1 letter followed by 1 number e.g. A1, A2 or A3 - use regex
			// match combination with corresponding coil in machine. call the animation for that
			// if A1 was entered, run the animation for dropping the box and depositing it in the drop area
			keysEntered = "";
		}
	}
});

const camera = defaultCamera;
camera.position.set(1,4,8);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);	
scene.add(camera);


let pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 8, 12);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 0;
pointLight.shadow.mapSize.height = 0;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 100;
pointLight.shadow.camera.fov = 70;
scene.add(pointLight);


let hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();

/* create some 'terrain'
let texture = new THREE.TextureLoader().load('texture.png');
let terrainMat = new THREE.MeshBasicMaterial({map: texture});
let terrain = new THREE.PlaneGeometry(200, 200, 1);
let plane = new THREE.Mesh(terrain, terrainMat);
plane.position.set(0, -1, 0);
plane.rotateX((3*Math.PI)/2);
scene.add(plane);
*/

// add the vending machine
function getModel(modelFilePath, side, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			function(gltf){
				resolve({
					'scene': gltf.scene,
					'animations': gltf.animations,
				});
			},
			// called while loading is progressing
			function(xhr){
				console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
			},
			// called when loading has errors
			function(error){
				console.log('An error happened');
				console.log(error);
			}
		);
	});
}

let vendingMachine;
let keys;
let animations;
getModel('vending-machine.gltf').then((data) => {
	const obj = data.scene;
	
	// keep track of animations
	animations = data.animations;
	//console.log(animations);
	
	// keep track of the buttons of the vending machine
	keys = obj.children.filter(x => x.name === "display")[0].children.filter(x => x.name.indexOf('key') > 0);
	
	obj.position.x += 1;
	obj.rotation.y = Math.PI;
	obj.scale.x *= 5;
	obj.scale.y *= 5;
	obj.scale.z *= 5;
	vendingMachine = obj;
	scene.add(obj);
});

/* function keydown(evt){
	if(evt.keyCode === 49){
	}
}
document.addEventListener("keydown", keydown); */


function update(){
	if(vendingMachine){
		let sec = clock.getDelta();
		let rotationAngle = (Math.PI / 2) * sec;
		vendingMachine.rotateOnAxis(new THREE.Vector3(0,1,0), rotationAngle/4);
	}
}

function animate(){
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	update();
}

animate();