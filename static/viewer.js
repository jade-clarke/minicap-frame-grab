DOMTokenList.prototype.toggle = function (token) {
  if (this.contains(token)) {
    this.remove(token);
  } else {
    this.add(token);
  }
};

let viewer = (function () {
  const endpoint = {
    frame: "/frame",
    input: "/input",
    status: "/status",
  };

  const KEYMAP = {
    ENTER: "KEYCODE_ENTER",
    BACKSPACE: "KEYCODE_DEL",
    DEL: "KEYCODE_FORWARD_DEL",
    ARROW_LEFT: "KEYCODE_DPAD_LEFT",
    ARROW_UP: "KEYCODE_DPAD_UP",
    ARROW_RIGHT: "KEYCODE_DPAD_RIGHT",
    ARROW_DOWN: "KEYCODE_DPAD_DOWN",
    0: "KEYCODE_0",
    1: "KEYCODE_1",
    2: "KEYCODE_2",
    3: "KEYCODE_3",
    4: "KEYCODE_4",
    5: "KEYCODE_5",
    6: "KEYCODE_6",
    7: "KEYCODE_7",
    8: "KEYCODE_8",
    9: "KEYCODE_9",
    A: "KEYCODE_A",
    B: "KEYCODE_B",
    C: "KEYCODE_C",
    D: "KEYCODE_D",
    E: "KEYCODE_E",
    F: "KEYCODE_F",
    G: "KEYCODE_G",
    H: "KEYCODE_H",
    I: "KEYCODE_I",
    J: "KEYCODE_J",
    K: "KEYCODE_K",
    L: "KEYCODE_L",
    M: "KEYCODE_M",
    N: "KEYCODE_N",
    O: "KEYCODE_O",
    P: "KEYCODE_P",
    Q: "KEYCODE_Q",
    R: "KEYCODE_R",
    S: "KEYCODE_S",
    T: "KEYCODE_T",
    U: "KEYCODE_U",
    V: "KEYCODE_V",
    W: "KEYCODE_W",
    X: "KEYCODE_X",
    Y: "KEYCODE_Y",
    Z: "KEYCODE_Z",
    F1: "KEYCODE_F1",
    F2: "KEYCODE_F2",
    F3: "KEYCODE_F3",
    F4: "KEYCODE_F4",
    F5: "KEYCODE_F5",
    F6: "KEYCODE_F6",
    F7: "KEYCODE_F7",
    F8: "KEYCODE_F8",
    F9: "KEYCODE_F9",
    F10: "KEYCODE_F10",
    F11: "KEYCODE_F11",
    F12: "KEYCODE_F12",
    APOSTROPHE: "KEYCODE_APOSTROPHE",
    APP_SWITCH: "KEYCODE_APP_SWITCH",
    ASSIST: "KEYCODE_ASSIST",
    AT: "KEYCODE_AT",
    BACK: "KEYCODE_BACK",
    BACKSLASH: "KEYCODE_BACKSLASH",
    BREAK: "KEYCODE_BREAK",
    BRIGHTNESS_DOWN: "KEYCODE_BRIGHTNESS_DOWN",
    BRIGHTNESS_UP: "KEYCODE_BRIGHTNESS_UP",
    CAPS_LOCK: "KEYCODE_CAPS_LOCK",
    CLEAR: "KEYCODE_CLEAR",
    COMMA: "KEYCODE_COMMA",
    COPY: "KEYCODE_COPY",
    CTRL_LEFT: "KEYCODE_CTRL_LEFT",
    CTRL_RIGHT: "KEYCODE_CTRL_RIGHT",
    CUT: "KEYCODE_CUT",
    DPAD_CENTER: "KEYCODE_DPAD_CENTER",
    DPAD_DOWN_LEFT: "KEYCODE_DPAD_DOWN_LEFT",
    DPAD_DOWN_RIGHT: "KEYCODE_DPAD_DOWN_RIGHT",
    DPAD_UP_LEFT: "KEYCODE_DPAD_UP_LEFT",
    DPAD_UP_RIGHT: "KEYCODE_DPAD_UP_RIGHT",
    EMOJI_PICKER: "KEYCODE_EMOJI_PICKER",
    EQUALS: "KEYCODE_EQUALS",
    ESCAPE: "KEYCODE_ESCAPE",
    FOCUS: "KEYCODE_FOCUS",
    FORWARD: "KEYCODE_FORWARD",
    FUNCTION: "KEYCODE_FUNCTION",
    GRAVE: "KEYCODE_GRAVE",
    GUIDE: "KEYCODE_GUIDE",
    HELP: "KEYCODE_HELP",
    HENKAN: "KEYCODE_HENKAN",
    HOME: "KEYCODE_HOME",
    INFO: "KEYCODE_INFO",
    INSERT: "KEYCODE_INSERT",
    KANA: "KEYCODE_KANA",
    KATAKANA_HIRAGANA: "KEYCODE_KATAKANA_HIRAGANA",
    LANGUAGE_SWITCH: "KEYCODE_LANGUAGE_SWITCH",
    LAST_CHANNEL: "KEYCODE_LAST_CHANNEL",
    LEFT_BRACKET: "KEYCODE_LEFT_BRACKET",
    MENU: "KEYCODE_MENU",
    MINUS: "KEYCODE_MINUS",
    MOVE_END: "KEYCODE_MOVE_END",
    MOVE_HOME: "KEYCODE_MOVE_HOME",
    MUHENKAN: "KEYCODE_MUHENKAN",
    MUTE: "KEYCODE_MUTE",
    NAVIGATE_IN: "KEYCODE_NAVIGATE_IN",
    NAVIGATE_NEXT: "KEYCODE_NAVIGATE_NEXT",
    NAVIGATE_OUT: "KEYCODE_NAVIGATE_OUT",
    NAVIGATE_PREVIOUS: "KEYCODE_NAVIGATE_PREVIOUS",
    NOTIFICATION: "KEYCODE_NOTIFICATION",
    NUM: "KEYCODE_NUM",
    NUMPAD_0: "KEYCODE_NUMPAD_0",
    NUMPAD_1: "KEYCODE_NUMPAD_1",
    NUMPAD_2: "KEYCODE_NUMPAD_2",
    NUMPAD_3: "KEYCODE_NUMPAD_3",
    NUMPAD_4: "KEYCODE_NUMPAD_4",
    NUMPAD_5: "KEYCODE_NUMPAD_5",
    NUMPAD_6: "KEYCODE_NUMPAD_6",
    NUMPAD_7: "KEYCODE_NUMPAD_7",
    NUMPAD_8: "KEYCODE_NUMPAD_8",
    NUMPAD_9: "KEYCODE_NUMPAD_9",
    NUMPAD_ADD: "KEYCODE_NUMPAD_ADD",
    NUMPAD_COMMA: "KEYCODE_NUMPAD_COMMA",
    NUMPAD_DIVIDE: "KEYCODE_NUMPAD_DIVIDE",
    NUMPAD_DOT: "KEYCODE_NUMPAD_DOT",
    NUMPAD_ENTER: "KEYCODE_NUMPAD_ENTER",
    NUMPAD_EQUALS: "KEYCODE_NUMPAD_EQUALS",
    NUMPAD_LEFT_PAREN: "KEYCODE_NUMPAD_LEFT_PAREN",
    NUMPAD_MULTIPLY: "KEYCODE_NUMPAD_MULTIPLY",
    NUMPAD_RIGHT_PAREN: "KEYCODE_NUMPAD_RIGHT_PAREN",
    NUMPAD_SUBTRACT: "KEYCODE_NUMPAD_SUBTRACT",
    NUM_LOCK: "KEYCODE_NUM_LOCK",
    PAGE_DOWN: "KEYCODE_PAGE_DOWN",
    PAGE_UP: "KEYCODE_PAGE_UP",
    PASTE: "KEYCODE_PASTE",
    PERIOD: "KEYCODE_PERIOD",
    PICTSYMBOLS: "KEYCODE_PICTSYMBOLS",
    PLUS: "KEYCODE_PLUS",
    POUND: "KEYCODE_POUND",
    POWER: "KEYCODE_POWER",
    RECENT_APPS: "KEYCODE_RECENT_APPS",
    REFRESH: "KEYCODE_REFRESH",
    RIGHT_BRACKET: "KEYCODE_RIGHT_BRACKET",
    RO: "KEYCODE_RO",
    SCREENSHOT: "KEYCODE_SCREENSHOT",
    SCROLL_LOCK: "KEYCODE_SCROLL_LOCK",
    SEARCH: "KEYCODE_SEARCH",
    SEMICOLON: "KEYCODE_SEMICOLON",
    SETTINGS: "KEYCODE_SETTINGS",
    SHIFT_LEFT: "KEYCODE_SHIFT_LEFT",
    SHIFT_RIGHT: "KEYCODE_SHIFT_RIGHT",
    SLASH: "KEYCODE_SLASH",
    SLEEP: "KEYCODE_SLEEP",
    SPACE: "KEYCODE_SPACE",
    STAR: "KEYCODE_STAR",
    SWITCH_CHARSET: "KEYCODE_SWITCH_CHARSET",
    SYM: "KEYCODE_SYM",
    SYSRQ: "KEYCODE_SYSRQ",
    TAB: "KEYCODE_TAB",
    THUMBS_DOWN: "KEYCODE_THUMBS_DOWN",
    THUMBS_UP: "KEYCODE_THUMBS_UP",
    VOICE_ASSIST: "KEYCODE_VOICE_ASSIST",
    VOLUME_DOWN: "KEYCODE_VOLUME_DOWN",
    VOLUME_MUTE: "KEYCODE_VOLUME_MUTE",
    VOLUME_UP: "KEYCODE_VOLUME_UP",
    WAKEUP: "KEYCODE_WAKEUP",
    WINDOW: "KEYCODE_WINDOW",
    YEN: "KEYCODE_YEN",
    ZENKAKU_HANKAKU: "KEYCODE_ZENKAKU_HANKAKU",
    ZOOM_IN: "KEYCODE_ZOOM_IN",
    ZOOM_OUT: "KEYCODE_ZOOM_OUT",
  };

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
  let intervalHandler = null;
  let debug = false;

  let mouseDownStart = 0;
  let mouseActing = false;

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
      debug = true;
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
      console.error("Failed to load image. Server might be down.");
      if (intervalHandler) {
        clearInterval(intervalHandler);
        intervalHandler = null;
        running = false;
      }
    };

    canvas.addEventListener("mousedown", canvas_handlers.handleMouseDown);
    canvas.addEventListener("mouseup", canvas_handlers.handleMouseUp);
    canvas.addEventListener("mouseout", canvas_handlers.handleMouseOut);
    window.addEventListener("resize", resizeCanvas);

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

    toggle_div.addEventListener("mousedown", menuHandleMouseDown);

    document.body.appendChild(menu_div);

    start();
  };

  const start = () => {
    if (initialized && !running) {
      running = true;
      intervalHandler = setInterval(reloadImage, reloadInterval);
      reloadImage();
    }
  };

  const reloadImage = async () => {
    img.src = endpoint.frame;
  };

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = canvas.width / aspectRatio;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const canvas_handlers = {
    handleMouseDown: (event) => {
      event.preventDefault();
      mouseDownStart = Date.now();
    },

    handleMouseUp: async (event) => {
      event.preventDefault();
      if (mouseActing) {
        return;
      }

      mouseActing = true;
      try {
        const { x, y } = getPositionFromEvent(event);
        const duration = Date.now() - mouseDownStart;
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
        mouseDownStart = 0;
        mouseActing = false;
      }
    },

    handleMouseOut: (event) => {
      event.preventDefault();
      mouseDownStart = 0;
    },
  };

  const menuHandleMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    downTime = new Date().getTime();
    isDragging = true;
    offsetX = event.clientX - menu_div.offsetLeft;
    offsetY = event.clientY - menu_div.offsetTop;
    toggle_div.style.cursor = "grabbing";

    document.addEventListener("mousemove", menuOnMouseMove);
    document.addEventListener("mouseup", menuOnMouseUp);
  };

  const menuOnMouseMove = (event) => {
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
  const menuOnMouseUp = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (new Date().getTime() - downTime < 250) {
      toggle_svgs.forEach(function (svg) {
        svg.classList.toggle("hidden");
      });
      menu_div.classList.toggle("closed");
      menu_div.classList.toggle("open");
      root.style.setProperty(
        "--menu-controls-width",
        menu_div.classList.contains("closed") ? 0 : "auto"
      );
    }

    if (isDragging) {
      isDragging = false;
      toggle_div.style.cursor = "grab";

      toggle_div.removeEventListener("mousemove", menuOnMouseMove);
      toggle_div.removeEventListener("mouseup", menuOnMouseUp);
    }
  };

  const menu_controls = {
    text: (() => {
      const div = document.createElement("div");
      const text = document.createElement("input");
      text.type = "text";
      text.placeholder = "Text";
      const button = document.createElement("button");
      button.textContent = "Send";
      button.addEventListener("click", function () {
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
      button.addEventListener("click", function () {
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

      if (debug) {
        console.log(data, response);
      }
    } catch (error) {
      console.error("Failed to post input", error, data);
    }
  };

  const getPositionFromEvent = (event) => {
    return {
      x: Math.round((event.offsetX * img.width) / canvas.width),
      y: Math.round((event.offsetY * img.height) / canvas.height),
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
        clearInterval(intervalHandler);
        intervalHandler = null;
      }
    },

    setDebug: (value) => {
      debug = value;
    },

    setReloadInterval: (value) => {
      if (value > 100 && value < 2000) {
        reloadInterval = value;
        clearInterval(intervalHandler);
        intervalHandler = setInterval(reloadImage, value);
      }
    },

    isRunning: () => {
      return running;
    },
  };
})();

document.addEventListener("DOMContentLoaded", viewer.init);