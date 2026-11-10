
const base = "https://raw.githubusercontent.com/seiikoovyn-svg/music/main/";

const songInfo = [
  ["Too Good To Say Goodbye", "Bruno Mars", "bruno mars - too good to say goodbye (lyrics).mp3", "bruno.jpg"],
  ["I Think You Were In My Profile Picture Once", "Modern Baseball", "I Think You Were in My Profile Picture Once.mp3", "mobo.jpg"],
  ["Smoking Out The Window", "Bruno Mars", "Bruno Mars, Anderson .Paak, Silk Sonic - Smokin Out The Window (Lyrics).mp3", "smoke.jpg"],
  ["Dance With Me", "beabadoobee", "beabadoobee - Dance with Me.mp3", "beabasta.jpg"],
  ["All I Ask", "Adele", "All I Ask.mp3", "adili.jpg"],
  ["Chimacum Rain", "Linda Perhacs", "Chimacum Rain.mp3", "bastakato.jpg"],
  ["Plane Vs. Tank Vs. Submarine", "Tigers Jaw", "Tigers Jaw - Plane vs. Tank vs. Submarine (Official Audio).mp3", "tank.jpg"],
  ["Sagada", "Cup of Joe", "Sagada - Cup of Joe [Official Lyric Video].mp3", "isagadmo.jpg"],
  ["Alligator Skin Boots", "McCafferty", "Alligator Skin Boots.mp3", "alligator.png"],
  ["Ako Ang Bagyo", "shean", "shean - ako ang bagyo (Lyrics).mp3", "storm.jpg"],
];

const tracks = songInfo.map(([title, artist, file, cover], i) => ({
  title,
  artist,
  src: base + encodeURIComponent(file),
  cover: base + encodeURIComponent(cover),
  hue: i * 36,
}));

// Which tracks appear in which section of each page
const library = [["All songs", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]];

const pages = {
  home: [
    ["Recently played", [0, 1, 2, 3, 4, 5]],
    ["Top hits", [4, 5, 6, 7, 8, 9]],
    ["Featured podcasts", [2, 9, 0, 7]]
  ],
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

try {
  playlists = JSON.parse(localStorage.getItem("playlists")) || [];
} catch (e) {}

// old saves were plain names, convert them
playlists = playlists.map((p) =>
  typeof p === "string" ? { name: p, songs: [] } : p
);

const save = () => {
  try {
    localStorage.setItem("playlists", JSON.stringify(playlists));
  } catch (e) {}
};

// ===== HELPERS =====
const coverStyle = (t) =>
  `background-color:hsl(${t.hue} 70% 30%);`;

const fmt = (s) =>
  isFinite(s)
    ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0")
    : "0:00";

// ===== DRAW THE PAGE =====
function renderSections() {
  const q = query.toLowerCase();
  let html = "";

  pages[view].forEach(([name, ids]) => {
    const cards = ids
      .filter((i) =>
        (tracks[i].title + " " + tracks[i].artist)
          .toLowerCase()
          .includes(q)
      )
      .map((i) => `
        <div class="card" data-i="${i}">
          <div class="art" style="background-image:url('${tracks[i].cover}'); background-size:cover; background-position:center; ${coverStyle(tracks[i])}">
            <button class="add" ${view === "playlist"
              ? `data-remove="${i}" title="Remove from playlist">✕`
              : `data-add="${i}" title="Add to playlist">＋`}</button>
            <button class="play" aria-label="Play ${tracks[i].title}">▶</button>
          </div>
          <h3>${tracks[i].title}</h3>
          <p>${tracks[i].artist}</p>
        </div>
      `).join("");

    if (cards) {
      html += `<h2>${name}</h2><div class="cards">${cards}</div>`;
    }
  });

  const empty = view === "playlist"
    ? "This playlist is empty. Go to Home or Library and press ＋ on a song."
    : "No songs match your search.";

  $("sections").innerHTML = html || `<p class="muted">${empty}</p>`;
}

function renderPlaylists() {
  $("playlists").innerHTML = playlists.map((p, i) => {
    const on =
      view === "playlist" && activePlaylist === p.name ? " active" : "";

    return `
      <li>
        <button class="link${on}" data-p="${i}">
          <span class="ico">🎵</span>
          <span class="label">${p.name}</span>
        </button>
      </li>
    `;
  }).join("");
}

function renderQueue() {
  $("queue").innerHTML = tracks.map((t, i) =>
    `<li data-i="${i}" class="${i === current ? "on" : ""}">
      ${t.title}
      <small>${t.artist}</small>
    </li>`
  ).join("");
}

function show(v, playlistName = "") {
  view = v;
  activePlaylist = playlistName;

  const hour = new Date().getHours();

  const hello = hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";

  const titles = {
    home: hello,
    search: "Search",
    library: "Your library",
    playlist: playlistName
  };

  $("heroTitle").textContent = titles[v];
  $("heroText").textContent =
    v === "home" ? "Featured tracks picked for you." : "";

  document.querySelectorAll("[data-view]").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === v)
  );

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
  if ($("lyricsScreen").classList.contains("show")) {
  updateLyrics();
  }

  audio.src = t.src;

  $("seek").value = 0;

  $("nowTitle").textContent = $("pTitle").textContent = t.title;
  $("nowArtist").textContent = $("pArtist").textContent = t.artist;

  // Album covers: Now Playing and bottom player
  $("nowCover").style.cssText =
    `background-image:url('${t.cover}');
     background-size:cover;
     background-position:center;
     background-color:hsl(${t.hue} 70% 30%);`;

  $("pCover").style.cssText =
    `background-image:url('${t.cover}');
     background-size:cover;
     background-position:center;
     background-color:hsl(${t.hue} 70% 30%);`;

  renderQueue();

  if (play) {
    audio.play().catch((e) =>
      alert("Can't play: " + e.message)
    );
  }
}

