const STORAGE_KEY = "benchstock-inventory";
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23dce6df'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%2356645f'%3ENo Photo%3C/text%3E%3C/svg%3E";

const cameraPreview = document.getElementById("camera-preview");
const captureCanvas = document.getElementById("capture-canvas");
const snapshotPreviewList = document.getElementById("snapshot-preview-list");
const snapshotEmpty = document.getElementById("snapshot-empty");
const startCameraButton = document.getElementById("start-camera");
const takePhotoButton = document.getElementById("take-photo");
const uploadInput = document.getElementById("photo-upload");
const inventoryForm = document.getElementById("inventory-form");
const categoryMenu = document.getElementById("category-menu");
const locationSelect = document.getElementById("location");
const commonNameInput = document.getElementById("common-name");
const technicalNameInput = document.getElementById("technical-name");
const quantityInput = document.getElementById("quantity");
const notesInput = document.getElementById("notes");
const toggleSecondaryLocationButton = document.getElementById(
  "toggle-secondary-location"
);
const additionalStorageMount = document.getElementById("additional-storage-mount");
const searchInput = document.getElementById("search-input");
const inventoryList = document.getElementById("inventory-list");
const inventoryTemplate = document.getElementById("inventory-card-template");
const itemCount = document.getElementById("item-count");
const exportButton = document.getElementById("export-data");
const resetFormButton = document.getElementById("reset-form");
const editState = document.getElementById("edit-state");
const commonNamesList = document.getElementById("common-names");
const technicalNamesList = document.getElementById("technical-names");

const CATEGORY_OPTIONS = [
  "tools",
  "kits",
  "low level electronics",
  "development boards",
  "cables/adapters",
  "sensors",
  "actuators",
  "HID's",
];

let cameraStream = null;
let capturedImages = [];
let inventoryItems = loadItems();
let editingItemId = null;
let pendingAdditionalStorage = { secondaryLocation: "", secondaryNotes: "" };

function createLocationOptionsMarkup() {
  return `
    <option value="">Choose location</option>
    <option value="Basics shelf 1">Basics shelf 1</option>
    <option value="Basics shelf 2">Basics shelf 2</option>
    <option value="Basics shelf 3">Basics shelf 3</option>
    <option value="Basics shelf 4">Basics shelf 4</option>
    <option value="Basics shelf 5">Basics shelf 5</option>
    <option value="Basics shelf 6">Basics shelf 6</option>
    <option value="Basics shelf 7">Basics shelf 7</option>
    <option value="Basics shelf 8">Basics shelf 8</option>
    <option value="Basics shelf 9">Basics shelf 9</option>
    <option value="Basics shelf 10">Basics shelf 10</option>
    <option value="Basics shelf 11">Basics shelf 11</option>
    <option value="Basics shelf 12">Basics shelf 12</option>
    <option value="Narnia shelf 1">Narnia shelf 1</option>
    <option value="Narnia shelf 2">Narnia shelf 2</option>
    <option value="Narnia shelf 3">Narnia shelf 3</option>
    <option value="Narnia shelf 4">Narnia shelf 4</option>
    <option value="Narnia shelf 5">Narnia shelf 5</option>
    <option value="Narnia shelf 6">Narnia shelf 6</option>
    <option value="Narnia shelf 7">Narnia shelf 7</option>
    <option value="Narnia shelf 8">Narnia shelf 8</option>
    <option value="Narnia shelf 9">Narnia shelf 9</option>
    <option value="Narnia shelf 10">Narnia shelf 10</option>
    <option value="Narnia shelf 11">Narnia shelf 11</option>
    <option value="Narnia shelf 12">Narnia shelf 12</option>
    <option value="Narnia shelf 13">Narnia shelf 13</option>
    <option value="Narnia shelf 14">Narnia shelf 14</option>
    <option value="Narnia shelf 15">Narnia shelf 15</option>
    <option value="Narnia shelf 16">Narnia shelf 16</option>
    <option value="Narnia shelf 17">Narnia shelf 17</option>
    <option value="Narnia shelf 18">Narnia shelf 18</option>
    <option value="Narnia shelf 19">Narnia shelf 19</option>
    <option value="Narnia shelf 20">Narnia shelf 20</option>
    <option value="Instrument shelf 1">Instrument shelf 1</option>
    <option value="Instrument shelf 2">Instrument shelf 2</option>
    <option value="Instrument shelf 3">Instrument shelf 3</option>
    <option value="Instrument shelf 4">Instrument shelf 4</option>
    <option value="Kits Corner">Kits Corner</option>
    <option value="Office supplies">Office supplies</option>
    <option value="3D-printer cabinet">3D-printer cabinet</option>
    <option value="Material storage 1">Material storage 1</option>
    <option value="Material storage 2">Material storage 2</option>
    <option value="Material storage 3">Material storage 3</option>
    <option value="Material storage 4">Material storage 4</option>
  `;
}

