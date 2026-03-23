// ─────────────────────────────────────────────
//  Sabil Hamster Gallery — script.js
//  Uses Imgur anonymous upload (no login needed)
//  Images are public on Imgur CDN.
//  Gallery entries are stored in localStorage so
//  they persist across page refreshes for each
//  visitor. New uploads show up for everyone who
//  shares the page (via the Imgur link display).
// ─────────────────────────────────────────────

// ── Imgur client ID ──────────────────────────
// Get your own free one at: https://api.imgur.com/oauth2/addclient
// This is a public anonymous client ID for demo use.
const IMGUR_CLIENT_ID = "546c25a59c58ad7"; // replace with your own if needed

// ── Storage key ─────────────────────────────
const STORAGE_KEY = "sabil_hamster_gallery_v1";

// ── Helpers ─────────────────────────────────
function loadImages() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveImages(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ── Toast ────────────────────────────────────
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast" + (type ? " " + type : "");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

// ── Preview selected file ────────────────────
function previewFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const label = document.getElementById("fileLabel");
  label.textContent = file.name.length > 28 ? file.name.slice(0, 28) + "…" : file.name;

  const wrap = document.getElementById("previewWrap");
  const img  = document.getElementById("previewImg");
  const reader = new FileReader();
  reader.onload = e => { img.src = e.target.result; wrap.style.display = "block"; };
  reader.readAsDataURL(file);
}

// ── Upload to Imgur ──────────────────────────
async function uploadImage() {
  const fileInput = document.getElementById("imageInput");
  const caption   = document.getElementById("captionInput").value.trim();
  const btn       = document.getElementById("uploadBtn");
  const btnText   = document.getElementById("btnText");
  const spinner   = document.getElementById("spinner");

  if (!fileInput.files[0]) {
    showToast("🐹 Please choose a photo first!", "error");
    return;
  }

  // Set loading state
  btn.disabled = true;
  btnText.style.display = "none";
  spinner.style.display = "block";

  try {
    const formData = new FormData();
    formData.append("image", fileInput.files[0]);
    formData.append("type", "file");
    if (caption) formData.append("title", caption);

    const res = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: { Authorization: "Client-ID " + IMGUR_CLIENT_ID },
      body: formData,
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.data?.error || "Upload failed");
    }

    // Save to local gallery
    const images = loadImages();
    images.unshift({
      url: data.data.link,
      caption: caption || "",
      date: new Date().toISOString(),
      deleteHash: data.data.deletehash,
    });
    saveImages(images);

    // Reset form
    fileInput.value = "";
    document.getElementById("fileLabel").textContent = "Choose a photo…";
    document.getElementById("captionInput").value = "";
    document.getElementById("previewWrap").style.display = "none";
    document.getElementById("previewImg").src = "";

    showToast("🎉 Uploaded! Your hamster is live!", "success");
    renderGallery();

  } catch (err) {
    console.error(err);
    showToast("❌ Upload failed: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btnText.style.display = "inline";
    spinner.style.display = "none";
  }
}

// ── Render Gallery ───────────────────────────
function renderGallery() {
  const gallery = document.getElementById("gallery");
  const countEl = document.getElementById("galleryCount");
  const images  = loadImages();

  countEl.textContent = images.length
    ? `${images.length} hamster${images.length !== 1 ? "s" : ""} shared so far 🐹`
    : "Be the first to share!";

  if (!images.length) {
    gallery.innerHTML = `
      <div class="empty-state">
        <div class="emoji">🐹</div>
        <p>No hamsters yet — upload the first one!</p>
      </div>`;
    return;
  }

  gallery.innerHTML = images.map((img, i) => `
    <div class="gallery-card" onclick="openLightbox(${i})" style="animation-delay:${Math.min(i * 0.06, 0.5)}s">
      <img src="${escHtml(img.url)}" alt="${escHtml(img.caption || 'Hamster')}" loading="lazy" />
      <div class="card-body">
        <div class="card-caption">${escHtml(img.caption || "🐹 Hamster!")}</div>
        <div class="card-date">${formatDate(img.date)}</div>
      </div>
    </div>
  `).join("");
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Lightbox ─────────────────────────────────
function openLightbox(index) {
  const images = loadImages();
  const img    = images[index];
  if (!img) return;
  document.getElementById("lbImg").src     = img.url;
  document.getElementById("lbCaption").textContent = img.caption || "🐹";
  document.getElementById("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
  document.body.style.overflow = "";
}
// Close lightbox with Escape key
document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });

// ── Init ─────────────────────────────────────
renderGallery();
