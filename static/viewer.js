let viewer = (function () {
  const endpoint = {
    frame: "/frame",
    input: "/input",
    status: "/status",
  };

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

  const init = (_self, _event) => {
    if (initialized) {
      return;
    }
    initialized = true;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("debug") === "true") {
      debug = true;
    }

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

    canvas.addEventListener("mousedown", handlers.handleMouseDown);
    canvas.addEventListener("mouseup", handlers.handleMouseUp);
    canvas.addEventListener("mouseout", handlers.handleMouseOut);
    window.addEventListener("resize", resizeCanvas);
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

  const handlers = {
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
