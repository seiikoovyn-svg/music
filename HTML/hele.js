const base = "https://raw.githubusercontent.com/seiikoovyn-svg/music/main/";

const songInfo = [
  ["Too good to say goodbye", "Bruno Mars", "bruno mars - too good to say goodbye (lyrics).mp3"],
  ["I Think You Were In My Profile Picture Once", "Modern Baseball", "I Think You Were in My Profile Picture Once.mp3"],
  ["Smoking out the window", "Bruno Mars", "Bruno Mars, Anderson .Paak, Silk Sonic - Smokin Out The Window (Lyrics).mp3"],
  ["Dance with Me", "beabadoobee", "beabadoobee - Dance with Me.mp3"],
  ["All i ask", "Adele", "All I Ask.mp3"],
  ["Chimacum Rain", "Linda Perhacs", "Chimacum Rain.mp3"],
  ["Plane Vs. Tank Vs. Submarine", "Tigers Jaw", "Tigers Jaw - Plane vs. Tank vs. Submarine (Official Audio).mp3"],
  ["Sagada", "Cup of Joe", "Sagada - Cup of Joe [Official Lyric Video].mp3"],
  ["Alligator Skin Boots", "McCafferty", "Alligator Skin Boots.mp3"],
  ["ako ang bagyo", "shean", "shean - ako ang bagyo (Lyrics).mp3"],
];

const tracks = songInfo.map(([title, artist, file], i) => ({
  title, artist,
  src: base + encodeURIComponent(file),
  hue: i * 36,
}));

// Which tracks appear in which section of each page
const library = [["All songs", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]];
const pages = {
  home: [["Recently played", [0, 1, 2, 3, 4, 5]], ["Top hits", [4, 5, 6, 7, 8, 9]], ["Featured podcasts", [2, 9, 0, 7]]],
  search: library,
  library: library,
  playlist: [],
};

// ===== STATE =====
const $ = (id) => document.getElementById(id);
const audio = $("audio");
let current = 0, shuffle = false;
let view = "home", query = "", activePlaylist = "";
let playlists = [];
try { playlists = JSON.parse(localStorage.getItem("playlists")) || []; } catch (e) {}
// old saves were plain names, convert them
playlists = playlists.map((p) => (typeof p === "string" ? { name: p, songs: [] } : p));
const save = () => { try { localStorage.setItem("playlists", JSON.stringify(playlists)); } catch (e) {} };

// ===== HELPERS =====
const coverStyle = (t) => `background:linear-gradient(135deg,hsl(${t.hue} 70% 50%),hsl(${t.hue + 50} 70% 25%))`;
const fmt = (s) => isFinite(s) ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") : "0:00";

// ===== DRAW THE PAGE =====
function renderSections() {
  const q = query.toLowerCase();
  let html = "";
  pages[view].forEach(([name, ids]) => {
    const cards = ids
      .filter((i) => (tracks[i].title + " " + tracks[i].artist).toLowerCase().includes(q))
      .map((i) => `
        <div class="card" data-i="${i}">
          <div class="art" style="${coverStyle(tracks[i])}">
            <button class="add" ${view === "playlist" ? `data-remove="${i}" title="Remove from playlist">✕` : `data-add="${i}" title="Add to playlist">＋`}</button>
            <button class="play" aria-label="Play ${tracks[i].title}">▶</button>
          </div>
          <h3>${tracks[i].title}</h3><p>${tracks[i].artist}</p>
        </div>`).join("");
    if (cards) html += `<h2>${name}</h2><div class="cards">${cards}</div>`;
  });
  const empty = view === "playlist" ? "This playlist is empty. Go to Home or Library and press ＋ on a song." : "No songs match your search.";
  $("sections").innerHTML = html || `<p class="muted">${empty}</p>`;
}

function renderPlaylists() {
  $("playlists").innerHTML = playlists.map((p, i) => {
    const on = view === "playlist" && activePlaylist === p.name ? " active" : "";
    return `<li><button class="link${on}" data-p="${i}"><span class="ico">🎵</span><span class="label">${p.name}</span></button></li>`;
  }).join("");
}

function renderQueue() {
  $("queue").innerHTML = tracks.map((t, i) =>
    `<li data-i="${i}" class="${i === current ? "on" : ""}">${t.title}<small>${t.artist}</small></li>`).join("");
}

function show(v, playlistName = "") {
  view = v;
  activePlaylist = playlistName;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const titles = { home: hello, search: "Search", library: "Your library", playlist: playlistName };
  $("heroTitle").textContent = titles[v];
  $("heroText").textContent = v === "home" ? "Featured tracks picked for you." : "";
  document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
  const pl = playlists.find((p) => p.name === playlistName);
  pages.playlist = pl ? [["Songs", pl.songs]] : [];
  $("delPlaylist").hidden = v !== "playlist";
  renderSections();
  renderPlaylists();
}

