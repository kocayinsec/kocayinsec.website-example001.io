// Drift Racing Game - Three.js Implementation
class DriftRacingGame {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.car = null;
        this.skidMarks = [];
        this.obstacles = [];
        this.collectibles = [];
        this.score = 0;
        this.driftScore = 0;
        this.speed = 0;
        this.maxSpeed = 0.5;
        this.acceleration = 0.02;
        this.deceleration = 0.01;
        this.turnSpeed = 0.05;
        this.isDrifting = false;
        this.driftMultiplier = 1;
        this.trail = [];
        this.particles = [];
        this.keys = {};
        this.gameRunning = false;
        this.animationId = null;
        
        this.init();
    }

    init() {
        // Setup Three.js scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000033, 10, 100);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x000033, 0.9);
        this.container.appendChild(this.renderer.domElement);
        
        // Setup lighting
        this.setupLighting();
        
        // Create game elements
        this.createGround();
        this.createCar();
        this.createObstacles();
        this.createCollectibles();
        this.createUI();
        
        // Setup controls
        this.setupControls();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Start game
        this.startGame();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point lights for dramatic effect
        const pointLight1 = new THREE.PointLight(0x00ffff, 1, 50);
        pointLight1.position.set(-20, 10, -20);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff00ff, 1, 50);
        pointLight2.position.set(20, 10, 20);
        this.scene.add(pointLight2);
    }

    createGround() {
        // Create track/ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x111133,
            emissive: 0x000011,
            emissiveIntensity: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add grid for visual effect
        const gridHelper = new THREE.GridHelper(100, 50, 0x00ffff, 0x003366);
        this.scene.add(gridHelper);
        
        // Create track boundaries
        this.createTrackBoundaries();
    }

    createTrackBoundaries() {
        const boundaryGeometry = new THREE.BoxGeometry(2, 5, 100);
        const boundaryMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        // Left boundary
        const leftBoundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        leftBoundary.position.set(-50, 2.5, 0);
        leftBoundary.castShadow = true;
        this.scene.add(leftBoundary);
        
        // Right boundary
        const rightBoundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        rightBoundary.position.set(50, 2.5, 0);
        rightBoundary.castShadow = true;
        this.scene.add(rightBoundary);
    }

    createCar() {
        const carGroup = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0066,
            emissive: 0xff0066,
            emissiveIntensity: 0.2
        });
        const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.position.y = 0.5;
        carBody.castShadow = true;
        carGroup.add(carBody);
        
        // Car roof
        const roofGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x220033 
        });
        const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
        carRoof.position.y = 1.2;
        carRoof.position.z = -0.5;
        carGroup.add(carRoof);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333 
        });
        
        const wheelPositions = [
            { x: -1, y: 0.3, z: 1.5 },
            { x: 1, y: 0.3, z: 1.5 },
            { x: -1, y: 0.3, z: -1.5 },
            { x: 1, y: 0.3, z: -1.5 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos.x, pos.y, pos.z);
            carGroup.add(wheel);
        });
        
        // Headlights
        const headlightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headlightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.8
        });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.6, 0.5, 2);
        carGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.6, 0.5, 2);
        carGroup.add(rightHeadlight);
        
        carGroup.position.y = 0.5;
        this.car = carGroup;
        this.scene.add(this.car);
    }

    createObstacles() {
        const obstacleGeometry = new THREE.ConeGeometry(1.5, 3, 6);
        const obstacleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        
        for (let i = 0; i < 10; i++) {
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            obstacle.position.set(
                (Math.random() - 0.5) * 80,
                1.5,
                (Math.random() - 0.5) * 80
            );
            obstacle.castShadow = true;
            this.obstacles.push(obstacle);
            this.scene.add(obstacle);
        }
    }

    createCollectibles() {
        const collectibleGeometry = new THREE.OctahedronGeometry(1, 0);
        
        for (let i = 0; i < 15; i++) {
            const collectibleMaterial = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
                emissive: new THREE.Color().setHSL(Math.random(), 1, 0.5),
                emissiveIntensity: 0.5
            });
            
            const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
            collectible.position.set(
                (Math.random() - 0.5) * 80,
                2,
                (Math.random() - 0.5) * 80
            );
            collectible.userData.collected = false;
            this.collectibles.push(collectible);
            this.scene.add(collectible);
        }
    }

    createSkidMark(position) {
        const markGeometry = new THREE.PlaneGeometry(0.5, 2);
        const markMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const skidMark = new THREE.Mesh(markGeometry, markMaterial);
        skidMark.position.copy(position);
        skidMark.position.y = 0.01;
        skidMark.rotation.x = -Math.PI / 2;
        skidMark.rotation.z = this.car.rotation.y;
        
        this.skidMarks.push(skidMark);
        this.scene.add(skidMark);
        
        // Remove old skid marks
        if (this.skidMarks.length > 100) {
            const oldMark = this.skidMarks.shift();
            this.scene.remove(oldMark);
        }
    }

    createParticle(position, color) {
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: color || 0x00ffff,
            transparent: true,
            opacity: 1
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        particle.life = 1;
        
        this.particles.push(particle);
        this.scene.add(particle);
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.position.add(particle.velocity);
            particle.velocity.y -= 0.01;
            particle.life -= 0.02;
            particle.material.opacity = particle.life;
            particle.scale.setScalar(particle.life);
            
            if (particle.life <= 0) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Start game on first key press
            if (!this.gameRunning && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
                this.gameRunning = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Touch controls for mobile
        this.setupTouchControls();
    }

    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            this.gameRunning = true;
        });
        
        this.container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Simulate key presses based on touch
            this.keys['arrowup'] = deltaY < -20;
            this.keys['arrowdown'] = deltaY > 20;
            this.keys['arrowleft'] = deltaX < -20;
            this.keys['arrowright'] = deltaX > 20;
        });
        
        this.container.addEventListener('touchend', () => {
            this.keys = {};
        });
    }

    updateCar() {
        if (!this.gameRunning) return;
        
        // Handle input
        if (this.keys['w'] || this.keys['arrowup']) {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed / 2);
        }
        
        // Natural deceleration
        if (!this.keys['w'] && !this.keys['arrowup'] && !this.keys['s'] && !this.keys['arrowdown']) {
            if (this.speed > 0) {
                this.speed = Math.max(this.speed - this.deceleration, 0);
            } else if (this.speed < 0) {
                this.speed = Math.min(this.speed + this.deceleration, 0);
            }
        }
        
        // Turning
        if (this.speed !== 0) {
            if (this.keys['a'] || this.keys['arrowleft']) {
                this.car.rotation.y += this.turnSpeed * (this.speed > 0 ? 1 : -1);
                if (Math.abs(this.speed) > 0.2) {
                    this.isDrifting = true;
                }
            }
            if (this.keys['d'] || this.keys['arrowright']) {
                this.car.rotation.y -= this.turnSpeed * (this.speed > 0 ? 1 : -1);
                if (Math.abs(this.speed) > 0.2) {
                    this.isDrifting = true;
                }
            }
        }
        
        // Update position
        this.car.position.x += Math.sin(this.car.rotation.y) * this.speed;
        this.car.position.z += Math.cos(this.car.rotation.y) * this.speed;
        
        // Keep car in bounds
        this.car.position.x = Math.max(-45, Math.min(45, this.car.position.x));
        this.car.position.z = Math.max(-45, Math.min(45, this.car.position.z));
        
        // Drifting effects
        if (this.isDrifting && Math.abs(this.speed) > 0.2) {
            this.createSkidMark(this.car.position);
            this.driftScore += 1 * this.driftMultiplier;
            
            // Create drift particles
            if (Math.random() > 0.7) {
                this.createParticle(
                    new THREE.Vector3(
                        this.car.position.x + (Math.random() - 0.5) * 2,
                        0.5,
                        this.car.position.z + (Math.random() - 0.5) * 2
                    ),
                    0xffaa00
                );
            }
            
            this.driftMultiplier = Math.min(this.driftMultiplier + 0.01, 5);
        } else {
            this.isDrifting = false;
            this.driftMultiplier = Math.max(this.driftMultiplier - 0.05, 1);
        }
        
        // Camera follow
        this.updateCamera();
    }

    updateCamera() {
        const cameraOffset = new THREE.Vector3(0, 15, 20);
        const desiredCameraPosition = this.car.position.clone().add(cameraOffset);
        
        // Smooth camera movement
        this.camera.position.lerp(desiredCameraPosition, 0.1);
        this.camera.lookAt(this.car.position);
    }

    checkCollisions() {
        // Check obstacle collisions
        this.obstacles.forEach(obstacle => {
            const distance = this.car.position.distanceTo(obstacle.position);
            if (distance < 3) {
                // Bounce effect
                this.speed *= -0.5;
                this.score = Math.max(0, this.score - 50);
                
                // Create impact particles
                for (let i = 0; i < 10; i++) {
                    this.createParticle(obstacle.position.clone(), 0xff0000);
                }
            }
        });
        
        // Check collectible collisions
        this.collectibles.forEach(collectible => {
            if (!collectible.userData.collected) {
                const distance = this.car.position.distanceTo(collectible.position);
                if (distance < 3) {
                    collectible.userData.collected = true;
                    this.scene.remove(collectible);
                    this.score += 100;
                    
                    // Create collection particles
                    for (let i = 0; i < 20; i++) {
                        this.createParticle(collectible.position.clone(), collectible.material.color);
                    }
                }
            }
        });
    }

    createUI() {
        const uiContainer = document.createElement('div');
        uiContainer.id = 'game-ui';
        uiContainer.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            font-family: 'Inter', sans-serif;
            font-size: 18px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 100;
        `;
        
        uiContainer.innerHTML = `
            <div style="margin-bottom: 10px;">Score: <span id="score">0</span></div>
            <div style="margin-bottom: 10px;">Drift: <span id="drift-score">0</span></div>
            <div style="margin-bottom: 10px;">Multiplier: <span id="multiplier">1.0</span>x</div>
            <div style="margin-bottom: 10px; color: #00ffff;">Speed: <span id="speed">0</span></div>
        `;
        
        this.container.appendChild(uiContainer);
        
        // Instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            background: rgba(0,0,0,0.5);
            padding: 10px 20px;
            border-radius: 10px;
            border: 1px solid rgba(0,212,255,0.3);
        `;
        
        instructions.innerHTML = `
            <div>🎮 Controls: W/↑ = Accelerate | S/↓ = Brake | A/← D/→ = Turn</div>
            <div style="margin-top: 5px;">🏁 Drift to earn points! Collect gems and avoid obstacles!</div>
        `;
        
        this.container.appendChild(instructions);
    }

    updateUI() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('drift-score').textContent = Math.floor(this.driftScore);
        document.getElementById('multiplier').textContent = this.driftMultiplier.toFixed(1);
        document.getElementById('speed').textContent = Math.abs(Math.floor(this.speed * 100));
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update game elements
        this.updateCar();
        this.checkCollisions();
        this.updateParticles();
        
        // Animate collectibles
        this.collectibles.forEach(collectible => {
            if (!collectible.userData.collected) {
                collectible.rotation.y += 0.05;
                collectible.rotation.x += 0.02;
                collectible.position.y = 2 + Math.sin(Date.now() * 0.002 + collectible.position.x) * 0.5;
            }
        });
        
        // Animate obstacles
        this.obstacles.forEach((obstacle, i) => {
            obstacle.rotation.y += 0.02;
            obstacle.position.y = 1.5 + Math.sin(Date.now() * 0.001 + i) * 0.3;
        });
        
        // Update score over time
        if (this.gameRunning) {
            this.score += 0.1;
        }
        
        // Update UI
        this.updateUI();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }

    startGame() {
        this.gameRunning = false;
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clean up Three.js resources
        this.scene.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
        
        // Remove UI elements
        const ui = document.getElementById('game-ui');
        if (ui) ui.remove();
    }
}

// Export for use in main page
window.DriftRacingGame = DriftRacingGame;