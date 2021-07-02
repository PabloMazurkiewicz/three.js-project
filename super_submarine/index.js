// super submarine!
// relies on some functions defined in ../lib/utils.js
// and Water defined in ../lib/Water.js
// and stats defined in ../lib/stats.js

// check if spotlight hits the dangerous capsule or the sunken ship
// source = position of source obj, dir = direction vector
function checkGoalObjectHit(source, dir, raycaster, scene){
	raycaster.set(source, dir);
	let intersects = raycaster.intersectObjects(scene.children);
	for(let i = 0; i < intersects.length; i++){

		let target = intersects[i];

		if(target.object.name === "goalObject" || target.object.name === "goalObject2"){
			// dangerous capsule
			let inRange = source.distanceTo(target.point) > 7.0 && source.distanceTo(target.point) < 12.0;
			if(inRange){
				//console.log("hit capsule!");
				return target.object;
			}
		}
	}
	return null;
}

function createSpotlight(){
	let spotlight = new THREE.SpotLight(0xffffff, 1.8, 50, 0.35, 1.0, 1.2);
	spotlight.castShadow = true;
	
	spotlight.shadow.mapSize.width = 20;
	spotlight.shadow.mapSize.height = 20;
	
	spotlight.shadow.camera.near = 10;
	spotlight.shadow.camera.far = 20;
	spotlight.shadow.camera.fov = 10;
	
	return spotlight;
}

function createCongratsMsg(msg, progressBar){
	congratsMsg = document.createElement("h3");
	congratsMsg.style.position = "absolute";
	congratsMsg.style.top = progressBar.style.top;
	congratsMsg.style.left = progressBar.style.left;
	congratsMsg.style.fontFamily = "monospace";
	congratsMsg.style.color = "#fff";
	congratsMsg.textContent = msg;	
	congratsMsg.style.display = "block";
	return congratsMsg;
}

function createJellyfishGroup(mesh){
	// pass in mesh of the jellyfish
	const jGroup = new THREE.Group();
	jGroup.add(mesh);
	
	// note that THREE.SkeletonUtils comes from https://cdn.jsdelivr.net/npm/three@v0.103.0/examples/js/utils/SkeletonUtils.js
	const jellyClone = THREE.SkeletonUtils.clone(mesh);
	jfishAnimation2 = new THREE.AnimationMixer(jellyClone); // notice we're referencing a global variable
	jGroup.add(jellyClone);
	jellyClone.position.y += 5;
	jellyClone.position.z -= 5;
	
	const jellyClone2 = THREE.SkeletonUtils.clone(mesh);
	jfishAnimation3 = new THREE.AnimationMixer(jellyClone2);
	jellyClone2.scale.x /= 1.5;
	jellyClone2.scale.y /= 1.5;
	jellyClone2.scale.z /= 1.5;
	jGroup.add(jellyClone2);
	jellyClone2.position.y += 3;
	jellyClone2.position.x -= 7;
	
	return jGroup;
}


// https://github.com/evanw/webgl-water
// https://github.com/donmccurdy/three-gltf-viewer/blob/master/src/viewer.js
const el = document.getElementById("container");
const fov = 60;
const defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);
const keyboard = new THREEx.KeyboardState();
const container = document.querySelector('#container');
const raycaster = new THREE.Raycaster();
const loadingManager = new THREE.LoadingManager();

/* const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom); */

// https://stackoverflow.com/questions/35575065/how-to-make-a-loading-screen-in-three-js
loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
	// set up a loading bar
	let container = document.getElementById("container");
	let containerDimensions = container.getBoundingClientRect();
	let left = (containerDimensions.left + Math.round(.40 * containerDimensions.width)) + "px";
	let top = (containerDimensions.top + Math.round(.50 * containerDimensions.height)) + "px";
	let loadingBarContainer = createProgressBar("loading", "#00ff00");
	loadingBarContainer.style.left = left;
	loadingBarContainer.style.top = top;
	container.appendChild(loadingBarContainer);
}

loadingManager.onLoad = () => {
	document.getElementById("container").removeChild(
		document.getElementById("loadingBarContainer")
	);
	
	// add the player's health bar 
	createHealthBar();
	
	// set up the progress bar to be used for disarming the dangerous capsule 
	createProgressBarContainer("disarm");
	
	// set up progress bar for recovering sunken ship
	createProgressBarContainer("sunkenShip");
}

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
	let bar = document.getElementById("loadingBar");
	bar.style.width = (parseInt(bar.parentNode.style.width) * (itemsLoaded/itemsTotal)) + 'px';
}

