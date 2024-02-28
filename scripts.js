// ==UserScript==
// @name         WLED WebSocket Access (Combined Hex)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Access WLED WebSocket when Autodarts website is opened (with Combined Hex LED values)
// @author       Your Name
// @match        https://play.autodarts.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Change to your WLED IP
    const wLedIP = "192.168.178.100"

    const wsUrl = `ws://${wLedIP}/ws`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    // Array zum Speichern der kombinierten Hex-Werte der LEDs. Kann später fürs CSS verwendet werden.
    let combinedHexValues = [];

    ws.onopen = function(event) {
        //console.log('WebSocket connection opened');
        // Request WLED Live Stream
        ws.send(JSON.stringify({ "lv": true }));
    };

    // Ereignisbehandlungsfunktion für den Empfang von Nachrichten vom Server
    ws.onmessage = function(event) {
        //console.log('Message received from server:', event.data);
        // Die Antwort vom Websocket ist ein Array welches jeweils 3 Werte pro LED enthält.
        // Das Array muss zuerst umgewandelt werden und im Anschluss konvertieren wir die RGB Werte zu Hex werten.
        // Nun müssen wir noch sicherstellen, dass wir die Werte zusammen fügen
        const uint8Data = new Uint8Array(event.data);
        //console.log('Received data:', uint8Data);
        const hexValues = convertToHex(uint8Data);
        //console.log('Hex values:', hexValues);
        combinedHexValues = combineHexValues(hexValues);
        console.log('Combined hex values:', combinedHexValues);
    };

    // Ereignisbehandlungsfunktion für das Schließen der WebSocket-Verbindung
    // Muss noch implementiert werden
    ws.onclose = function(event) {
        //console.log('WebSocket connection closed');
    };

    // Ereignisbehandlungsfunktion für Fehler in der WebSocket-Verbindung
    // Muss noch implementiert werden
    ws.onerror = function(event) {
        //console.error('WebSocket error:', event);
    };

    // Funktion zum Konvertieren der Zahlen in Hexadezimalwerte
    function convertToHex(data) {
        const hexValues = [];
        for (let i = 0; i < data.length; i++) {
            hexValues.push(data[i].toString(16));
        }
        return hexValues;
    }

    // Funktion zum Kombinieren der Hexadezimalwerte der LEDs
    function combineHexValues(hexValues) {
        const combinedHex = [];
        for (let i = 0; i < hexValues.length; i += 3) {
            // Wir müssen hier sicherstellen, dass jeder Wert 3 Stellen hat sonst kommt Mist raus
            const red = addLeadingZero(hexValues[i]);
            const green = addLeadingZero(hexValues[i + 1]);
            const blue = addLeadingZero(hexValues[i + 2]);
            const combined = red + green + blue;
            combinedHex.push(combined);
        }
        return combinedHex;
    }

    // Funktion zum Hinzufügen führender Nullen
    function addLeadingZero(value) {
        return String(value).padStart(2, '0');
    }

})();