// ===== PLAYER =====
function load(i, play = true) {
  current = i;
  const t = tracks[i];
  audio.src = t.src;
  $("seek").value = 0;
  $("nowTitle").textContent = $("pTitle").textContent = t.title;
  $("nowArtist").textContent = $("pArtist").textContent = t.artist;
  $("nowCover").style.cssText = $("pCover").style.cssText = coverStyle(t);
  renderQueue();
  if (play) audio.play().catch((e) => alert("Can't play: " + e.message));
}

function randomOther() {
  let n;
  do { n = Math.floor(Math.random() * tracks.length); } while (n === current);
  return n;
}
function next() { load(shuffle ? randomOther() : (current + 1) % tracks.length); }
function prev() {
  if (audio.currentTime > 3) audio.currentTime = 0;
  else load((current - 1 + tracks.length) % tracks.length);
}
function updateMute() { $("muteBtn").textContent = audio.muted || audio.volume === 0 ? "🔇" : "🔊"; }

$("playBtn").onclick = () => (audio.paused ? audio.play() : audio.pause());
$("nextBtn").onclick = next;
$("prevBtn").onclick = prev;
$("shuffleBtn").onclick = () => { shuffle = !shuffle; $("shuffleBtn").classList.toggle("on", shuffle); };
$("loopBtn").onclick = () => { audio.loop = !audio.loop; $("loopBtn").classList.toggle("on", audio.loop); };

audio.addEventListener("play", () => ($("playBtn").textContent = "❚❚"));
audio.addEventListener("pause", () => ($("playBtn").textContent = "▶"));
audio.addEventListener("ended", next);
audio.addEventListener("loadedmetadata", () => ($("seek").max = audio.duration));
audio.addEventListener("timeupdate", () => {
  $("seek").value = audio.currentTime;
  $("elapsed").textContent = fmt(audio.currentTime);
  $("remaining").textContent = "-" + fmt(audio.duration - audio.currentTime);
});
audio.addEventListener("error", () => alert("Audio error. Check the file name or link:\n" + audio.src));

$("seek").oninput = (e) => (audio.currentTime = e.target.value);
$("volume").oninput = (e) => { audio.volume = e.target.value; audio.muted = false; updateMute(); };
$("muteBtn").onclick = () => { audio.muted = !audio.muted; updateMute(); };

// ===== PLAYLISTS =====
function addToPlaylist(i) {
  if (!playlists.length) return alert("Create a playlist first with ＋ Create playlist.");
  const list = playlists.map((p, n) => (n + 1) + ". " + p.name).join("\n");
  const p = playlists[parseInt(prompt("Add to which playlist? Type the number:\n" + list), 10) - 1];
  if (!p) return;
  if (p.songs.includes(i)) return alert("Already in that playlist.");
  p.songs.push(i);
  save();
  alert("Added to " + p.name);
}

// ===== CLICKS =====
$("sections").onclick = (e) => {
  const add = e.target.closest("[data-add]");
  const rem = e.target.closest("[data-remove]");
  if (add) return addToPlaylist(+add.dataset.add);
  if (rem) {
    const pl = playlists.find((p) => p.name === activePlaylist);
    pl.songs = pl.songs.filter((s) => s !== +rem.dataset.remove);
    save();
    return show("playlist", activePlaylist);
  }
  const c = e.target.closest("[data-i]");
  if (c) load(+c.dataset.i);
};
$("queue").onclick = (e) => { const c = e.target.closest("[data-i]"); if (c) load(+c.dataset.i); };

document.querySelectorAll("[data-view]").forEach((b) => {
  b.onclick = () => {
    query = "";
    $("search").value = "";
    show(b.dataset.view);
    if (b.dataset.view === "search") $("search").focus();
  };
});

$("playlists").onclick = (e) => {
  const b = e.target.closest("[data-p]");
  if (b) show("playlist", playlists[b.dataset.p].name);
};

$("newPlaylist").onclick = () => {
  const name = prompt("Playlist name?");
  if (!name || !name.trim()) return;
  playlists.push({ name: name.trim(), songs: [] });
  save();
  renderPlaylists();
};

$("delPlaylist").onclick = () => {
  if (!confirm('Delete "' + activePlaylist + '"?')) return;
  playlists = playlists.filter((p) => p.name !== activePlaylist);
  save();
  show("home");
};

$("search").oninput = (e) => {
  query = e.target.value;
  renderSections();
};

// ===== START =====
show("home");
load(0, false);