loadingManager.onError = (url) => {
	console.log("there was an error loading :(");
}

const loader = new THREE.GLTFLoader(loadingManager);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(el.clientWidth, el.clientHeight);	
container.appendChild(renderer.domElement);

// for disarming the dangerous capsule
setupGoalObjectMessage(
	document.getElementsByTagName('canvas')[0],
	"disarmMessage",
	"hold space to disarm the dangerous capsule"
);

// for recovering the sunken ship
setupGoalObjectMessage(
	document.getElementsByTagName('canvas')[0],
	"sunkenShipMessage",
	"hold space to recover important parts of the sunken ship"
);

const camera = defaultCamera;
camera.position.set(0,2,0);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);	
scene.add(camera);

let pointLight = new THREE.PointLight(0xffffff, 1, 0); //new THREE.pointLight( 0xffffff );
pointLight.position.set(0, 10, -35);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 100;
pointLight.shadow.camera.fov = 30;
scene.add(pointLight);

let hemiLight = new THREE.HemisphereLight(0xffffff);
hemiLight.position.set(0, 100, 0);
scene.add(hemiLight);

const clock = new THREE.Clock();
let sec = clock.getDelta();
let moveDistance = 60 * sec;
let rotationAngle = (Math.PI / 2) * sec;

// animation mixer for whale shark
let whaleSharkAnimation = null;
let whaleSharkClips = null;

// jellyfish animation
let jfishAnimation = null;
let jfishAnimation2 = null;
let jfishAnimation3 = null;
let jfishClips = null;

let thePlayer = null;
let theNpc = null;
let jellyfishGroup = null;
let capsuleToDisarm = null;
let sunkenShip = null;
let water = null;

let loadedModels = [];