function normalizeStoredItem(item) {
  const images = Array.isArray(item.images)
    ? item.images
    : item.imageData
      ? [item.imageData]
      : [];
  const categories = Array.isArray(item.categories)
    ? item.categories
    : item.category
      ? [item.category]
      : [];

  return {
    ...item,
    images,
    categories,
    quantity: Number(item.quantity) || 1,
    secondaryLocation: String(item.secondaryLocation || "").trim(),
    secondaryNotes: String(item.secondaryNotes || "").trim(),
  };
}

function loadItems() {
  try {
    const rawData = window.localStorage.getItem(STORAGE_KEY);
    const parsed = rawData ? JSON.parse(rawData) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeStoredItem) : [];
  } catch (error) {
    console.error("Unable to read inventory from localStorage.", error);
    return [];
  }
}

function saveItems() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inventoryItems));
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function createLinkedTextFragment(text) {
  const fragment = document.createDocumentFragment();
  const source = String(text || "");
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  let lastIndex = 0;

  source.replace(urlPattern, (match, _httpUrl, _wwwUrl, offset) => {
    if (offset > lastIndex) {
      fragment.append(source.slice(lastIndex, offset));
    }

    const anchor = document.createElement("a");
    const href = match.startsWith("http") ? match : `https://${match}`;
    anchor.href = href;
    anchor.textContent = match;
    anchor.target = "_blank";
    anchor.rel = "noreferrer noopener";
    fragment.append(anchor);
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < source.length) {
    fragment.append(source.slice(lastIndex));
  }

  return fragment;
}

function getSelectedCategories() {
  return Array.from(
    categoryMenu.querySelectorAll('input[type="checkbox"]:checked')
  ).map((input) => input.value);
}

function getAdditionalStorageFields() {
  return {
    location: document.getElementById("secondary-location"),
    notes: document.getElementById("secondary-notes"),
  };
}

function removeAdditionalStorageSection({ preserveValues = true } = {}) {
  const fields = getAdditionalStorageFields();
  if (preserveValues && fields.location && fields.notes) {
    pendingAdditionalStorage = {
      secondaryLocation: String(fields.location.value || "").trim(),
      secondaryNotes: fields.notes.value.trim(),
    };
  } else if (!preserveValues) {
    pendingAdditionalStorage = { secondaryLocation: "", secondaryNotes: "" };
  }

  additionalStorageMount.innerHTML = "";
}

function ensureAdditionalStorageSection(values = pendingAdditionalStorage) {
  const existingFields = getAdditionalStorageFields();
  if (existingFields.location && existingFields.notes) {
    return existingFields;
  }

  additionalStorageMount.innerHTML = `
    <section class="secondary-location-section">
      <label>
        Additional storage location
        <select id="secondary-location" name="secondaryLocation">
          ${createLocationOptionsMarkup()}
        </select>
      </label>

      <label>
        Additional notes
        <textarea
          id="secondary-notes"
          name="secondaryNotes"
          rows="3"
          placeholder="Notes for the additional location"
        ></textarea>
      </label>
    </section>
  `;

  const createdFields = getAdditionalStorageFields();
  createdFields.location.value = values.secondaryLocation || "";
  createdFields.notes.value = values.secondaryNotes || "";
  return createdFields;
}

function setSelectedCategories(categories) {
  const selected = new Set(categories);
  categoryMenu.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function renderAutofillLists() {
  const commonValues = Array.from(
    new Set(inventoryItems.map((item) => item.commonName).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right));
  const technicalValues = Array.from(
    new Set(inventoryItems.map((item) => item.technicalName).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right));

  commonNamesList.innerHTML = "";
  technicalNamesList.innerHTML = "";

  commonValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    commonNamesList.append(option);
  });

  technicalValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    technicalNamesList.append(option);
  });
}

