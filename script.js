const imageInput = document.getElementById("imageInput");
const uploadArea = document.getElementById("uploadArea");
const uploadLabel = document.getElementById("uploadLabel");
const generateBtn = document.getElementById("generateBtn");
const loading = document.getElementById("loading");
const results = document.getElementById("results");

// Upload area
uploadArea.addEventListener("click", () => imageInput.click());

uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "#6c4df6";
    uploadArea.style.background = "#f0edff";
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.borderColor = "#d1d5db";
    uploadArea.style.background = "#fafbfc";
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = "#d1d5db";
    uploadArea.style.background = "#fafbfc";
    if (e.dataTransfer.files.length) {
        imageInput.files = e.dataTransfer.files;
        showFileName(e.dataTransfer.files[0]);
    }
});

imageInput.addEventListener("change", () => {
    if (imageInput.files.length) showFileName(imageInput.files[0]);
});

function showFileName(file) {
    if (!file) return;
    const size = (file.size / 1024 / 1024).toFixed(1);
    uploadLabel.textContent = file.name + " (" + size + " MB)";
}

// Format selection
document.querySelectorAll(".format-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
        document.querySelectorAll(".format-opt").forEach((o) => o.classList.remove("selected"));
        opt.classList.add("selected");
        opt.querySelector("input").checked = true;
    });
});

// Generate
generateBtn.addEventListener("click", async () => {
    const file = imageInput.files[0];
    if (!file) {
        alert("Please upload a poster image first.");
        return;
    }

    const imageURL = URL.createObjectURL(file);
    const format = document.querySelector('input[name="adFormat"]:checked').value;

    results.classList.remove("show");
    loading.style.display = "block";
    generateBtn.disabled = true;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("format", format);

    try {
        const res = await fetch("/api/analyze", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error || "Generation failed.");
        }

        // Show results
        document.getElementById("primaryTextResult").innerHTML =
            '<div class="result-card"><p>' + escapeHtml(data.primary_text) + '</p><button class="copy" onclick="copyText(this, \'' + escapeForAttr(data.primary_text) + '\')">Copy</button></div>';

        document.getElementById("imageResult").innerHTML =
            '<div class="result-card-image"><img src="' + imageURL + '" alt="Poster"></div>';

        document.getElementById("headlineResult").innerHTML =
            '<div class="result-card"><p>' + escapeHtml(data.headline) + '</p><button class="copy" onclick="copyText(this, \'' + escapeForAttr(data.headline) + '\')">Copy</button></div>';

        document.getElementById("descriptionResult").innerHTML =
            '<div class="result-card"><p>' + escapeHtml(data.description) + '</p><button class="copy" onclick="copyText(this, \'' + escapeForAttr(data.description) + '\')">Copy</button></div>';

        loading.style.display = "none";
        results.classList.add("show");
        generateBtn.disabled = false;

        results.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
        console.error(err);
        alert("Failed to generate ad copy. Please try again.");
        loading.style.display = "none";
        generateBtn.disabled = false;
    }
});

// Copy
function copyText(button, text) {
    navigator.clipboard.writeText(text);
    var old = button.innerText;
    button.innerText = "Copied ✓";
    setTimeout(() => {
        button.innerText = old;
    }, 1500);
}

// Reset
document.getElementById("newAdBtn").addEventListener("click", () => {
    results.classList.remove("show");
    results.innerHTML = "";
    imageInput.value = "";
    uploadLabel.textContent = "Click to upload or drag & drop";
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Helpers
function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function escapeForAttr(text) {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\n/g, " ");
}