function getModel(modelFilePath, side, name){
	return new Promise((resolve, reject) => {
		loader.load(
			modelFilePath,
			function(gltf){
				gltf.scene.traverse((child) => {

					let obj;
						
					if(child.type === "SkinnedMesh"){
						
						obj = child;
						
						// why does my skinnedmesh require a different set of initial rotations to get things looking the same as with a regular mesh!?
						obj.rotateOnAxis(new THREE.Vector3(-1,0,0), Math.PI / 2);
						obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI); // turn around 180 deg.
							
						if(side === "whaleshark"){
							// whale shark
							// https://stackoverflow.com/questions/46317927/what-is-the-correct-way-to-bind-a-skeleton-to-a-skinnedmesh-in-three-js
							obj.add(child.skeleton.bones[0]);
							
							obj.scale.x = child.scale.x * 20;
							obj.scale.y = child.scale.y * 20;
							obj.scale.z = child.scale.z * 20;
							
							whaleSharkClips = gltf.animations;
						}else if(side === "jellyfish"){
							// don't have a root bone for jellyfish :(
							child.skeleton.bones.forEach((bone) => {
								obj.add(bone);
							});

							jfishClips = gltf.animations;
						}
					}else if(child.type === "Mesh"){
						obj = child;
						obj.scale.x = child.scale.x * 20;
						obj.scale.y = child.scale.y * 20;
						obj.scale.z = child.scale.z * 20;
						obj.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI / 2);
					}
					
					if(obj){
						obj.side = side;
						obj.name = name;
						resolve(obj);
					}
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

loadedModels.push(getModel('models/submarine1.glb', 'player', 'p1'));
loadedModels.push(getModel('models/battleship2.gltf', 'player2', 'p2'));
loadedModels.push(getModel('models/oceanfloor.glb', 'none', 'bg'));
loadedModels.push(getModel('models/whale-shark-final.gltf', 'whaleshark', 'npc'));
loadedModels.push(getModel('models/jellyfish-animated.gltf', 'jellyfish', 'npc'));
loadedModels.push(getModel('models/dangerous-capsule-edit-final.glb', 'none', 'goalObject'));
loadedModels.push(getModel('models/smallship-damaged.gltf', 'none', 'goalObject2'));

Promise.all(loadedModels).then((objects) => {
	objects.forEach((mesh) => {
		if(mesh.name === "p2"){
			// battleship
			mesh.position.set(-15, 25, -50);
			mesh.scale.x *= 3;
			mesh.scale.y *= 3;
			mesh.scale.z *= 3;
		}else if(mesh.name === "bg"){
			// ocean floor
			mesh.position.set(0, -20, 0);
			
			// add water?
			// https://github.com/jbouny/ocean
			// this is jbouny's THREE.Water implementation	
			let directionalLight = new THREE.DirectionalLight(0xffff55, 1);
			directionalLight.position.set(-600, 80, 600);
			scene.add(directionalLight);
				
			let waterNormals = new THREE.TextureLoader().load('waternormals.jpg', (texture) => {
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
			});
			
			water = new THREE.Water(renderer, camera, scene, {
				textureWidth: 256,
				textureHeight: 256,
				waterNormals: waterNormals,
				alpha: 	1.0,
				sunDirection: directionalLight.position.normalize(),
				sunColor: 0xffffff,
				waterColor: 0x001e0f,
				betaVersion: 0,
				side: THREE.DoubleSide
			});
			
			let meshMirror = new THREE.Mesh(
				new THREE.PlaneBufferGeometry(2000, 2000, 10, 10), 
				water.material
			);
			
			meshMirror.add(water);
			meshMirror.rotation.x = -Math.PI * 0.5;
			meshMirror.position.y = 28;
			meshMirror.name = "water";
			
			scene.add(meshMirror);
			
			// can't get rendering working right now but the mesh itself looks good I think.
			// water.render();
		
		}else if(mesh.name === "npc"){
			if(mesh.side === "whaleshark"){
				// whale shark
				whaleSharkAnimation = new THREE.AnimationMixer(mesh);
				
				const sharkGroup = new THREE.Group();
				sharkGroup.add(mesh);
				mesh = sharkGroup;

				theNpc = mesh;
				theNpc.matrixAutoUpdate = false;
			}else if(mesh.side === "jellyfish"){
				jfishAnimation = new THREE.AnimationMixer(mesh);
				mesh = createJellyfishGroup(mesh);
				jellyfishGroup = mesh;
				jellyfishGroup.position.z = 120;
				jellyfishGroup.position.x -= 80;
			}
		}else if(mesh.name === "goalObject"){
			mesh.position.set(-100, -18.2, -100);
			mesh.rotation.y = Math.PI / 6;
			mesh.scale.x /= 2;
			mesh.scale.y /= 2;
			mesh.scale.z /= 2;

			capsuleToDisarm = mesh;
			capsuleToDisarm.disarmed = false;
		}else if(mesh.name === "goalObject2"){
			mesh.position.set(75, -20, -60);
			mesh.scale.x /= 3;
			mesh.scale.y /= 3;
			mesh.scale.z /= 3;
			
			sunkenShip = mesh;
			sunkenShip.recovered = false;
		}else{
			// the local axis of the imported mesh is a bit weird and not consistent with the world axis. so, to fix that,
			// put it in a group object and just control the group object! the mesh is also just orientated properly initially when placed in the group.
			let group = new THREE.Group();
			group.add(mesh);
			thePlayer = group;
			mesh = group;
			mesh.position.set(0, 0, -10);
			mesh.originalColor = group.children[0].material; // this should only be temporary
			
			// set player health
			thePlayer.health = 100;
			
			// alternate materials used for the sub depending on condition 
			let hitMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
			mesh.hitMaterial = hitMaterial;
			mesh.originalMaterial = mesh.children[0].material;
			
			// give the submarine a spotlight
			// the spotlight should be facing downwards!
			let spotlight = createSpotlight(); //createSphereWireframe({}, {});
			thePlayer.spotlight = spotlight;
			thePlayer.spotlightVisible = false;
			spotlight.visible = false;
			scene.add(spotlight);
			
			// make a dummy 3d object for the spotlight to track.
			// this 3d object will always be slightly ahead and below of the submarine's nose
			// can't think of any other way to get the spotlight to point below and forward of the submarine atm
			// can I position the dummy object relative to the group and have its position stay consistent with 
			// any movement? for now I'm going to try to reposition the spotlight target based on the group's
			// forward vector.
			let spotlightTarget = new THREE.Object3D();
			group.add(spotlightTarget);
			
			scene.add(spotlightTarget);
			spotlight.target = spotlightTarget;
			
			keyboard.domElement.addEventListener("keydown", (evt) => {
				// this is supposed to turn on headlights for the sub?
				if(keyboard.eventMatches(evt, "X")){
					// we do this stuff here instead of update because on keyup, the state of key X in the keyboard object gets reset to false, 
					// which we don't want (since we're trying to set a state)

					if(!thePlayer.spotlightVisible){
						thePlayer.spotlightVisible = true;
						thePlayer.spotlight.visible = true;
					}else{
						// make sure spotlight is not visible
						thePlayer.spotlight.visible = false;
						thePlayer.spotlightVisible = false;
						
						// hide capsule disarm message if it was showing
						toggleMessage(
							document.getElementsByTagName('canvas')[0], 
							document.getElementById("disarmMessage"), 
							false
						);
					}
				}
			});
			
			animate();
		}
		
		mesh.castShadow = true;
		scene.add(mesh);
		renderer.render(scene, camera);
	})
});


let lastTime = clock.getDelta();
let hitSurface = false; // if the sub reaches the surface of the water
function update(){
	sec = clock.getDelta();
	moveDistance = 20 * sec;
	rotationAngle = (Math.PI / 2) * sec;
	let changeCameraView = false;
	
	// move the whale shark in a circle
	if(theNpc){
		let swimAction = whaleSharkAnimation.clipAction(whaleSharkClips[0]);
		swimAction.setLoop(THREE.LoopRepeat);
		swimAction.play();
		whaleSharkAnimation.update(sec);

		let curr = new THREE.Matrix4(); // identity matrix so this represents at the origin
		curr.extractRotation(theNpc.matrix); // need to build off of previous rotation

		let rotY = new THREE.Matrix4();
		rotY.makeRotationY(-0.01);
	
		// TODO: understand why this transMat gets me the result I want?
		// having a variable like t that increases by 0.005 in Math.cos and Math.sin
		// doesn't get me a satisfactory result :/
		let transMat = new THREE.Matrix4();
		transMat.set(
			1,0,0,(10+20*(Math.cos(0.001))), 
			0,1,0,0, 
			0,0,1,(10+20*(Math.sin(0.001))), 
			0,0,0,1
		); // affect only X and Z axes!

		let scale = new THREE.Matrix4();
		scale.makeScale(theNpc.scale.x/2, theNpc.scale.y/2, theNpc.scale.z/2);
		
		// https://gamedev.stackexchange.com/questions/16719/what-is-the-correct-order-to-multiply-scale-rotation-and-translation-matrices-f
		// assuming the whale shark is already at the origin (with the matrix curr, which should only have rotation info)
		curr.multiply(transMat);
		curr.multiply(scale);
		curr.multiply(rotY);
		
		theNpc.matrix.copy(curr);
	}
	
	if(jellyfishGroup){
		let swim = jfishAnimation.clipAction(jfishClips[0]);
		swim.setLoop(THREE.LoopRepeat);
		swim.play();
		
		let swim2 = jfishAnimation2.clipAction(jfishClips[0]);
		swim2.setLoop(THREE.LoopRepeat);
		swim2.play();
		
		let swim3 = jfishAnimation3.clipAction(jfishClips[0]);
		swim3.setLoop(THREE.LoopRepeat);
		swim3.play();
		
		jfishAnimation.update(sec/2.2);
		jfishAnimation2.update(sec/1.8);
		jfishAnimation3.update(sec/2);
		
		jellyfishGroup.children[1].rotateY(rotationAngle/2);
		
		jellyfishGroup.position.z -= 0.03;
	}
	
	if(keyboard.pressed("shift")){
		changeCameraView = true;
	}
	
	if(keyboard.pressed("W")){
		// note that this gets called several times with one key press!
		// I think it's because update() in requestAnimationFrames gets called quite a few times per second
		if(!(thePlayer.position.y >= 27 && thePlayer.rotation.x >= .45)){
			// as long as the player is under or equal to a y-position of 27 and 
			// their x-rotation (the angle of the submarine nose) is under 45 radians, allow forward movement
			thePlayer.translateZ(-moveDistance);
		}
		
		if(thePlayer.position.y > 27){
			// ensure that the highest the sub can go is 27.5
			thePlayer.position.y = 27;
		}
	}
	
	if(keyboard.pressed("S")){
		if(thePlayer.position.y <= 24){
			thePlayer.translateZ(moveDistance);
		}
		if(thePlayer.position.y > 24){
			thePlayer.position.y = 24;
		}
	}
	
	if(keyboard.pressed("A")){
		// rotate the sub and the camera appropriately
		let axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("D")){
		let axis = new THREE.Vector3(0, 1, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("Q")){
		let axis = new THREE.Vector3(0, 0, 1);
		thePlayer.rotateOnAxis(axis, rotationAngle);
	}
	
	if(keyboard.pressed("E")){
		let axis = new THREE.Vector3(0, 0, 1);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	if(keyboard.pressed("up")){
		// rotate up (note that we're rotating on the mesh's axis. its axes might be configured weird)
		// the forward vector for the mesh might be backwards and perpendicular to the front of the sub
		// up arrow key
		if(thePlayer.position.y < 27){
			let axis = new THREE.Vector3(1, 0, 0);
			thePlayer.rotateOnAxis(axis, rotationAngle);
		}
	}
	
	if(keyboard.pressed("down")){
		// down arrow key
		let axis = new THREE.Vector3(1, 0, 0);
		thePlayer.rotateOnAxis(axis, -rotationAngle);
	}
	
	// make sure sub spotlight stays with the sub
	if(thePlayer.spotlightVisible){
		// reposition spotlight target so that it's slightly below 
		// and forward relative to the front of the sub
		let subForward = getForward(thePlayer); 
		let spotlight = thePlayer.spotlight;
		
		let x = thePlayer.position.x - (subForward.x * 2);
		let y = thePlayer.position.y - 3;
		let z = thePlayer.position.z - (subForward.z * 2);
		
		spotlight.target.position.set(x, y, z);
		
		let pos = getCenter(thePlayer.children[0]);
		spotlight.position.x = pos.x;
		spotlight.position.y = pos.y;
		spotlight.position.z = pos.z;
		
		// see if the spotlight hits the dangerous capsule
		let source = spotlight.position;
		let target = spotlight.target.position;
		let dir = (new THREE.Vector3(target.x - source.x, target.y - source.y, target.z - source.z)).normalize();
		let goalObjectHit = checkGoalObjectHit(source, dir, raycaster, scene);
		if(goalObjectHit){
			if(goalObjectHit.name === "goalObject"){
				let capsuleHit = goalObjectHit;
				if(!capsuleHit.disarmed){
					toggleMessage(
						document.getElementsByTagName('canvas')[0], 
						document.getElementById("disarmMessage"), 
						true
					);
					
					let disarmProgress = document.getElementById("disarmBarContainer");
					let progressBar = disarmProgress.children[0];
					let congratsMsg;
					
					if(keyboard.pressed("space")){
						disarmProgress.style.display = "block";
						let currWidth = parseInt(progressBar.style.width);
						let fullWidth = parseInt(disarmProgress.style.width);

						if(lastTime === 0){
							lastTime = clock.getElapsedTime();
						}
						
						let currTime = clock.getElapsedTime();
						if(currWidth < fullWidth && (currTime - lastTime) > 0.5){
							let newWidth = Math.min(currWidth + 50, fullWidth);
							progressBar.style.width = newWidth + "px";
							lastTime = currTime;
						}else if(currWidth >= fullWidth){
							// disarm successful!
							lastTime = 0;
							disarmProgress.style.display = "none";
							capsuleHit.disarmed = true;
							
							toggleMessage(
								document.getElementsByTagName('canvas')[0], 
								document.getElementById("disarmMessage"), 
								false
							);

							congratsMsg = createCongratsMsg("nice! you disarmed the dangerous capsule!", disarmProgress);
							disarmProgress.parentNode.appendChild(congratsMsg);
							
							setTimeout(function(){
								congratsMsg.style.display = "none";
							}, 2000); // show congrats msg for only 2 sec
						}
					}else{
						disarmProgress.style.display = "none";
						progressBar.style.width = "0px"; // reset to 0 width
						lastTime = 0;
					}
				}else{
					// hide message
					toggleMessage(
						document.getElementsByTagName('canvas')[0], 
						document.getElementById("disarmMessage"), 
						false
					);
				}
			}else if(goalObjectHit.name === "goalObject2"){
				//console.log("sunken ship located!");
				if(!sunkenShip.recovered){
					toggleMessage(
						document.getElementsByTagName('canvas')[0], 
						document.getElementById("sunkenShipMessage"), 
						true
					);
					
					let recoverProgress = document.getElementById("sunkenShipBarContainer");
					let progressBar = recoverProgress.children[0];
					let congratsMsg;
					
					if(keyboard.pressed("space")){
						recoverProgress.style.display = "block";
						let currWidth = parseInt(progressBar.style.width);
						let fullWidth = parseInt(recoverProgress.style.width);

						if(lastTime === 0){
							lastTime = clock.getElapsedTime();
						}
						
						let currTime = clock.getElapsedTime();
						if(currWidth < fullWidth && (currTime - lastTime) > 0.5){
							let newWidth = Math.min(currWidth + 50, fullWidth);
							progressBar.style.width = newWidth + "px";
							lastTime = currTime;
						}else if(currWidth >= fullWidth){
							lastTime = 0;
							recoverProgress.style.display = "none";
							sunkenShip.recovered = true;
							
							toggleMessage(
								document.getElementsByTagName('canvas')[0], 
								document.getElementById("sunkenShipMessage"), 
								false
							);
							
							congratsMsg = createCongratsMsg("great, you recovered the sunken ship!", recoverProgress);
							recoverProgress.parentNode.appendChild(congratsMsg);
							
							setTimeout(function(){
								congratsMsg.style.display = "none";
							}, 2000); // show congrats msg for only 2 sec
						}
					}else{
						recoverProgress.style.display = "none";
						progressBar.style.width = "0px"; // reset to 0 width
						lastTime = 0;
					}
				}else{
					toggleMessage(
						document.getElementsByTagName('canvas')[0], 
						document.getElementById("sunkenShipMessage"), 
						false
					);
				}
			}
		}else{
			// don't show any message text when spotlight no longer on goal object
			// BUG: if spotlight is turned off but text is shown, the text will stay. need to 
			// also turn off any text when spotlight is turned off.
			toggleMessage(
				document.getElementsByTagName('canvas')[0], 
				document.getElementById("disarmMessage"), 
				false
			);
			toggleMessage(
				document.getElementsByTagName('canvas')[0], 
				document.getElementById("sunkenShipMessage"), 
				false
			);
		}
	}
	
	// check for collision?
	// check top, left, right, bottom, front, back? 
	let hasCollision = checkCollision(thePlayer.children[0], raycaster, scene);
	if(!thePlayer.isCollided && hasCollision && hasCollision.name !== "water"){
		
		thePlayer.children[0].material = thePlayer.hitMaterial;

		// decrement player health
		thePlayer.health -= 20;
		thePlayer.isCollided = true;

		if(thePlayer.health >= 0){
			let currHealthBarVal = parseInt(document.getElementById("healthBar").style.width);
			document.getElementById("healthBar").style.width = (200*(thePlayer.health/100)) + "px"; // 200 == default width of the health bar in px
		}else{
			// player dead? or just respawn?
			//document.getElementById("disarmMessage").textContent = "hmm you've appeared to lost too much health so the mothership is calling you back.";
			//document.getElementById("disarmMessage").style.display = "block";
		}
	}else if(hasCollision && thePlayer.isCollided){
		// leave collision material on but don't keep decrementing health if staying in collided position
		thePlayer.isCollided = true;
	}else{
		thePlayer.isCollided = false;
		thePlayer.children[0].material = thePlayer.originalMaterial;
	}
	
	// how about first-person view?
	let relCameraOffset;
	if(!changeCameraView){
		relCameraOffset = new THREE.Vector3(0, 3, 12);
	}else{
		relCameraOffset = new THREE.Vector3(0, 3, -12);
	}
	
	let cameraOffset = relCameraOffset.applyMatrix4(thePlayer.matrixWorld);
	camera.position.x = cameraOffset.x;
	camera.position.y = cameraOffset.y;
	camera.position.z = cameraOffset.z;
	camera.lookAt(thePlayer.position);
}

function animate(){
	//stats.begin();
	//stats.end();
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	update();
}