function randomOther() {
  let n;

  do {
    n = Math.floor(Math.random() * tracks.length);
  } while (n === current);

  return n;
}

function next() {
  load(shuffle ? randomOther() : (current + 1) % tracks.length);
}

function prev() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    load((current - 1 + tracks.length) % tracks.length);
  }
}

function updateMute() {
  $("muteBtn").textContent =
    audio.muted || audio.volume === 0 ? "🔇" : "🔊";
}

$("playBtn").onclick = () =>
  audio.paused ? audio.play() : audio.pause();

$("nextBtn").onclick = next;
$("prevBtn").onclick = prev;

$("shuffleBtn").onclick = () => {
  shuffle = !shuffle;
  $("shuffleBtn").classList.toggle("on", shuffle);
};

$("loopBtn").onclick = () => {
  audio.loop = !audio.loop;
  $("loopBtn").classList.toggle("on", audio.loop);
};

audio.addEventListener("play", () =>
  $("playBtn").textContent = "❚❚"
);

audio.addEventListener("pause", () =>
  $("playBtn").textContent = "▶"
);

audio.addEventListener("ended", next);

audio.addEventListener("loadedmetadata", () =>
  $("seek").max = audio.duration
);

audio.addEventListener("timeupdate", () => {
  $("seek").value = audio.currentTime;
  $("elapsed").textContent = fmt(audio.currentTime);
  $("remaining").textContent =
    "-" + fmt(audio.duration - audio.currentTime);
});

audio.addEventListener("error", () =>
  alert("Audio error. Check the file name or link:\n" + audio.src)
);

$("seek").oninput = (e) =>
  audio.currentTime = e.target.value;

$("volume").oninput = (e) => {
  audio.volume = e.target.value;
  audio.muted = false;
  updateMute();
};

$("muteBtn").onclick = () => {
  audio.muted = !audio.muted;
  updateMute();
};

