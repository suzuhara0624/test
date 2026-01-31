let player;

const DEFAULT_VIDEO_ID = "zeGYRwOJOho";

// ================= URL helpers =================
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ================= YouTube API =================
function onYouTubeIframeAPIReady() {
  const videoId = getQueryParam("v") || DEFAULT_VIDEO_ID;
  const timeParam = getQueryParam("t");

  player = new YT.Player("player", {
    height: "428",
    width: "761",
    videoId: videoId,
    playerVars: {
      playsinline: 1
    },
    events: {
      onReady: () => {
        if (timeParam) {
          const seconds = parseTime(timeParam);
          if (seconds !== null) {
            player.seekTo(seconds, true);
          }
        }
      }
    }
  });
}

// ================= Time helpers =================
function parseTime(str) {
  const parts = str.split(":").map(Number);
  if (parts.some(isNaN)) return null;

  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

function jumpTime() {
  const t = document.getElementById("timeInput").value.trim();
  const seconds = parseTime(t);
  if (seconds !== null && player) {
    player.seekTo(seconds, true);
  }
}

// ================= Video change =================
function extractVideoId(input) {
  const match = input.match(/[?&]v=([^&]+)/);
  if (match) return match[1];

  const short = input.match(/youtu\.be\/([^?]+)/);
  if (short) return short[1];

  return input;
}

function changeVideo() {
  const input = document.getElementById("urlInput").value.trim();
  if (!input || !player) return;

  const videoId = extractVideoId(input);
  player.loadVideoById(videoId);
  history.replaceState(null, "", `?v=${videoId}`);
}

// ================= Fullscreen + rotate =================
function requestLandscape() {
  if (screen.orientation?.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }
}

function unlockOrientation() {
  if (screen.orientation?.unlock) {
    screen.orientation.unlock();
  }
}

document.addEventListener("fullscreenchange", () => {
  document.fullscreenElement ? requestLandscape() : unlockOrientation();
});

// ================= Gestures =================
const playerEl = document.getElementById("player");

let tapCount = 0;
let tapTimer = null;
let longPressTimer = null;
let startX = 0;
let startY = 0;
let startTime = 0;

// Touch start
playerEl.addEventListener("touchstart", (e) => {
  if (!player) return;

  const t = e.touches[0];
  startX = t.clientX;
  startY = t.clientY;
  startTime = player.getCurrentTime();

  longPressTimer = setTimeout(() => {
    player.setPlaybackRate(2);
  }, 500);
});

// Touch end
playerEl.addEventListener("touchend", (e) => {
  if (!player) return;

  clearTimeout(longPressTimer);
  player.setPlaybackRate(1);

  tapCount++;

  if (!tapTimer) {
    tapTimer = setTimeout(() => {
      const touch = e.changedTouches[0];
      const screenW = window.innerWidth;
      const current = player.getCurrentTime();

      if (tapCount === 2) {
        // Double tap ±5s
        touch.clientX < screenW / 2
          ? player.seekTo(Math.max(0, current - 5), true)
          : player.seekTo(current + 5, true);
      }

      if (tapCount === 3) {
        // Triple tap ±30s
        touch.clientX < screenW / 2
          ? player.seekTo(Math.max(0, current - 30), true)
          : player.seekTo(current + 30, true);
      }

      tapCount = 0;
      tapTimer = null;
    }, 300);
  }
});

// Swipe handling
playerEl.addEventListener("touchmove", (e) => {
  if (!player) return;

  const t = e.touches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;

  // Horizontal swipe → seek
  if (Math.abs(dx) > Math.abs(dy)) {
    player.seekTo(startTime + dx / 10, true);
  }

  // Vertical swipe → volume
  if (Math.abs(dy) > Math.abs(dx)) {
    const vol = player.getVolume();
    const newVol = Math.min(100, Math.max(0, vol - dy / 5));
    player.setVolume(newVol);
  }
});
