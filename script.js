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
    videoId: videoId,
    playerVars: {
      playsinline: 1
    },
    events: {
      onReady: () => {

 // Auto mute
    player.mute();

// Request 720p
    player.setPlaybackQuality('hd720');


 // change timething    

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
  const input = document.getElementById('urlInput').value.trim();
  if (!input || !player) return;

  const videoId = extractVideoId(input);

  player.loadVideoById(videoId);

  // ✅ force mute again
  player.mute();

  // update URL without reload
  history.replaceState(null, '', `?v=${videoId}`);
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
})



// ==== something new ====
function seekBy(seconds) {
  if (!player) return;

  const current = player.getCurrentTime();
  const target = Math.max(0, current + seconds);
  player.seekTo(target, true);
}

// === fullscreen ===
function togglePageFullscreen() {
  const container = document.getElementById("player-container");

  if (!document.fullscreenElement) {
    container.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

;