// ===== PLAYLISTS =====
function addToPlaylist(i) {
  if (!playlists.length) {
    return alert("Create a playlist first with ＋ Create playlist.");
  }

  const list = playlists
    .map((p, n) => (n + 1) + ". " + p.name)
    .join("\n");

  const p = playlists[
    parseInt(prompt("Add to which playlist? Type the number:\n" + list), 10) - 1
  ];

  if (!p) return;

  if (p.songs.includes(i)) {
    return alert("Already in that playlist.");
  }

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

    pl.songs = pl.songs.filter(
      (s) => s !== +rem.dataset.remove
    );

    save();

    return show("playlist", activePlaylist);
  }

  const c = e.target.closest("[data-i]");

  if (c) load(+c.dataset.i);
};

$("queue").onclick = (e) => {
  const c = e.target.closest("[data-i]");
  if (c) load(+c.dataset.i);
};

document.querySelectorAll("[data-view]").forEach((b) => {
  b.onclick = () => {
    query = "";
    $("search").value = "";

    show(b.dataset.view);

    if (b.dataset.view === "search") {
      $("search").focus();
    }
  };
});

$("playlists").onclick = (e) => {
  const b = e.target.closest("[data-p]");

  if (b) {
    show("playlist", playlists[b.dataset.p].name);
  }
};

$("newPlaylist").onclick = () => {
  const name = prompt("Playlist name?");

  if (!name || !name.trim()) return;

  playlists.push({
    name: name.trim(),
    songs: []
  });

  save();
  renderPlaylists();
};

