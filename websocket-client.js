


function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ===== MQTT Setup =====
const mqttClient = new Paho.MQTT.Client('192.168.178.34', 1884, '/mqtt', 'dartboard_' + Math.random().toString(16).substr(2, 8));

mqttClient.connect({
    userName: "mqtt",
    password: "mqtt",
    onSuccess: () => console.log('✅ MQTT verbunden'),
    onFailure: (e) => console.error('❌ MQTT Verbindung fehlgeschlagen:', e)
});

mqttClient.onConnectionLost = (responseObject) => {
    if (responseObject.errorCode !== 0) {
        console.error('❌ MQTT Verbindung verloren:', responseObject.errorMessage);
    }
};

function publishScoreToMQTT(score) {
    const topic = "homeassistant/sensor/Letzte_Aufnahme/state";
    const message = new Paho.MQTT.Message(score.toString());
    message.destinationName = topic;
    mqttClient.send(message);
    console.log("📤 Punktzahl an HomeAssistant gesendet:", score);
}

// ===== WebSocket Setup =====
const ws = new WebSocket(`wss://game.scoliadarts.com/api/v1/social?serialNumber=${CONFIG.SERIAL_NUMBER}&accessToken=${CONFIG.ACCESS_TOKEN}`);
let throws = [];
let lastScore = '-';
const numbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const startAngleOffset = -Math.PI / 2;

ws.addEventListener('open', () => {
    console.log('✅ WebSocket verbunden');
    getSbcStatus();
    drawDartboard();
    setInterval(getCameraImages, 3000);
});

ws.addEventListener('message', (event) => {
    try {
        const message = JSON.parse(event.data);

        if (message.type === 'CAMERA_IMAGES') {
            updateCameraImages(message.payload.images);
            return;
        }

        console.log('📨 Nachricht erhalten:', event.data);
        const output = document.getElementById('output');
        output.innerHTML += `<p><strong>${message.type}</strong>: ${JSON.stringify(message.payload)}</p>`;
        output.scrollTop = output.scrollHeight;

        if (message.type === 'RESET_PHASE' || message.type === 'TAKEOUT_FINISHED') {
            throws = [];
            lastScore = '-';
            updateScoreDisplay();
            drawDartboard();
        }

        if (message.type === 'THROW_DETECTED') {
            const coordinates = message.payload.coordinates;
            const scoreObj = message.payload.score;
            throws.push(coordinates);
            lastScore = (scoreObj && scoreObj.value) ? (scoreObj.multiplier > 1 ? scoreObj.multiplier + 'x' : '') + scoreObj.value : '-';
            updateScoreDisplay();
            drawAllThrows();

            if (scoreObj && scoreObj.value) {
                const scoreValue = (scoreObj.multiplier > 1 ? scoreObj.multiplier + 'x' : '') + scoreObj.value;
                publishScoreToMQTT(scoreValue);
            }
        }

    } catch (error) {
        console.error('❗ Fehler beim Parsen:', error);
    }
});

function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display');
    scoreDisplay.innerHTML = 'Würfe: ' + throws.length + ' | Letzte Punktzahl: ' + lastScore;
}

function getSbcStatus() { sendMessage({ type: 'GET_SBC_STATUS', id: generateUUID() }); }
function recalibrate() { sendMessage({ type: 'RECALIBRATE', id: generateUUID() }); }
function resetPhase() { sendMessage({ type: 'RESET_PHASE', id: generateUUID() }); }
function getCameraImages() { sendMessage({ type: 'GET_CAMERA_IMAGES', id: generateUUID() }); }

function sendMessage(message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        if (message.type !== 'GET_CAMERA_IMAGES') {
            console.log('📤 Nachricht gesendet:', message);
        }
    } else {
        console.error('🚫 WebSocket nicht verbunden');
    }
}

function updateCameraImages(images) {
    const container = document.getElementById('camera-images');
    container.innerHTML = images.length === 0
        ? "<p>Keine Kamerabilder verfügbar.</p>"
        : images.map(img => `<img src="${img}" onclick="showFullscreen('${img}')">`).join(' ');
}
