let particles = [];
let noiseScale = 0.01;
let flowField;
let cols, rows;
let zoff = 0;
let inc = 0.1;
let scl = 10;
let particleAlpha = 5;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-2');
  
  colorMode(HSB, 360, 100, 100, 100);
  background(230, 30, 10);
  
  cols = floor(width / scl);
  rows = floor(height / scl);
  flowField = new Array(cols * rows);
  
  for (let i = 0; i < 2000; i++) {
    particles[i] = new Particle();
  }
}

function draw() {
  if (frameCount % 60 === 0) {
    background(230, 30, 10, 20);
  }
  
  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      let angle = noise(xoff, yoff, zoff) * TWO_PI * 2;
      let v = p5.Vector.fromAngle(angle);
      v.setMag(0.5);
      flowField[index] = v;
      xoff += inc;
    }
    yoff += inc;
  }
  zoff += 0.003;
  
  for (let particle of particles) {
    particle.follow(flowField);
    particle.update();
    particle.edges();
    particle.show();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(230, 30, 10);
  cols = floor(width / scl);
  rows = floor(height / scl);
  flowField = new Array(cols * rows);
}

class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 2;
    this.prevPos = this.pos.copy();
    
    this.hue = random(200, 260);
    this.sat = random(20, 60);
    this.bright = random(80, 100);
  }
  
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
  
  follow(vectors) {
    let x = floor(this.pos.x / scl);
    let y = floor(this.pos.y / scl);
    let index = x + y * cols;
    let force = vectors[index];
    if (force) {
      this.applyForce(force);
    }
  }
  
  applyForce(force) {
    this.acc.add(force);
  }
  
  show() {
    stroke(this.hue, this.sat, this.bright, particleAlpha);
    strokeWeight(1);
    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    this.updatePrev();
  }
  
  updatePrev() {
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
  }
  
  edges() {
    if (this.pos.x > width) {
      this.pos.x = 0;
      this.updatePrev();
    }
    if (this.pos.x < 0) {
      this.pos.x = width;
      this.updatePrev();
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
      this.updatePrev();
    }
    if (this.pos.y < 0) {
      this.pos.y = height;
      this.updatePrev();
    }
  }
}

function mouseMoved() {
  let mouseInfluence = 50;
  for (let particle of particles) {
    let d = dist(mouseX, mouseY, particle.pos.x, particle.pos.y);
    if (d < mouseInfluence) {
      let angle = atan2(particle.pos.y - mouseY, particle.pos.x - mouseX);
      let force = p5.Vector.fromAngle(angle);
      force.mult(2);
      particle.applyForce(force);
    }
  }
}