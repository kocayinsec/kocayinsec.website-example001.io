let lines = [];
let numLines = 5;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector('main'));
  
  // Dark background
  background(10, 14, 27);
  
  // Initialize flowing lines
  for (let i = 0; i < numLines; i++) {
    lines.push(new FlowLine());
  }
}

function draw() {
  // Subtle fade
  fill(10, 14, 27, 25);
  noStroke();
  rect(0, 0, width, height);
  
  // Update and draw all lines
  for (let line of lines) {
    line.update();
    line.display();
  }
}

class FlowLine {
  constructor() {
    this.points = [];
    this.maxPoints = 150;
    this.noiseOffset = random(1000);
    this.speed = random(0.001, 0.003);
    this.amplitude = random(100, 300);
    this.yBase = random(height);
    this.hue = random(180, 200); // Cyan range
    
    // Initialize points
    for (let i = 0; i < this.maxPoints; i++) {
      let x = map(i, 0, this.maxPoints - 1, -50, width + 50);
      this.points.push({
        x: x,
        y: this.yBase
      });
    }
  }
  
  update() {
    this.noiseOffset += this.speed;
    
    // Update each point's y position using Perlin noise
    for (let i = 0; i < this.points.length; i++) {
      let noiseVal = noise(i * 0.02, this.noiseOffset);
      this.points[i].y = this.yBase + map(noiseVal, 0, 1, -this.amplitude, this.amplitude);
    }
    
    // Slowly drift the base position
    this.yBase += sin(this.noiseOffset * 0.5) * 0.2;
    
    // Keep within bounds
    if (this.yBase < -this.amplitude) this.yBase = height + this.amplitude;
    if (this.yBase > height + this.amplitude) this.yBase = -this.amplitude;
  }
  
  display() {
    noFill();
    strokeWeight(2);
    
    // Draw the main line with gradient effect
    for (let i = 0; i < this.points.length - 1; i++) {
      let alpha = map(i, 0, this.points.length - 1, 0, 100);
      stroke(0, 212, 255, alpha);
      line(
        this.points[i].x, 
        this.points[i].y,
        this.points[i + 1].x, 
        this.points[i + 1].y
      );
    }
    
    // Add glow effect
    strokeWeight(4);
    for (let i = 0; i < this.points.length - 1; i++) {
      let alpha = map(i, 0, this.points.length - 1, 0, 30);
      stroke(0, 212, 255, alpha);
      line(
        this.points[i].x, 
        this.points[i].y,
        this.points[i + 1].x, 
        this.points[i + 1].y
      );
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(10, 14, 27);
}

// Mouse interaction
function mouseMoved() {
  for (let line of lines) {
    for (let point of line.points) {
      let d = dist(mouseX, mouseY, point.x, point.y);
      if (d < 100) {
        let force = map(d, 0, 100, 10, 0);
        let angle = atan2(point.y - mouseY, point.x - mouseX);
        point.y += sin(angle) * force;
      }
    }
  }
}