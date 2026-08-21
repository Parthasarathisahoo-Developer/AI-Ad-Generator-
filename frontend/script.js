const imageInput = document.getElementById("imageInput");
const generateBtn = document.getElementById("generateBtn");
const loading = document.getElementById("loading");
const result = document.getElementById("result");

generateBtn.addEventListener("click", async () => {

    console.log("[Generate Copy] Button clicked");

    const file = imageInput.files[0];

    if (!file) {
        console.warn("[Generate Copy] No file selected");
        alert("Please select a poster first.");
        return;
    }

    console.log("[Generate Copy] Selected file:", file.name, file.type, file.size);

    const imageURL = URL.createObjectURL(file);

    const selectedFormat = document.querySelector(
        'input[name="adFormat"]:checked'
    ).value;

    console.log("[Generate Copy] Selected format:", selectedFormat);

    loading.style.display = "block";
    result.innerHTML = "";

    const formData = new FormData();

    formData.append("image", file);
    formData.append("format", selectedFormat);

    console.log("[Generate Copy] Sending request to backend...");

    try {

        const response = await fetch(
            "http://127.0.0.1:8001/analyze",
            {
                method: "POST",
                body: formData
            }
        );

        console.log("[Generate Copy] Response status:", response.status, response.statusText);

        const data = await response.json();

        console.log("[Generate Copy] Response data:", data);

        if (!response.ok || data.error) {
            console.error("[Generate Copy] Backend returned error:", data);
            throw new Error(
                data.error || "Failed to generate advertisement."
            );
        }

        console.log("[Generate Copy] Gemini Ad Data:", data);

        const buildSection = (label, type, content) => `
            <div class="ad-section ad-section-${type}">

                <div class="ad-section-header">
                    <span class="ad-section-label">${label}</span>
                </div>

                <div class="ad-section-body">
                    ${content}
                </div>

                <div class="ad-section-footer">
                    <button class="copy-section-btn" data-type="${type}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy
                    </button>
                </div>

            </div>
        `;

        const buildAd = (wrapperClass) => `
            <div class="${wrapperClass}" id="generatedAd">

                ${buildSection(
                    "Primary Text",
                    "primary_text",
                    `<div class="primary-text">${data.primary_text}</div>`
                )}

                ${buildSection(
                    "Image",
                    "image",
                    `<img src="${imageURL}" alt="Advertisement">`
                )}

                ${buildSection(
                    "Headline",
                    "headline",
                    `<h2>${data.headline}</h2>`
                )}

                ${buildSection(
                    "Description",
                    "description",
                    `<p>${data.description}</p>`
                )}

            </div>
        `;

        let adHTML = "";

        if (selectedFormat === "Website Banner") {
            adHTML = buildAd("ad-banner");
        } else if (selectedFormat === "Website Card") {
            adHTML = buildAd("ad-card");
        } else if (selectedFormat === "Sidebar Ad") {
            adHTML = buildAd("ad-sidebar");
        } else {
            adHTML = buildAd("ad-social");
        }

        result.innerHTML = `
            ${adHTML}

            <div class="ad-actions">

                <button
                    id="newAdBtn"
                    class="action-btn">
                    Upload New Poster
                </button>

            </div>
        `;

        result.querySelectorAll(".copy-section-btn").forEach((btn) => {

            btn.addEventListener("click", async () => {

                const type = btn.dataset.type;

                let copyText = "";

                if (type === "image") {

                    const img = result.querySelector(".ad-section-image img");

                    try {

                        const blob = await fetch(img.src).then(r => r.blob());

                        await navigator.clipboard.write([
                            new ClipboardItem({
                                [blob.type]: blob
                            })
                        ]);

                    } catch (err) {

                        console.error(
                            "[Generate Copy] Failed to copy image:",
                            err
                        );

                        alert(
                            "Could not copy the image. Please copy it manually."
                        );

                        return;
                    }

                } else {

                    copyText = data[type];

                    await navigator.clipboard.writeText(copyText);
                }

                const originalText = btn.textContent;

                btn.textContent = "Copied!";

                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            });
        });

        document
            .getElementById("newAdBtn")
            .addEventListener(
                "click",
                () => {

                    document.getElementById("createPanel").style.display = "block";
                    document.getElementById("hero").style.display = "block";
                    document.getElementById("features").style.display = "block";

                    document.querySelector(".preview-panel").style.gridColumn = "";
                    document.querySelector(".preview-panel").style.margin = "";
                    document.querySelector(".preview-panel").style.width = "";

                    result.innerHTML = "";

                    imageInput.click();
                }
            );

        document.getElementById("createPanel").style.display = "none";
        document.getElementById("hero").style.display = "none";
        document.getElementById("features").style.display = "none";

        document.querySelector(".preview-panel").style.gridColumn = "1 / -1";
        document.querySelector(".preview-panel").style.margin = "0 auto";
        document.querySelector(".preview-panel").style.width = "100%";

    } catch (error) {

        console.error(
            "[Generate Copy] Advertisement generation failed:",
            error
        );

        alert(
            "Failed to generate advertisement. Please try again."
        );

    } finally {

        console.log("[Generate Copy] Finished generation attempt");
        loading.style.display = "none";

    }
});