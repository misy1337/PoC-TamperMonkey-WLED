// ==UserScript==
// @name         Autodarts Game Shot message on finished leg
// @version      0.2
// @description  Changes the yellow player card on a finished game to black and adds a glowing animated rainbow border and a "Game Shot!" caption
// @author       dotty-dev
// @license      MIT
// @match        *://play.autodarts.io/*
// @namespace    https://greasyfork.org/en/users/913506-dotty-dev
// ==/UserScript==
/*jshint esversion: 11 */
(function () {
  "use strict";

  let str = ""; // Define str outside of the WebSocket function

  // Change to your WLED IP
  const wLedIP = "192.168.178.101";

  const wsUrl = `ws://${wLedIP}/ws`;
  const ws = new WebSocket(wsUrl);
  ws.binaryType = "arraybuffer";

  let prevRgb = ""; // Variable zum Speichern des vorherigen RGB-Werts
  ws.addEventListener("message", (e) => {
    try {
      if (toString.call(e.data) === "[object ArrayBuffer]") {
        let leds = new Uint8Array(event.data);
        if (leds[0] != 76) return; //'L'
        str = "linear-gradient(45deg,";
        let len = leds.length;
        let start = leds[1] == 2 ? 4 : 2; // 1 = 1D, 2 = 1D/2D (leds[2]=w, leds[3]=h)
        for (let i = start; i < len; i += 3) {
          // Überprüfen, ob der aktuelle RGB-Wert mit dem vorherigen übereinstimmt
          const currentRgb = `${leds[i]}, ${leds[i + 1]}, ${leds[i + 2]}`;
          if (currentRgb !== prevRgb) {
            str += `rgb(${leds[i]},${leds[i + 1]},${leds[i + 2]})`;
            if (i < len - 3) str += ",";
          }
          prevRgb = currentRgb; // Aktualisieren des vorherigen RGB-Werts
        }
        str += ");";
        console.error(str);
        //document.body.style.background = str; // Hintergrund des Body-Elements anpassen
      }
    } catch (err) {
      console.error("Peek WS error:", err);
    }
  });

  ws.onopen = function (event) {
    //console.log('WebSocket connection opened');
    // Request WLED Live Stream
    ws.send(JSON.stringify({ lv: true }));
  };

  let observerNotRunning = true;
  const documentObserver = new MutationObserver((mutationRecords) => {
    mutationRecords.forEach((record) => {
      if (
        record.target.classList.contains("css-1lua7td") ||
        (record.target.classList.contains("css-k008qs") &&
          observerNotRunning)
      ) {
        startObserver();
      }
    });
  });

  documentObserver.observe(document, {
    childList: true,
    attributes: true,
    subtree: true,
    attributeFilter: ["class"],
  });

  const startObserver = () => {
    if (document.querySelectorAll(".observer-running").length === 0) {
      document.head.insertAdjacentHTML(
        "beforeend",
        /*html*/ `
          <style>
            .game-shot-animation {
              position: relative;
            }

            .game-shot-animation .css-1memit {
                margin: 0
            }

            .game-shot-animation .css-x3m75h {
                font-size: 4.4em;
                line-height: 1;
            }

            .game-shot-animation > div:first-child {
              background: linear-gradient(0deg, #000, #272727);
            }

            .game-shot-animation:before,
            .game-shot-animation:after {
              content: "";
              position: absolute;
              left: -2px;
              top: -2px;
              background: ${str}
              background-size: 400%;
              width: calc(100% + 4px);
              height: calc(100% + 4px);
              z-index: -1;
              animation: steam 20s linear infinite;
              border-radius: 5px;
            }

            @keyframes steam {
              0% {
                background-position: 0 0;
              }
              50% {
                background-position: 400% 0;
              }
              100% {
                background-position: 0 0;
              }
            }

            .game-shot-animation:after {
              filter: blur(50px);
            }
          </style>
              `
      );

      let winnerCardEl = undefined;
      const gameShotMessageElement = document.createElement("p");
      gameShotMessageElement.classList.add("css-x3m75h");
      gameShotMessageElement.classList.add("game-shot-message");
      gameShotMessageElement.textContent = "Game Shot!";

      const gameShotObserver = new MutationObserver((mutationRecords) => {
        mutationRecords.forEach((mutation) => {
          if (
            winnerCardEl &&
            mutation.target.classList.contains("css-1acvlgt")
          ) {
            winnerCardEl?.classList.remove("game-shot-animation");
            winnerCardEl = undefined;
            gameShotMessageElement.remove();
          }
          if (mutation.target?.classList?.contains("css-e9w8hh")) {
            winnerCardEl = mutation.target.closest(".css-3dp02s");
            winnerCardEl?.classList.add("game-shot-animation");
            mutation.target
              .querySelector(".css-x3m75h")
              .insertAdjacentElement("afterend", gameShotMessageElement);
          }
        });
      });
      if (document.querySelector(".css-1iy3ld1")) {
        gameShotObserver.observe(document.querySelector(".css-1iy3ld1"), {
          childList: true,
          attributes: true,
          attributeFilter: ["class"],
          subtree: true,
        });
        document
          .querySelector(".css-k008qs")
          .insertAdjacentHTML(
            "beforeend",
            /*html*/ `<div class="observer-running"></div>`
          );
      }
    }
  };
})();