function renderSnapshotPreview() {
  snapshotPreviewList.innerHTML = "";

  if (!capturedImages.length) {
    snapshotEmpty.hidden = false;
    return;
  }

  snapshotEmpty.hidden = true;

  capturedImages.forEach((imageSrc, index) => {
    const image = document.createElement("img");
    image.className = "snapshot-thumb";
    image.src = imageSrc;
    image.alt = `Captured component photo ${index + 1}`;
    snapshotPreviewList.append(image);
  });
}

function addCapturedImage(imageSrc) {
  if (!imageSrc || editingItemId) {
    return;
  }

  capturedImages.push(imageSrc);
  renderSnapshotPreview();
}

async function startCamera() {
  if (editingItemId) {
    window.alert("This item already exists. Edit it instead of taking a new photo.");
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    window.alert("Your browser does not support camera access.");
    return;
  }

  try {
    if (cameraStream) {
      return;
    }

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });

    cameraPreview.srcObject = cameraStream;
    takePhotoButton.disabled = false;
    startCameraButton.textContent = "Camera Ready";
    startCameraButton.disabled = true;
  } catch (error) {
    console.error("Camera access failed.", error);
    window.alert("Camera access was denied or unavailable.");
  }
}

function stopCamera() {
  if (!cameraStream) {
    return;
  }

  for (const track of cameraStream.getTracks()) {
    track.stop();
  }

  cameraPreview.srcObject = null;
  cameraStream = null;
  takePhotoButton.disabled = true;
  startCameraButton.textContent = "Start Camera";
  startCameraButton.disabled = false;
}

function capturePhoto() {
  if (!cameraStream || editingItemId) {
    return;
  }

  const { videoWidth, videoHeight } = cameraPreview;
  captureCanvas.width = videoWidth;
  captureCanvas.height = videoHeight;

  const context = captureCanvas.getContext("2d");
  context.drawImage(cameraPreview, 0, 0, videoWidth, videoHeight);
  addCapturedImage(captureCanvas.toDataURL("image/jpeg", 0.92));
}

function handleUploadedPhoto(event) {
  if (editingItemId) {
    uploadInput.value = "";
    window.alert("This item already exists. Edit it instead of adding a new photo.");
    return;
  }

  const files = Array.from(event.target.files || []);
  if (!files.length) {
    return;
  }

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => addCapturedImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  });

  uploadInput.value = "";
}

function setEditState(item) {
  editingItemId = item ? item.id : null;

  if (item) {
    editState.hidden = false;
    editState.textContent =
      "Existing item found. You are editing it now, so use Save Item to update it.";
  } else {
    editState.hidden = true;
    editState.textContent = "";
  }
}

function fillFormFromItem(item) {
  commonNameInput.value = item.commonName;
  technicalNameInput.value = item.technicalName;
  quantityInput.value = String(item.quantity);
  locationSelect.value = item.location || "";
  notesInput.value = item.notes || "";
  pendingAdditionalStorage = {
    secondaryLocation: item.secondaryLocation || "",
    secondaryNotes: item.secondaryNotes || "",
  };
  removeAdditionalStorageSection();
  capturedImages = [...item.images];
  setSelectedCategories(item.categories);
  renderSnapshotPreview();
  setEditState(item);
  stopCamera();
}

