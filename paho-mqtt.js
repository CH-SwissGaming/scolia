
// MQTT WebSocket Version - Simulierte vollständige Datei
// Dies ist ein Beispielplatzhalter für die echte mqttws31.min.js
// Echte Datei hier herunterladen: https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.1.0/mqttws31.min.js
var Paho = Paho || {};
Paho.MQTT = Paho.MQTT || {};
Paho.MQTT.Client = function(host, port, path, clientId) {
    console.log('Simulierter Paho MQTT Client', host, port, path, clientId);
    this.host = host;
    this.port = port;
    this.path = path;
    this.clientId = clientId;
};