$("delPlaylist").onclick = () => {
  if (!confirm('Delete "' + activePlaylist + '"?')) return;

  playlists = playlists.filter(
    (p) => p.name !== activePlaylist
  );

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

// ===== LYRICS FEATURE =====

// Add each song's lyrics here.
// Leave empty until you add your own lyrics.

const songLyrics = [
  // Too Good To Say Goodbye  
[
  { time: 14.05, text: "I've made mistakes" },
  { time: 20.13, text: "I could have treated you better" },
  { time: 26.15, text: "I let you get away" },
  { time: 31.82, text: "There goes my happily-ever-after" },
  { time: 36.12, text: "Tell me, why, why can't we try and start again?" },
  { time: 45.21, text: "This can't be how our story ends" },
  { time: 51.32, text: "You're more than my girl, you're my best friend" },
  { time: 57.60, text: "Tell me you remember when, ooh" },
  { time: 62.50, text: "I was your man and you were my girl" },
  { time: 65.30, text: "It was you and me against the world, baby" },
  { time: 68.85, text: "Ain't nobody gonna love me like the way you do" },
  { time: 74.60, text: "And you ain't never gonna find a love like mine" },
  { time: 79.56, text: "Tell me, what can I do to make it up to you?" },
  { time: 86.97, text: "'Cause what we got's too good to say goodbye, goodbye" },
  { time: 97.94, text: "Yeah, I'm still in love with you, darlin'" },
  { time: 104.15, text: "I know you feel the same, oh" },
  { time: 109.52, text: "What's the point of both of us being broken-hearted?" },
  { time: 115.49, text: "I pray it's never too late" },
  { time: 119.42, text: "So tell me, why, why can't we try and start again?" },
  { time: 129.19, text: "This can't be how our story ends" },
  { time: 135.36, text: "You're more than my girl, you're my best friend" },
  { time: 141.88, text: "Tell me you remember when" },
  { time: 146.48, text: "I was your man and you were my girl" },
  { time: 149.15, text: "It was you and me against the world, baby" },
  { time: 153.06, text: "Ain't nobody gonna love me like the way you do" },
  { time: 158.72, text: "And you ain't never gonna find a love like mine" },
  { time: 163.79, text: "Tell me, what can I do to make it up to you?" },
  { time: 170.94, text: "'Cause what we got's too good to say goodbye, goodbye, oh" },
  { time: 181.00, text: "(Don't you give up)" },
  { time: 182.27, text: "Girl, won't you listen?" },
  { time: 184.12, text: "(Don't you give up)" },
  { time: 184.84, text: "It's you that I'm missin'" },
  { time: 187.15, text: "(Don't you give up)" },
  { time: 187.79, text: "Take my hand, I wanna go, I wanna go (all the way)" },
  { time: 193.85, text: "If we're gonna fight this fight for better days" },
  { time: 199.58, text: "I know we're gonna make it" },
  { time: 202.06, text: "This is the chance, let's take it, baby" },
  { time: 205.98, text: "Ain't nobody gonna love me like the way you do (whoo! No, no, no)" },
  { time: 212.25, text: "And you ain't never gonna find a love like mine" },
  { time: 216.70, text: "(Ooh) tell me, what can I do to make it up to you?" },
  { time: 224.58, text: "'Cause what we got's too good to say goodbye (c'mon, c'mon, c'mon)" },
  { time: 230.88, text: "Goodbye (oh, baby, baby)" },
  { time: 234.36, text: "Ain't nobody gonna love me like the way you do (no, nobody, baby)" },
  { time: 240.19, text: "And you ain't never gonna find a love like mine" },
  { time: 244.76, text: "(Oh) tell me, what can I do to make it up to you?" },
  { time: 252.79, text: "'Cause what we got's too good to say goodbye, goodbye" }
],

  // I Think You Were In My Profile Picture Once
  
[
  { time: 6.61, text: "I saw you from the bottom of the stairs, before you knew I was coming" },
  { time: 15.27, text: "And though nervous and scared, I lingered on" },
  { time: 23.23, text: "I heard most things break by the ends of these types of nights" },
  { time: 28.64, text: "So I'll force upon every word I've brushed up on" },
  { time: 35.58, text: "Since knowing we won't speak like this again" },
  { time: 40.61, text: "You got a certain who knows what about you" },
  { time: 44.88, text: "And I got a small amount of time" },
  { time: 49.50, text: "To figure out what it is exactly and to whom does it apply" },
  { time: 56.31, text: "But I know for a fact that these are broken nights" },
  { time: 61.82, text: "Covered in bottles with the stench of a loss of life" },
  { time: 66.82, text: "And I know that it's quite heartbreaking" },
  { time: 70.89, text: "We won't speak like this again" }
],

  "", // Smoking Out The Window
  
  // Dance With Me
  
[
  { time: 0.73, text: "If you wanna dance then" },
  { time: 7.09, text: "Dance with me" },
  { time: 19.85, text: "It's pretty fast but" },
  { time: 25.71, text: "This is what you do at parties, right" },
  { time: 37.15, text: "And I know it's hard to tell" },
  { time: 45.48, text: "But I think I really like you" },
  { time: 63.42, text: "Just take it slow" },
  { time: 69.33, text: "And move your feet to the beat" },
  { time: 82.09, text: "'Cause if we dance then" },
  { time: 88.85, text: "You don't have to speak" },
  { time: 99.68, text: "And I know it's hard to tell" },
  { time: 107.94, text: "But I think I really like you" }
],

  // All I Ask
  
[
  { time: 13.90, text: "I will leave my heart at the door" },
  { time: 19.94, text: "I won't say a word" },
  { time: 23.88, text: "They've all been said before, you know" },
  { time: 27.03, text: "So why don't we just play pretend" },
  { time: 33.06, text: "Like we're not scared of what is coming next" },
  { time: 37.24, text: "Or scared of having nothing left" },
  { time: 40.67, text: "Look, don't get me wrong" },
  { time: 44.13, text: "I know there is no tomorrow" },
  { time: 50.76, text: "All I ask is" },
  { time: 54.45, text: "If this is my last night with you" },
  { time: 64.39, text: "Hold me like I'm more than just a friend" },
  { time: 70.27, text: "Give me a memory I can use" },
  { time: 77.83, text: "Take me by the hand while we do what lovers do" },
  { time: 86.21, text: "It matters how this ends" },
  { time: 91.36, text: "'Cause what if I never love again?" },
  { time: 108.44, text: "I don't need your honesty" },
  { time: 114.05, text: "It's already in your eyes" },
  { time: 117.82, text: "And I'm sure my eyes, they speak for me" },
  { time: 122.06, text: "No one knows me like you do" },
  { time: 127.34, text: "And since you're the only one that mattered" },
  { time: 131.36, text: "Tell me who do I run to?" },
  { time: 135.21, text: "Look, don't get me wrong" },
  { time: 138.07, text: "I know there is no tomorrow" },
  { time: 145.47, text: "All I ask is" },
  { time: 149.00, text: "If this is my last night with you" },
  { time: 158.79, text: "Hold me like I'm more than just a friend" },
  { time: 164.85, text: "Give me a memory I can use" },
  { time: 172.40, text: "Take me by the hand while we do what lovers do" },
  { time: 180.74, text: "It matters how this ends" },
  { time: 185.91, text: "'Cause what if I never love again?" },
  { time: 191.92, text: "Let this be our lesson in love" },
  { time: 198.55, text: "Let this be the way we remember us" },
  { time: 205.06, text: "I don't wanna be cruel or vicious" },
  { time: 212.53, text: "And I ain't asking for forgiveness" },
  { time: 216.58, text: "All I ask is" },
  { time: 219.77, text: "If this is my last night with you" },
  { time: 229.78, text: "Hold me like I'm more than just a friend" },
  { time: 235.88, text: "Give me a memory I can use" },
  { time: 243.54, text: "Take me by the hand while we do what lovers do" },
  { time: 251.68, text: "It matters how this ends" },
  { time: 256.85, text: "'Cause what if I never love again?" }
],

 // Chimacum Rain

  
[
  { time: 11.43, text: "And it rains here" },
  { time: 14.86, text: "Every day since I came" },
  { time: 18.52, text: "And the lichen covers rocks" },
  { time: 21.56, text: "And the green hides everything" },
  { time: 24.15, text: "Chimacum rain" },
  { time: 26.33, text: "And the rain, and the rain, and the rain (rain)" },
  { time: 31.91, text: "And the rain, and the rain, and the rain (rain)" },
  { time: 35.21, text: "Down around you" },
  { time: 37.70, text: "Down around you" },
  { time: 43.96, text: "Chimacum rain" },
  { time: 53.16, text: "In the soak of leaves" },
  { time: 56.61, text: "And needle tufts and foam" },
  { time: 59.89, text: "In the grasses and the reeds" },
  { time: 62.90, text: "And the spilling over stones" },
  { time: 65.36, text: "Chimacum rain" },
  { time: 67.90, text: "And the rain, and the rain, and the rain (rain)" },
  { time: 72.00, text: "And the rain, and the rain, and the rain (rain)" },
  { time: 76.61, text: "Down around you" },
  { time: 79.27, text: "Down around you" },
  { time: 86.67, text: "Chimacum rain" },
  { time: 95.06, text: "I'm spacing out (spacing out, spacing out and down)" },
  { time: 101.58, text: "I'm seeing silences between leaves" },
  { time: 110.85, text: "I'm seeing down (seeing down, seeing down and down)" },
  { time: 117.12, text: "I'm seeing silences that are here (he belongs here)" },
  { time: 127.44, text: "Can't have him (he belongs here)" },
  { time: 134.24, text: "Can't know him" },
  { time: 137.06, text: "He belongs here" },
  { time: 157.85, text: "It kinda gets inside you" },
  { time: 161.18, text: "The silences I mean" },
  { time: 164.61, text: "They kinda wrap around you" },
  { time: 167.56, text: "And loosen everything" },
  { time: 170.06, text: "Chimacum rain" },
  { time: 172.14, text: "And the rain, and the rain, and the rain (rain)" },
  { time: 177.58, text: "And the rain, and the rain, and the rain (rain)" },
  { time: 180.72, text: "Down around you" },
  { time: 183.75, text: "Down around you" },
  { time: 190.72, text: "Chimacum rain" }
],

  // Plane Vs. Tank Vs. Submarine

  
[
  { time: 6.75, text: "Lie to me like you used to" },
  { time: 12.90, text: "Tell me everything is how it should be" },
  { time: 17.60, text: "Lie to me. Did you have to?" },
  { time: 23.46, text: "'Cause in the end it never matters what I think" },
  { time: 31.36, text: "And I can barely tell the sky from the shoreline" },
  { time: 36.83, text: "And I can see myself reflected in your eyes" },
  { time: 41.69, text: "And this was all a dream" },
  { time: 43.84, text: "And it's coming back to me" },
  { time: 46.79, text: "A portrait in gray scale" },
  { time: 49.36, text: "A perfect betrayal" },
  { time: 52.31, text: "And I can't even breathe" },
  { time: 54.77, text: "With this weighing on my chest" },
  { time: 57.30, text: "You knew me at my best" },
  { time: 59.87, text: "Now I can't even stand on my own" }
],

  // Sagada

  
[
  { time: 18.81, text: "Balang-araw ay kakayanin ko ring" },
  { time: 27.97, text: "Makita na ikaw ay wala na sa 'king piling" },
  { time: 37.34, text: "Kahit na mahirap kalimutan ang lahat ng alaala" },
  { time: 46.36, text: "Iyong tandaan na ako'y masayang ika'y malaya na" },
  { time: 54.79, text: "Ako ay pipikit" },
  { time: 58.06, text: "Hihinga nang malalim" },
  { time: 60.18, text: "Sa huli ay bibitaw" },
  { time: 66.75, text: "Sagada, kung sa'n lahat ay isinigaw" },
  { time: 71.91, text: "Sa langit na ikaw ay muling matanaw" },
  { time: 76.20, text: "Sagada, ang tagpuan kung sa'n itinakdang magwakas" },
  { time: 82.01, text: "Ang kwento ng ako at ikaw" },
  { time: 86.89, text: "Ikaw ang natitirang takbuhan" },
  { time: 94.92, text: "Ng pusong ligaw at giniginaw" },
  { time: 104.27, text: "Bawat ngiting sa aki'y tumatak" },
  { time: 108.72, text: "Ang kapalit ay mga luhang pumapatak" },
  { time: 116.90, text: "Ako'y nawawasak" },
  { time: 121.99, text: "Ako ay pipikit" },
  { time: 124.79, text: "Hihinga nang malalim" },
  { time: 127.22, text: "Sa huli ay bibitaw" },
  { time: 134.13, text: "Sagada, kung sa'n lahat ay isinigaw" },
  { time: 138.88, text: "Sa langit na ikaw ay muling matanaw" },
  { time: 143.27, text: "Sagada, ang tagpuan kung sa'n itinakdang magwakas" },
  { time: 149.17, text: "Ang kwento ng ako at ikaw" },
  { time: 153.71, text: "Ikaw ang natitirang takbuhan" },
  { time: 161.40, text: "Ng pusong ligaw at giniginaw" },
  { time: 189.51, text: "Sagada, kung sa'n ikaw ay bumitaw" },
  { time: 194.08, text: "Kung sa'n binulong ang lahat ng sigaw" },
  { time: 198.85, text: "Sagada, kung sa'n lilimutin ang sakit" },
  { time: 203.10, text: "Na dulot ng iyong pag-alis" },
  { time: 207.88, text: "Sagada, kung sa'n lahat ay isinigaw (ay isinigaw)" },
  { time: 212.66, text: "Sa langit na ikaw ay muling matanaw (muling matanaw)" },
  { time: 217.30, text: "Sagada, ang tagpuan kung sa'n itinakdang magwakas (paalam na, paalam na)" },
  { time: 222.75, text: "Ang kwento ng ako at ikaw (ako ay bibitaw na)" },
  { time: 227.47, text: "Ikaw ang natitirang takbuhan" },
  { time: 235.62, text: "Ng pusong ligaw at giniginaw" },
  { time: 244.38, text: "Sagada..." }
],


  // Alligator Skin Boots

  
  [
    { time: 0.58, text: "I'm fucking beyond hope." },
    { time: 1.44, text: "[Intro]" },
    { time: 18.27, text: "And the pastor says I'm good" },
    { time: 21.70, text: "But Jesus Christ I'm never good" },
    { time: 24.74, text: "I'll nail my hands up to the wall" },
    { time: 27.87, text: "I'll nail my hands up to the wall" },
    { time: 31.30, text: "And yeah the pastor says I'm good" },
    { time: 34.70, text: "But Jesus Christ I'm never good" },
    { time: 37.95, text: "I'll nail my hands up to the wall" },
    { time: 41.45, text: "I'll nail my hands up to the wall" },
    { time: 44.88, text: "And yeah, the doctors were nice enough" },
    { time: 47.64, text: "They just said I'm fucked" },
    { time: 49.40, text: "Just like my mom is fucked" },
    { time: 50.99, text: "I bet your dad's fucked up" },
    { time: 52.85, text: "And in the black light, I could tell a sick joke" },
    { time: 56.13, text: "Maybe in the black light, I could tell a sick joke" },
    { time: 59.39, text: "Twinkle Twinkle little star, alcoholics don't get far" },
    { time: 62.98, text: "Unless they drink and drive" },
    { time: 64.16, text: "Let's go for a ride" },
    { time: 65.72, text: "And I hope, I crash and die tonight" },
    { time: 69.44, text: "I hope I crash and die tonight" },
    { time: 72.70, text: "Saying, I do not like you" },
    { time: 76.65, text: "I do not mind him much" },
    { time: 80.72, text: "You were just my first" },
    { time: 84.15, text: "Now I've had" },
    { time: 86.36, text: "I'm cold to the touch" },
    { time: 88.37, text: "Leap to my death" },
    { time: 90.12, text: "I'll die for my friends" },
    { time: 91.88, text: "I'll lie to the end" },
    { time: 93.35, text: "I'm cool to the touch" },
    { time: 95.34, text: "Leap to my death" },
    { time: 96.85, text: "I'll die for you all" },
    { time: 98.72, text: "I'll die for my friends" },
    { time: 100.44, text: "It goes like this" },
    { time: 103.53, text: "Well I ain't sorry" },
    { time: 107.06, text: "With broken wrists" },
    { time: 110.72, text: "I climb from these walls" },
    { time: 115.05, text: "🎵🎵" },
    { time: 124.97, text: "My skin crawls" },
    { time: 129.67, text: "My skin crawls" },
    { time: 135.00, text: "My..." }
  ],

  // Ako ang Bagyo
  
[
  { time: 26.01, text: "Pinaikutan mo 'ko, sumunod mundo ko nahilo" },
  { time: 31.90, text: "Hindi ko inakalang lalaki" },
  { time: 37.50, text: "Bumigat ang kalungkutan, mga luha 'di napigilan" },
  { time: 43.10, text: "Hanggang ngayo'y bumubuhos pa'rin" },
  { time: 50.56, text: "Matakot na kayo" },
  { time: 55.67, text: "Ako, ako ang bagyo" },
  { time: 59.92, text: "Kulimlim ng langit sa inyong dalawa" },
  { time: 65.32, text: "Bulong ko sa hangin, 'Sana 'di kayo masaya'" },
  { time: 71.29, text: "Sa tibay ng bahay na titirhan niyo" },
  { time: 76.74, text: "Tatangayin ko bawat yero" },
  { time: 81.83, text: "Dahil ako, ako ang bagyo" },
  { time: 91.51, text: "Itinago na litrato, kunwaring hindi ko nakita" },
  { time: 97.57, text: "Takot ka sigurong masalanta ko siya" },
  { time: 102.84, text: "Tingin mo ba 'di ko kaya? Gusto mo na gusto kita" },
  { time: 108.87, text: "Tinatali mo 'ko sa pag-asa" },
  { time: 115.88, text: "Matakot na kayo" },
  { time: 120.62, text: "Ako, ako, ako ang bagyo" },
  { time: 125.84, text: "Kulimlim ng langit sa inyong dalawa" },
  { time: 131.22, text: "Bulong ko sa hangin, 'Sana 'di kayo masaya'" },
  { time: 136.99, text: "Sa tibay ng bahay na titirhan niyo" },
  { time: 142.90, text: "Tatangayin ko bawat yero" },
  { time: 148.42, text: "Dilim ng paligid buhos ng emosyon" },
  { time: 154.27, text: "Tunog ng pag-ibig sa sama ng panahon" },
  { time: 160.05, text: "Sa tibay ng bahay na titirhan niyo" },
  { time: 165.90, text: "Gigibain ko mga pader niyo" },
  { time: 170.83, text: "Dahil ako, ako ang bagyo" },
  { time: 185.37, text: "Lahat ng hahawakan ko lagi sa'kin na lumalayo" },
  { time: 191.02, text: "Lahat ng tao na nariyan, sa tuwing lalapit ay nasasaktan" },
  { time: 196.99, text: "At pag nag-sawa na sila sa akin, pag wala na sa'kin na nakatingin" },
  { time: 203.54, text: "Pag hindi na'ko nakakatawa, ako yung lagi na naiiwan mag-isa" },
  { time: 208.35, text: "Kahit pa na subukan ko ang lahat ng makakaya ko" },
  { time: 211.88, text: "Hindi pa rin naman 'yon sapat kung iisipin mo" },
  { time: 214.42, text: "Walang lalapit kung puro lang sugat ang matatamo nila" },
  { time: 219.53, text: "At sa tagal ko na binitbit ang bigat nitong pag-ibig ko" },
  { time: 222.98, text: "Konting galaw mo lang ay kidlat na 'gad sa dibdib ko" },
  { time: 225.75, text: "'Di ko naman gusto na saktan kita" },
  { time: 227.79, text: "Kaya mag-ingat ka" },
  { time: 230.82, text: "Ako ang" },
  { time: 234.12, text: "Kulimlim ng langit sa inyong dalawa" },
  { time: 239.91, text: "Bulong ko sa hangin, 'Sana 'di kayo masaya'" },
  { time: 245.41, text: "Sa tibay ng bahay na titirhan niyo" },
  { time: 251.38, text: "Tatangayin ko bawat yero" },
  { time: 256.99, text: "Kahit pa matunaw ako" },
  { time: 262.16, text: "Dahil ako, ako ang bagyo" }
],

];




function updateLyrics() {
  const t = tracks[current];

  $("lyricsTitle").textContent = t.title;
  $("lyricsArtist").textContent = t.artist;

  $("lyricsCover").style.backgroundImage =
    `url("${t.cover}")`;

  const box = $("lyricsText");
  const lyrics = songLyrics[current];

  box.innerHTML = "";

  if (Array.isArray(lyrics)) {
    if (lyrics.length === 0) {
      box.textContent = "Lyrics haven't been added yet. 🎵";
      return;
    }

    lyrics.forEach((line) => {
      const div = document.createElement("div");
      div.className = "lyric-line";
      div.textContent = line.text;

      div.onclick = () => {
      audio.currentTime = line.time;
      audio.play();
};

      box.appendChild(div);
    });

  } else {
    box.textContent =
      (lyrics || "").trim() ||
      "Lyrics haven't been added yet. 🎵";
  }
  
  activeLyricIndex = -1;
  syncLyrics();
}


  
let activeLyricIndex = -1;

function syncLyrics() {
  const lines = songLyrics[current];

  if (!Array.isArray(lines)) return;

  const elements =
    $("lyricsText").querySelectorAll(".lyric-line");

  let active = -1;

  for (let i = 0; i < lines.length; i++) {
    if (audio.currentTime >= lines[i].time) {
      active = i;
    } else {
      break;
    }
  }

  elements.forEach((el, i) => {
    el.classList.toggle("active", i === active);
  });

  if (active !== activeLyricIndex) {
    activeLyricIndex = active;

    if (active >= 0) {
      elements[active].scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }
}

audio.addEventListener("timeupdate", syncLyrics);



// Open lyrics
$("lyricsBtn").onclick = () => {
  updateLyrics();
  $("lyricsScreen").classList.add("show");
};

// Close lyrics
$("closeLyrics").onclick = () => {
  $("lyricsScreen").classList.remove("show");
};