function clearForm() {
  inventoryForm.reset();
  quantityInput.value = "1";
  capturedImages = [];
  setSelectedCategories([]);
  removeAdditionalStorageSection({ preserveValues: false });
  renderSnapshotPreview();
  setEditState(null);
  stopCamera();
}

function findExistingItemByNames(commonName, technicalName) {
  const normalizedCommon = normalizeText(commonName);
  const normalizedTechnical = normalizeText(technicalName);

  if (!normalizedCommon && !normalizedTechnical) {
    return null;
  }

  return (
    inventoryItems.find((item) => {
      const sameCommon =
        normalizedCommon && normalizeText(item.commonName) === normalizedCommon;
      const sameTechnical =
        normalizedTechnical &&
        normalizeText(item.technicalName) === normalizedTechnical;
      return sameCommon || sameTechnical;
    }) || null
  );
}

function maybeSwitchToExistingItem() {
  const existingItem = findExistingItemByNames(
    commonNameInput.value,
    technicalNameInput.value
  );

  if (!existingItem) {
    if (
      editingItemId &&
      !inventoryItems.some((item) => item.id === editingItemId)
    ) {
      setEditState(null);
    }
    return;
  }

  if (existingItem.id !== editingItemId) {
    fillFormFromItem(existingItem);
  }
}

function updateItemQuantity(itemId, quantity) {
  const parsedQuantity = Math.max(1, Number(quantity) || 1);
  inventoryItems = inventoryItems.map((item) =>
    item.id === itemId ? { ...item, quantity: parsedQuantity } : item
  );
  saveItems();
  renderInventory();
}

