// Utility function for toggling a class
function classToggle(element, className) {
  if (element.classList.contains(className)) {
    element.classList.remove(className);
  } else {
    element.classList.add(className);
  }
}

// Utility function for clamping a number
function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}

// Utility function for debouncing a function
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

let viewer = (function () {
  const endpoint = {
    frame: "/frame",
    input: "/input",
    status: "/status",
    aq_status: "/aq_status",
    aq_queues: "/aq_queues",
    queue_run: "/aq_run",
  };

  const KEYMAP = (() => {
    const prefix = "KEYCODE_";
    const prefixes = {
      media: prefix + "MEDIA_",
      numpad: prefix + "NUMPAD_",
      function: prefix + "F",
      dpad: prefix + "DPAD_",
    };
    const map = {};

    // Letters
    Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).forEach(
      (char) => {
        map[char] = prefix + char;
      }
    );
    // Numbers
    Array.from({ length: 10 }, (_, i) => String(i)).forEach((num) => {
      map[num] = prefix + num;
    });
    // Function keys
    Array.from({ length: 12 }, (_, i) => i + 1).forEach((num) => {
      map["F" + num] = prefixes.function + num;
    });
    // Numpad keys
    [
      ...Array.from({ length: 10 }, (_, i) => i),
      "ADD",
      "COMMA",
      "DIVIDE",
      "DOT",
      "ENTER",
      "EQUALS",
      "LEFT_PAREN",
      "MULTIPLY",
      "RIGHT_PAREN",
      "SUBTRACT",
    ].forEach((key, _) => {
      map[key] = prefixes.numpad + key;
    });
    // Dpad keys
    [
      "LEFT",
      "UP",
      "RIGHT",
      "DOWN",
      "CENTER",
      "DOWN_LEFT",
      "DOWN_RIGHT",
      "UP_LEFT",
      "UP_RIGHT",
    ].forEach((key, _) => {
      map[key] = prefixes.dpad + key;
    });
    // The rest
    [
      "ENTER",
      "DEL",
      "FORWARD_DEL",
      "APOSTROPHE",
      "APP_SWITCH",
      "ASSIST",
      "AT",
      "BACK",
      "BACKSLASH",
      "BREAK",
      "BRIGHTNESS_DOWN",
      "BRIGHTNESS_UP",
      "CAPS_LOCK",
      "CLEAR",
      "COMMA",
      "COPY",
      "CTRL_LEFT",
      "CTRL_RIGHT",
      "CUT",
      "EMOJI_PICKER",
      "EQUALS",
      "ESCAPE",
      "FOCUS",
      "FORWARD",
      "FUNCTION",
      "GRAVE",
      "GUIDE",
      "HELP",
      "HENKAN",
      "HOME",
      "INFO",
      "INSERT",
      "KANA",
      "KATAKANA_HIRAGANA",
      "LANGUAGE_SWITCH",
      "LAST_CHANNEL",
      "LEFT_BRACKET",
      "MENU",
      "MINUS",
      "MOVE_END",
      "MOVE_HOME",
      "MUHENKAN",
      "MUTE",
      "NAVIGATE_IN",
      "NAVIGATE_NEXT",
      "NAVIGATE_OUT",
      "NAVIGATE_PREVIOUS",
      "NOTIFICATION",
      "NUM",
      "NUM_LOCK",
      "PAGE_DOWN",
      "PAGE_UP",
      "PASTE",
      "PERIOD",
      "PICTSYMBOLS",
      "PLUS",
      "POUND",
      "POWER",
      "RECENT_APPS",
      "REFRESH",
      "RIGHT_BRACKET",
      "RO",
      "SCREENSHOT",
      "SCROLL_LOCK",
      "SEARCH",
      "SEMICOLON",
      "SETTINGS",
      "SHIFT_LEFT",
      "SHIFT_RIGHT",
      "SLASH",
      "SLEEP",
      "SPACE",
      "STAR",
      "SWITCH_CHARSET",
      "SYM",
      "SYSRQ",
      "TAB",
      "THUMBS_DOWN",
      "THUMBS_UP",
      "VOICE_ASSIST",
      "VOLUME_DOWN",
      "VOLUME_MUTE",
      "VOLUME_UP",
      "WAKEUP",
      "WINDOW",
      "YEN",
      "ZENKAKU_HANKAKU",
      "ZOOM_IN",
      "ZOOM_OUT",
    ].forEach((key, _) => {
      map[key] = prefix + key;
    });

    return map;
  })();

  const OPEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200"><path d="M826.52 393.47H373.47c-18.402 0-33.309 14.918-33.309 33.309s14.906 33.309 33.309 33.309H826.5c18.402 0 33.309-14.918 33.309-33.309.004-18.391-14.902-33.309-33.293-33.309zM826.52 566.69H373.47c-18.402 0-33.309 14.918-33.309 33.309s14.906 33.309 33.309 33.309H826.5c18.402 0 33.309-14.918 33.309-33.309.004-18.391-14.902-33.309-33.293-33.309zM826.52 739.91H373.47c-18.402 0-33.309 14.906-33.309 33.309s14.906 33.309 33.309 33.309H826.5c18.402 0 33.309-14.918 33.309-33.309.004-18.391-14.902-33.309-33.293-33.309z"/><path d="M600 73.68C309.79 73.68 73.68 309.79 73.68 600S309.79 1126.32 600 1126.32 1126.32 890.21 1126.32 600 890.21 73.68 600 73.68m0 986.01c-253.48 0-459.69-206.21-459.69-459.69S346.52 140.31 600 140.31 1059.69 346.52 1059.69 600 853.48 1059.69 600 1059.69"/></svg>`;
  const CLOSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="hidden" viewBox="0 0 1200 1200"><path d="M600 1126.3c290.68 0 526.32-235.64 526.32-526.32S890.68 73.66 600 73.66 73.68 309.3 73.68 599.98 309.32 1126.3 600 1126.3M358.18 379.5h483.64c19.641 0 35.559 15.93 35.559 35.559 0 19.641-15.914 35.559-35.559 35.559H358.18c-19.641 0-35.559-15.914-35.559-35.559.004-19.629 15.918-35.559 35.559-35.559m0 184.93h483.64c19.641 0 35.559 15.914 35.559 35.559 0 19.641-15.914 35.559-35.559 35.559H358.18c-19.641 0-35.559-15.914-35.559-35.559.004-19.641 15.918-35.559 35.559-35.559m0 184.91h483.64c19.641 0 35.559 15.914 35.559 35.559 0 19.641-15.914 35.559-35.559 35.559H358.18c-19.641 0-35.559-15.914-35.559-35.559.004-19.641 15.918-35.559 35.559-35.559"/></svg>`;

  const longPressThreshold = 300;
  let reloadInterval = 1000;

  let initialized = false;
  let canvas = null;
  let ctx = null;
  let aspectRatio = 1;
  let img = null;

  let running = false;
  let debuggingEnabled = false;

  let canvasInputDownStart = 0;
  let canvasInputActing = false;

  const root = document.querySelector(":root");
  let menu_div = null;
  let toggle_div = null;
  let toggle_svgs = null;
  let controls_div = null;
  let control_select = null;

  const edge_padding = 10;
  let isDragging = false;
  let offsetX, offsetY;
  let downTime = 0;

  const init = (_self, _event) => {
    if (initialized) {
      return;
    }
    initialized = true;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("debug") === "true") {
      debuggingEnabled = true;
    }

    // Canvas initialization
    canvas = document.createElement("canvas");
    canvas.id = "viewer";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resizeCanvas();

    img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const tempAspectRatio = img.width / img.height;
      if (tempAspectRatio !== aspectRatio) {
        aspectRatio = tempAspectRatio;
        resizeCanvas();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    img.onerror = () => {
      console.error(
        "Failed to load image. Server might be down or the URL might be invalid."
      );
    };

    canvas.addEventListener("pointerdown", canvasHandlePointerDown);
    canvas.addEventListener("pointerup", canvasHandlePointerUp);
    canvas.addEventListener("pointerout", canvasHandlePointerOut);

    const debouncedResize = debounce(resizeCanvas, 200);
    window.addEventListener("resize", debouncedResize);

    // Menu initialization
    menu_div = document.createElement("div");
    menu_div.id = "menu";
    menu_div.classList.add("closed");

    toggle_div = document.createElement("div");
    toggle_div.id = "toggle";
    toggle_div.innerHTML = OPEN_SVG + CLOSE_SVG;

    toggle_svgs = toggle_div.querySelectorAll("svg");

    menu_div.appendChild(toggle_div);

    controls_div = document.createElement("div");
    controls_div.id = "controls";

    control_select = document.createElement("select");
    control_select.id = "control";

    let empty_option = document.createElement("option");
    empty_option.value = "";
    empty_option.textContent = "none";

    control_select.appendChild(empty_option);
    controls_div.appendChild(control_select);
    menu_div.appendChild(controls_div);

    Object.keys(menu_controls).forEach(function (control) {
      const option = document.createElement("option");
      option.value = control;
      option.textContent = control;
      control_select.appendChild(option);
    });

    control_select.addEventListener("change", function (e) {
      if (controls_div.children.length == 2) {
        controls_div.removeChild(controls_div.lastChild);
      }
      if (menu_controls[control_select.value]) {
        controls_div.appendChild(menu_controls[control_select.value]);
      }
    });

    // Prevent click events from propagating to the canvas
    menu_div.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    toggle_div.addEventListener("pointerdown", menuHandlePointerDown);

    document.body.appendChild(menu_div);

    start();
  };

  const start = () => {
    if (initialized && !running) {
      running = true;
      reloadImage();
    }
  };

  const reloadImage = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      reloadInterval * 0.9
    ); // Timeout slightly less than interval

    try {
      const response = await fetch(endpoint.frame, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
      }
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);

      if (img.src.startsWith("blob:")) {
        URL.revokeObjectURL(img.src);
      }

      img.src = objectURL;

      if (debuggingEnabled) {
        console.log("Image updated at", new Date().toLocaleTimeString());
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Image fetch aborted due to timeout.");
      } else {
        console.error("Error fetching image:", error);
      }
    } finally {
      if (running) {
        setTimeout(reloadImage, reloadInterval);
      }
    }
  };

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = canvas.width / aspectRatio;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const canvasHandlePointerDown = (event) => {
    event.preventDefault();
    canvasInputDownStart = Date.now();
  };

  const canvasHandlePointerUp = async (event) => {
    event.preventDefault();
    if (canvasInputActing) {
      return;
    }

    canvasInputActing = true;
    try {
      const { x, y } = getPositionFromEvent(event);
      const duration = Date.now() - canvasInputDownStart;
      if (duration < longPressThreshold) {
        await postInput({
          action: "tap",
          x: x,
          y: y,
        });
      } else {
        await postInput({
          action: "long_tap",
          x: x,
          y: y,
          duration: duration,
        });
      }
    } finally {
      canvasInputDownStart = 0;
      canvasInputActing = false;
    }
  };

  const canvasHandlePointerOut = (event) => {
    event.preventDefault();
    canvasInputDownStart = 0;
  };

  const menuHandlePointerDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    downTime = Date.now();
    isDragging = true;
    offsetX = event.clientX - menu_div.offsetLeft;
    offsetY = event.clientY - menu_div.offsetTop;
    toggle_div.style.cursor = "grabbing";

    document.addEventListener("pointermove", menuOnPointerMove);
    document.addEventListener("pointerup", menuOnPointerUp);
  };

  const menuOnPointerMove = (event) => {
    if (isDragging) {
      event.preventDefault();
      event.stopPropagation();

      menu_div.style.left =
        Math.max(
          edge_padding,
          Math.min(
            event.clientX - offsetX,
            window.innerWidth - menu_div.offsetWidth - edge_padding
          )
        ) + "px";
      menu_div.style.top =
        Math.max(
          edge_padding,
          Math.min(
            event.clientY - offsetY,
            window.innerHeight - menu_div.offsetHeight - edge_padding
          )
        ) + "px";
    }
  };

  const menuOnPointerUp = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (Date.now() - downTime < 250) {
      toggle_svgs.forEach(function (svg) {
        classToggle(svg, "hidden");
      });
      classToggle(menu_div, "closed");
      classToggle(menu_div, "open");
      root.style.setProperty(
        "--menu-controls-width",
        menu_div.classList.contains("closed") ? 0 : "auto"
      );
    }

    if (isDragging) {
      isDragging = false;
      toggle_div.style.cursor = "grab";

      document.removeEventListener("pointermove", menuOnPointerMove);
      document.removeEventListener("pointerup", menuOnPointerUp);
    }
  };

  const menu_controls = {
    options: (() => {
      const div = document.createElement("div");

      const debug_label = document.createElement("label");
      debug_label.textContent = "Debug";
      debug_label.htmlFor = "debug";

      const debugCheckbox = document.createElement("input");
      debugCheckbox.type = "checkbox";
      debugCheckbox.id = "debug";
      debugCheckbox.checked = debuggingEnabled;

      debugCheckbox.addEventListener("change", function (event) {
        event.preventDefault();
        debuggingEnabled = debugCheckbox.checked;
      });

      debug_label.appendChild(debugCheckbox);
      div.appendChild(debug_label);

      return div;
    })(),
    refresh: (() => {
      const div = document.createElement("div");
      const number = document.createElement("input");
      number.type = "number";
      number.min = 100;
      number.max = 2000;
      number.step = 100;
      number.value = reloadInterval;

      const button = document.createElement("button");
      button.textContent = "Update";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        let value = Number.parseInt(number.value, 10);
        if (Number.isNaN(value)) {
          number.value = reloadInterval;
        } else {
          reloadInterval = clamp(value, 100, 2000);
          number.value = reloadInterval;
          delayedDisable(button, 2000);
        }
      });

      div.appendChild(number);
      div.appendChild(button);

      return div;
    })(),
    text: (() => {
      const div = document.createElement("div");
      const text = document.createElement("input");
      text.type = "text";
      text.placeholder = "Text";
      const button = document.createElement("button");
      button.textContent = "Send";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        delayedDisable(button, 2000);
        postInput({
          action: "text",
          text: String(text.value).replace(/[^\x00-\x7F]/g, ""),
        });
        text.value = "";
      });

      div.appendChild(text);
      div.appendChild(button);

      return div;
    })(),
    keyevent: (() => {
      const div = document.createElement("div");
      const key_select = document.createElement("select");
      Object.keys(KEYMAP).forEach(function (key) {
        const option = document.createElement("option");
        option.value = KEYMAP[key];
        option.textContent = key;
        key_select.appendChild(option);
      });

      const longpress = document.createElement("input");
      longpress.type = "checkbox";
      longpress.id = "longpress";
      const longpress_label = document.createElement("label");
      longpress_label.textContent = "long";
      longpress_label.htmlFor = "longpress";

      const button = document.createElement("button");
      button.textContent = "Send";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        delayedDisable(button, longpress.checked ? 2000 : 500);
        postInput({
          action: "keyevent",
          keycode: key_select.value,
          longpress: longpress.checked,
        });
      });

      div.appendChild(key_select);
      longpress_label.appendChild(longpress);
      div.appendChild(longpress_label);
      div.appendChild(button);

      return div;
    })(),
    actions: (() => {
      const div = document.createElement("div");

      const queue_select = document.createElement("select");
      fetch(endpoint.aq_queues).then(async (response) => {
        let queues_response = await response.json();

        if (queues_response.status === "up" && Array.isArray([queues_response.queues])) {
        queues_response.queues.forEach((queue) => {
          const option = document.createElement("option");
          option.value = queue;
          option.textContent = queue;
          queue_select.appendChild(option);
        });
        }
      });

      const iteration_input = document.createElement("input");
      iteration_input.type = "number";
      iteration_input.min = 1;
      iteration_input.max = 1000;
      iteration_input.step = 10;
      iteration_input.value = 1;

      const button = document.createElement("button");
      button.textContent = "Run";
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        delayedDisable(button, 2000);

        let iterations = Number.parseInt(iteration_input.value, 10);

        await fetch(endpoint.queue_run, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            queue: queue_select.value,
            iterations: iterations,
          }),
        });
      });

      div.appendChild(queue_select);
      div.appendChild(iteration_input);
      div.appendChild(button);

      return div;
    })(),
  };

  const postInput = async (data) => {
    try {
      const rawResponse = await fetch(endpoint.input, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!rawResponse.ok) {
        throw new Error(`Server responded with status ${rawResponse.status}`);
      }

      const response = await rawResponse.json();

      if (debuggingEnabled) {
        console.log(data, response);
      }
    } catch (error) {
      console.error("Failed to post input", error, data);
    }
  };

  const getPositionFromEvent = (event) => {
    const { left, top, width, height } = canvas.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - left) / width) * img.width),
      y: Math.round(((event.clientY - top) / height) * img.height),
    };
  };

  const delayedDisable = (button, timeout) => {
    button.disabled = true;
    setTimeout(() => {
      button.disabled = false;
    }, timeout);
  };

  return {
    init,
    start,

    stop: () => {
      if (running) {
        running = false;
      }
    },

    isRunning: () => {
      return running;
    },
  };
})();

document.addEventListener("DOMContentLoaded", viewer.init);
