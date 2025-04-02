const m1 = 1.0;
const m2 = 0.5;
let m3 = 0.2;
const L1 = 1.0;
let L3 = 0.5;
const g = 9.81;
const beta = 0.5;

let d = 0.5;
let phi = Math.PI / 4;
let theta = Math.PI / 4;
let omega = 0.0;
let isRunning = false;
let isDragging = false;
let animationFrameId;

const canvas = document.getElementById('pendulumCanvas');
const ctx = canvas.getContext('2d');
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const centerX = canvasWidth / 2;
const centerY = canvasHeight / 2;

const energyChart = document.getElementById('energyChart');
let energyData = {
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    name: 'Energy'
};
Plotly.newPlot(energyChart, [energyData], {
    title: 'Energy',
    xaxis: { title: 'Time (s)' },
    yaxis: { title: 'Potential Energy (J)' }
});

function calculateInertia(d, phi) {
    const I1 = (1 / 12) * m1 * L1 ** 2;
    const I2 = m2 * L1 ** 2;
    const I3 = m3 * (d ** 2 + L3 ** 2 + 2 * d * L3 * Math.cos(phi));
    return I1 + I2 + I3;
}

function calculateCenterOfMass(theta, d, phi) {
    const x_cm = (m1 * (L1 / 2) * Math.sin(theta) + m2 * L1 * Math.sin(theta) + m3 * (d * Math.sin(theta) + L3 * Math.sin(theta + phi))) / (m1 + m2 + m3);
    const y_cm = (-m1 * (L1 / 2) * Math.cos(theta) - m2 * L1 * Math.cos(theta) - m3 * (d * Math.cos(theta) + L3 * Math.cos(theta + phi))) / (m1 + m2 + m3);
    return { x: x_cm, y: y_cm };
}

function pendulumEq(theta, omega, d, phi) {
    const I = calculateInertia(d, phi);
    const { x: x_cm, y: y_cm } = calculateCenterOfMass(theta, d, phi);
    const tau = -(m1 * g * (L1 / 2) + m2 * g * L1 + m3 * g * d) * Math.sin(theta) - m3 * g * L3 * Math.sin(theta + phi);
    const dtheta_dt = omega;
    const domega_dt = (tau - beta * omega) / I;
    return { dtheta_dt, domega_dt };
}

function drawPendulum(theta, d, phi) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const x1 = L1 * Math.sin(theta);
    const y1 = L1 * Math.cos(theta);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + x1 * 100, centerY + y1 * 100);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    const x2 = d * Math.sin(theta);
    const y2 = d * Math.cos(theta);
    const x3 = x2 + L3 * Math.sin(theta + phi);
    const y3 = y2 + L3 * Math.cos(theta + phi);
    ctx.beginPath();
    ctx.moveTo(centerX + x2 * 100, centerY + y2 * 100);
    ctx.lineTo(centerX + x3 * 100, centerY + y3 * 100);
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX + x1 * 100, centerY + y1 * 100, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#00f';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX + x3 * 100, centerY + y3 * 100, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f0';
    ctx.fill();
}

function updateAnimation() {
    if (!isRunning) return;

    const dt = 0.01;
    const { dtheta_dt, domega_dt } = pendulumEq(theta, omega, d, phi);
    theta += dtheta_dt * dt;
    omega += domega_dt * dt;

    drawPendulum(theta, d, phi);

    const { y: y_cm } = calculateCenterOfMass(theta, d, phi);
    const potentialEnergy = (m1 + m2 + m3) * g * y_cm;
    energyData.x.push(energyData.x.length);
    energyData.y.push(potentialEnergy);
    Plotly.update(energyChart, { x: [energyData.x], y: [energyData.y] }, {});

    if (Math.abs(omega) < 0.001 && Math.abs(dtheta_dt) < 0.001) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
    } else {
        animationFrameId = requestAnimationFrame(updateAnimation);
    }
}

function calculateThetaFromMouse(x, y) {
    const dx = x - centerX;
    const dy = y - centerY;
    return Math.atan2(dx, -dy);
}

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    isDragging = true;
    isRunning = false;
    theta = calculateThetaFromMouse(mouseX, mouseY);
    drawPendulum(theta, d, phi);
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        theta = calculateThetaFromMouse(mouseX, mouseY);
        drawPendulum(theta, d, phi);
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        isRunning = true;
        updateAnimation();
    }
});

canvas.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        isRunning = true;
        updateAnimation();
    }
});

document.getElementById('startButton').addEventListener('click', () => {
    isRunning = true;
    updateAnimation();
});

document.getElementById('stopButton').addEventListener('click', () => {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
});

document.getElementById('restartButton').addEventListener('click', () => {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    theta = Math.PI / 4;
    omega = 0.0;
    energyData.x = [];
    energyData.y = [];
    Plotly.update(energyChart, { x: [energyData.x], y: [energyData.y] }, {});
    drawPendulum(theta, d, phi);
});

document.getElementById('positionSlider').addEventListener('input', (event) => {
    d = (event.target.value / 100) * L1;
});

document.getElementById('angleSlider').addEventListener('input', (event) => {
    phi = (event.target.value * Math.PI) / 180;
});

document.getElementById('lengthSlider').addEventListener('input', (event) => {
    L3 = parseFloat(event.target.value);
});

document.getElementById('massSlider').addEventListener('input', (event) => {
    m3 = parseFloat(event.target.value);
});

drawPendulum(theta, d, phi);