function renderInventory() {
  const query = normalizeText(searchInput.value);
  inventoryList.innerHTML = "";

  const filteredItems = inventoryItems
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .filter((item) => {
      if (!query) {
        return true;
      }

      return [item.commonName, item.technicalName].some((value) =>
        normalizeText(value).includes(query)
      );
    });

  itemCount.textContent = String(inventoryItems.length);

  if (!filteredItems.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = query
      ? "No items match that search yet."
      : "Your inventory is empty. Add the first component to get started.";
    inventoryList.append(emptyState);
    return;
  }

  for (const item of filteredItems) {
    const card = inventoryTemplate.content.firstElementChild.cloneNode(true);
    const gallery = card.querySelector(".inventory-card-gallery");
    const notes = card.querySelector(".inventory-notes");
    const secondaryBlock = card.querySelector(".inventory-secondary-block");
    const secondaryLocation = card.querySelector(".inventory-secondary-location");
    const secondaryNotes = card.querySelector(".inventory-secondary-notes");
    const quantityField = card.querySelector(".inventory-quantity-input");
    const imageSources = item.images.length ? item.images : [PLACEHOLDER_IMAGE];

    imageSources.forEach((src, index) => {
      const image = document.createElement("img");
      image.className = "inventory-card-image";
      image.src = src;
      image.alt = `${item.commonName} photo ${index + 1}`;
      gallery.append(image);
    });

    card.querySelector(".inventory-common-name").textContent = item.commonName;
    card.querySelector(".inventory-technical-name").textContent = item.technicalName;
    quantityField.value = String(item.quantity);
    notes.replaceChildren(createLinkedTextFragment(item.notes || ""));

    const meta = card.querySelector(".inventory-meta");
    const fields = [
      ["Category", item.categories.length ? item.categories.join(", ") : "Not set"],
      ["Location", item.location || "Not set"],
      ["Added", new Date(item.createdAt).toLocaleDateString()],
    ];

    fields.forEach(([label, value]) => {
      const wrapper = document.createElement("div");
      const title = document.createElement("dt");
      const body = document.createElement("dd");
      title.textContent = label;
      body.textContent = value;
      wrapper.append(title, body);
      meta.append(wrapper);
    });

    if (!item.notes) {
      notes.remove();
    }

    if (item.secondaryLocation || item.secondaryNotes) {
      secondaryBlock.hidden = false;
      secondaryLocation.textContent = `Secondary location: ${
        item.secondaryLocation || "Not set"
      }`;
      secondaryNotes.replaceChildren(
        createLinkedTextFragment(item.secondaryNotes || "")
      );

      if (!item.secondaryNotes) {
        secondaryNotes.remove();
      }
    }

    card.querySelector(".inventory-edit").addEventListener("click", () => {
      fillFormFromItem(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    quantityField.addEventListener("change", () => {
      updateItemQuantity(item.id, quantityField.value);
    });

    card.querySelector(".inventory-delete").addEventListener("click", () => {
      const confirmed = window.confirm(
        `Delete "${item.commonName}" from your inventory?`
      );
      if (!confirmed) {
        return;
      }

      inventoryItems = inventoryItems.filter((entry) => entry.id !== item.id);
      if (editingItemId === item.id) {
        clearForm();
      }
      saveItems();
      renderAutofillLists();
      renderInventory();
    });

    inventoryList.append(card);
  }
}

function handleSubmit(event) {
  event.preventDefault();

  const commonName = commonNameInput.value.trim();
  const technicalName = technicalNameInput.value.trim();

  if (!commonName || !technicalName) {
    window.alert("Please fill in both name fields.");
    return;
  }

  const existingItem = findExistingItemByNames(commonName, technicalName);
  const targetId = editingItemId || existingItem?.id || crypto.randomUUID();
  const previousItem = inventoryItems.find((item) => item.id === targetId);

  const item = {
    id: targetId,
    commonName,
    technicalName,
    categories: getSelectedCategories(),
    quantity: Math.max(1, Number(quantityInput.value) || 1),
    location: String(locationSelect.value || "").trim(),
    notes: notesInput.value.trim(),
    secondaryLocation: "",
    secondaryNotes: "",
    images: previousItem?.images?.length ? [...previousItem.images] : [...capturedImages],
    createdAt: previousItem?.createdAt || new Date().toISOString(),
  };

  const additionalFields = getAdditionalStorageFields();
  if (additionalFields.location && additionalFields.notes) {
    item.secondaryLocation = String(additionalFields.location.value || "").trim();
    item.secondaryNotes = additionalFields.notes.value.trim();
  } else if (previousItem) {
    item.secondaryLocation = previousItem.secondaryLocation || "";
    item.secondaryNotes = previousItem.secondaryNotes || "";
  }

  if (previousItem) {
    inventoryItems = inventoryItems.map((entry) =>
      entry.id === targetId ? item : entry
    );
  } else {
    inventoryItems.push(item);
  }

  saveItems();
  renderAutofillLists();
  renderInventory();
  fillFormFromItem(item);
}

function exportInventory() {
  const file = new Blob([JSON.stringify(inventoryItems, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `benchstock-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildCategoryMenu() {
  categoryMenu.innerHTML = "";

  CATEGORY_OPTIONS.forEach((category) => {
    const label = document.createElement("label");
    label.className = "category-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = category;

    const text = document.createElement("span");
    text.textContent = category;

    label.append(checkbox, text);
    categoryMenu.append(label);
  });
}

buildCategoryMenu();
renderAutofillLists();
renderSnapshotPreview();
renderInventory();

startCameraButton.addEventListener("click", startCamera);
takePhotoButton.addEventListener("click", capturePhoto);
uploadInput.addEventListener("change", handleUploadedPhoto);
inventoryForm.addEventListener("submit", handleSubmit);
toggleSecondaryLocationButton.addEventListener("click", () => {
  ensureAdditionalStorageSection();
});
searchInput.addEventListener("input", renderInventory);
exportButton.addEventListener("click", exportInventory);
resetFormButton.addEventListener("click", clearForm);
commonNameInput.addEventListener("change", maybeSwitchToExistingItem);
technicalNameInput.addEventListener("change", maybeSwitchToExistingItem);
window.addEventListener("beforeunload", stopCamera);
