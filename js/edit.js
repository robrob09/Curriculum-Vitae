document.addEventListener("DOMContentLoaded", () => {
  const storage = window.cvStorage;
  const state = storage.getCVData();
  let savedSnapshot = serializeState(state);

  const elements = {
    avatarButton: document.getElementById("avatarButton"),
    avatarInput: document.getElementById("avatarInput"),
    nameInput: document.getElementById("nameInput"),
    roleInput: document.getElementById("roleInput"),
    languagesList: document.getElementById("languagesEditorList"),
    addLanguageButton: document.getElementById("addLanguageButton"),
    experienceList: document.getElementById("experienceEditorList"),
    addExperienceButton: document.getElementById("addExperienceButton"),
    toolsList: document.getElementById("toolsEditorList"),
    addToolGroupButton: document.getElementById("addToolGroupButton"),
    toolCategoryMenu: document.getElementById("toolCategoryMenu"),
    toolCategoryPopup: document.getElementById("toolCategoryPopup"),
    educationList: document.getElementById("educationEditorList"),
    addEducationButton: document.getElementById("addEducationButton"),
    interestsList: document.getElementById("interestsEditorList"),
    addInterestButton: document.getElementById("addInterestButton"),
    emailInput: document.getElementById("contactEmailInput"),
    telInput: document.getElementById("contactTelInput"),
    saveButton: document.getElementById("saveButton"),
    resetButton: document.getElementById("resetButton"),
    previewButton: document.getElementById("previewButton"),
    previewModal: document.getElementById("previewModal"),
    modalSaveButton: document.getElementById("modalSavePreviewButton"),
    modalDontSaveButton: document.getElementById("modalDontSavePreviewButton"),
    modalCancelButton: document.getElementById("modalCancelPreviewButton"),
    resetModal: document.getElementById("resetModal"),
    modalConfirmResetButton: document.getElementById("modalConfirmResetButton"),
    modalCancelResetButton: document.getElementById("modalCancelResetButton"),
    viewSwitch: document.getElementById("view-switch"),
  };

  initialize();
  renderEditor();

  function initialize() {
    ensureContact();
    ensureTools();
    closeAllModals();
    closeToolCategoryPopup();

    const currentLayoutVersion = storage.getLayoutVersion();
    syncViewSwitch(currentLayoutVersion);
    storage.applyLayoutVersion(currentLayoutVersion);

    if (elements.nameInput) {
      elements.nameInput.addEventListener("input", (event) => {
        state.name = event.target.value;
        refreshEditorState();
      });
    }

    if (elements.roleInput) {
      elements.roleInput.addEventListener("input", (event) => {
        state.role = event.target.value;
        refreshEditorState();
      });
    }

    if (elements.emailInput) {
      elements.emailInput.addEventListener("input", (event) => {
        ensureContact();
        state.contact.email = event.target.value;
        refreshEditorState();
      });
    }

    if (elements.telInput) {
      elements.telInput.addEventListener("input", (event) => {
        ensureContact();
        state.contact.tel = event.target.value;
        refreshEditorState();
      });
    }

    if (elements.avatarButton && elements.avatarInput) {
      elements.avatarButton.addEventListener("click", () => {
        elements.avatarInput.click();
      });

      elements.avatarInput.addEventListener("change", async (event) => {
        const [file] = event.target.files || [];

        if (!file) {
          return;
        }

        try {
          state.avatar = await readFileAsDataUrl(file);
          renderAvatarPreview();
          refreshEditorState();
        } catch (error) {
          console.error("Failed to load avatar.", error);
        } finally {
          event.target.value = "";
        }
      });
    }

    if (elements.addLanguageButton) {
      elements.addLanguageButton.addEventListener("click", () => {
        state.languages.push({ name: "", level: 0 });
        renderEditor();
      });
    }

    if (elements.addExperienceButton) {
      elements.addExperienceButton.addEventListener("click", () => {
        state.experience.push({
          dateText: "",
          title: "",
          about: [],
          points: [],
          mostRecent: false,
        });
        renderEditor();
      });
    }

    if (elements.addToolGroupButton) {
      elements.addToolGroupButton.addEventListener("click", () => {
        toggleToolCategoryPopup();
      });
    }

    if (elements.addEducationButton) {
      elements.addEducationButton.addEventListener("click", () => {
        state.education.push({
          dateText: "",
          title: "",
          school: "",
          tags: [],
          mostRecent: false,
        });
        renderEditor();
      });
    }

    if (elements.addInterestButton) {
      elements.addInterestButton.addEventListener("click", () => {
        state.interests.push("");
        renderEditor();
      });
    }

    if (elements.saveButton) {
      elements.saveButton.addEventListener("click", () => {
        saveDraft();
        flashSavedState();
      });
    }

    if (elements.resetButton) {
      elements.resetButton.addEventListener("click", () => {
        if (isDefaultState()) {
          performReset();
          return;
        }

        openResetModal();
      });
    }

    if (elements.previewButton) {
      elements.previewButton.addEventListener("click", () => {
        if (isDirty()) {
          openPreviewModal();
          return;
        }

        navigateToPreview();
      });
    }

    if (elements.modalSaveButton) {
      elements.modalSaveButton.addEventListener("click", () => {
        saveDraft();
        closePreviewModal();
        navigateToPreview();
      });
    }

    if (elements.modalDontSaveButton) {
      elements.modalDontSaveButton.addEventListener("click", () => {
        discardUnsavedChanges();
        closePreviewModal();
        navigateToPreview();
      });
    }

    if (elements.modalCancelButton) {
      elements.modalCancelButton.addEventListener("click", () => {
        closePreviewModal();
      });
    }

    if (elements.previewModal) {
      elements.previewModal.addEventListener("click", (event) => {
        if (event.target === elements.previewModal) {
          closePreviewModal();
        }
      });
    }

    if (elements.modalConfirmResetButton) {
      elements.modalConfirmResetButton.addEventListener("click", () => {
        performReset();
        closeResetModal();
      });
    }

    if (elements.modalCancelResetButton) {
      elements.modalCancelResetButton.addEventListener("click", () => {
        closeResetModal();
      });
    }

    if (elements.resetModal) {
      elements.resetModal.addEventListener("click", (event) => {
        if (event.target === elements.resetModal) {
          closeResetModal();
        }
      });
    }

    if (elements.viewSwitch) {
      elements.viewSwitch.addEventListener("change", () => {
        const nextLayoutVersion = elements.viewSwitch.checked ? "v2" : "v1";
        storage.saveLayoutVersion(nextLayoutVersion);
        storage.applyLayoutVersion(nextLayoutVersion);
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAllModals();
        closeToolCategoryPopup();
      }
    });

    document.addEventListener("click", (event) => {
      if (!elements.toolCategoryMenu || !isToolCategoryPopupOpen()) {
        return;
      }

      if (!elements.toolCategoryMenu.contains(event.target)) {
        closeToolCategoryPopup();
      }
    });
  }

  function renderEditor() {
    ensureContact();
    ensureTools();

    if (elements.nameInput) {
      elements.nameInput.value = state.name || "";
    }

    if (elements.roleInput) {
      elements.roleInput.value = state.role || "";
    }

    if (elements.emailInput) {
      elements.emailInput.value = state.contact.email || "";
    }

    if (elements.telInput) {
      elements.telInput.value = state.contact.tel || "";
    }

    renderAvatarPreview();
    renderLanguagesEditor();
    renderExperienceEditor();
    renderToolsEditor();
    renderEducationEditor();
    renderInterestsEditor();
    renderToolCategoryPopup();
    syncViewSwitch(storage.getLayoutVersion());
    storage.applyLayoutVersion(storage.getLayoutVersion());
    updateDirtyUi();
  }

  function renderAvatarPreview() {
    const avatar = document.querySelector(".avatar");
    const fallbackSrc = "data/avatar-default.svg";

    if (!avatar) {
      return;
    }

    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = fallbackSrc;
    };

    avatar.src = state.avatar ? state.avatar : fallbackSrc;
  }

  function renderLanguagesEditor() {
    if (!elements.languagesList) {
      return;
    }

    elements.languagesList.innerHTML = "";

    state.languages.forEach((language, index) => {
      const row = document.createElement("div");
      row.className = "editorLanguageRow";

      const nameInput = document.createElement("input");
      nameInput.className = "editorInput";
      nameInput.id = buildFieldId("language-name", index);
      nameInput.name = buildFieldName("language-name", index);
      nameInput.type = "text";
      nameInput.placeholder = "Language";
      nameInput.autocomplete = "off";
      nameInput.value = language.name || "";
      nameInput.addEventListener("input", (event) => {
        state.languages[index].name = event.target.value;
        refreshEditorState();
      });

      const levelWrap = document.createElement("label");
      levelWrap.className = "flexCol";

      const range = document.createElement("input");
      range.className = "editorRange";
      range.id = buildFieldId("language-level", index);
      range.name = buildFieldName("language-level", index);
      range.type = "range";
      range.min = "0";
      range.max = "100";
      range.step = "1";
      range.value = String(storage.normalizePercent(language.level));
      range.addEventListener("input", (event) => {
        state.languages[index].level = Number(event.target.value);
        value.textContent = `${event.target.value}%`;
        refreshEditorState();
      });

      const value = document.createElement("span");
      value.className = "editorRangeValue";
      value.textContent = `${storage.normalizePercent(language.level)}%`;

      levelWrap.append(range, value);

      const removeButton = createActionButton(
        "×",
        "itemActionButton itemActionButtonDanger",
      );
      removeButton.setAttribute("aria-label", "Remove language");
      removeButton.addEventListener("click", () => {
        state.languages.splice(index, 1);
        renderEditor();
      });

      row.append(nameInput, levelWrap, removeButton);
      elements.languagesList.appendChild(row);
    });
  }

  function renderExperienceEditor() {
    if (!elements.experienceList) {
      return;
    }

    elements.experienceList.innerHTML = "";

    state.experience.forEach((job, index) => {
      const card = createEditorCard();

      const header = createCardActions(
        `Experience ${index + 1}`,
        job.mostRecent,
        {
          onToggleMostRecent: () =>
            toggleExclusiveMostRecent(state.experience, index),
          onRemove: () => {
            state.experience.splice(index, 1);
            renderEditor();
          },
          toggleLabel: "Toggle most recent experience",
          removeLabel: "Remove experience",
        },
      );

      const dateTextInput = createLabeledInput(
        "Date text",
        job.dateText || "",
        (value) => {
          state.experience[index].dateText = value;
          refreshEditorState();
        },
        buildFieldToken("experience", index, "date-text"),
      );

      const titleInput = createLabeledInput(
        "Title",
        job.title || "",
        (value) => {
          state.experience[index].title = value;
          refreshEditorState();
        },
        buildFieldToken("experience", index, "title"),
      );

      const aboutInput = createLabeledTextarea(
        "About (one item per line)",
        (job.about || []).join("\n"),
        (value) => {
          state.experience[index].about = splitLines(value);
          refreshEditorState();
        },
        buildFieldToken("experience", index, "about"),
      );

      const pointsInput = createLabeledTextarea(
        "Points (one item per line)",
        (job.points || []).join("\n"),
        (value) => {
          state.experience[index].points = splitLines(value);
          refreshEditorState();
        },
        buildFieldToken("experience", index, "points"),
      );

      card.append(header, dateTextInput, titleInput, aboutInput, pointsInput);
      elements.experienceList.appendChild(card);
    });
  }

  function renderToolsEditor() {
    if (!elements.toolsList) {
      return;
    }

    elements.toolsList.innerHTML = "";

    const catalog = storage.getToolCatalog();

    state.tools.forEach((group, index) => {
      if (!group.category || !Array.isArray(catalog[group.category])) {
        return;
      }

      const card = createEditorCard();

      const header = createCardActions(
        formatCategoryLabel(group.category),
        false,
        {
          onRemove: () => {
            state.tools.splice(index, 1);
            renderEditor();
          },
          removeLabel: `Remove ${group.category} tools category`,
        },
      );

      const helper = document.createElement("p");
      helper.className = "editorHelperText";
      helper.textContent =
        "Select the logos you want to show in the Tools block.";

      const options = document.createElement("div");
      options.className = "editorToolOptions";

      const list = document.createElement("div");
      list.className = "editorToolCheckboxList";

      const selectedFiles = new Set(
        (group.items || []).map((item) => item.file).filter(Boolean),
      );

      catalog[group.category].forEach((tool) => {
        const optionLabel = document.createElement("label");
        optionLabel.className = "editorToolCheckboxItem";

        const checkbox = document.createElement("input");
        checkbox.id = buildFieldId("tool", group.category, tool.file);
        checkbox.name = buildFieldName("tool", group.category, tool.file);
        checkbox.type = "checkbox";
        checkbox.checked = selectedFiles.has(tool.file);
        checkbox.addEventListener("change", () => {
          toggleToolSelection(index, group.category, tool, checkbox.checked);
        });

        const icon = document.createElement("img");
        icon.className = "editorToolCheckboxImage";
        icon.src = storage.buildToolIconPath(group.category, tool);
        icon.alt = tool.alt || storage.fileToLabel(tool.file);

        const text = document.createElement("span");
        text.className = "editorCheckboxText";
        text.textContent = tool.alt || storage.fileToLabel(tool.file);

        optionLabel.append(checkbox, icon, text);
        list.appendChild(optionLabel);
      });

      options.append(helper, list);
      card.append(header, options);
      elements.toolsList.appendChild(card);
    });
  }

  function renderEducationEditor() {
    if (!elements.educationList) {
      return;
    }

    elements.educationList.innerHTML = "";

    state.education.forEach((education, index) => {
      const card = createEditorCard();

      const header = createCardActions(
        `Education ${index + 1}`,
        education.mostRecent,
        {
          onToggleMostRecent: () =>
            toggleExclusiveMostRecent(state.education, index),
          onRemove: () => {
            state.education.splice(index, 1);
            renderEditor();
          },
          toggleLabel: "Toggle most recent education",
          removeLabel: "Remove education",
        },
      );

      const dateTextInput = createLabeledInput(
        "Date text",
        education.dateText || "",
        (value) => {
          state.education[index].dateText = value;
          refreshEditorState();
        },
        buildFieldToken("education", index, "date-text"),
      );

      const titleInput = createLabeledInput(
        "Title",
        education.title || "",
        (value) => {
          state.education[index].title = value;
          refreshEditorState();
        },
        buildFieldToken("education", index, "title"),
      );

      const schoolInput = createLabeledInput(
        "School",
        education.school || "",
        (value) => {
          state.education[index].school = value;
          refreshEditorState();
        },
        buildFieldToken("education", index, "school"),
      );

      const tagsInput = createLabeledTextarea(
        "Tags (one item per line)",
        (education.tags || []).join("\n"),
        (value) => {
          state.education[index].tags = splitLines(value);
          refreshEditorState();
        },
        buildFieldToken("education", index, "tags"),
      );

      card.append(header, dateTextInput, titleInput, schoolInput, tagsInput);
      elements.educationList.appendChild(card);
    });
  }

  function renderInterestsEditor() {
    if (!elements.interestsList) {
      return;
    }

    elements.interestsList.innerHTML = "";

    state.interests.forEach((interest, index) => {
      const row = document.createElement("div");
      row.className = "editorInterestRow";

      const input = document.createElement("input");
      input.className = "editorInput";
      input.id = buildFieldId("interest", index);
      input.name = buildFieldName("interest", index);
      input.type = "text";
      input.placeholder = "Interest";
      input.autocomplete = "off";
      input.value = interest || "";
      input.addEventListener("input", (event) => {
        state.interests[index] = event.target.value;
        refreshEditorState();
      });

      const filler = document.createElement("div");
      filler.setAttribute("aria-hidden", "true");

      const removeButton = createActionButton(
        "×",
        "itemActionButton itemActionButtonDanger",
      );
      removeButton.setAttribute("aria-label", "Remove interest");
      removeButton.addEventListener("click", () => {
        state.interests.splice(index, 1);
        renderEditor();
      });

      row.append(input, filler, removeButton);
      elements.interestsList.appendChild(row);
    });
  }

  function renderToolCategoryPopup() {
    if (!elements.toolCategoryPopup || !elements.addToolGroupButton) {
      return;
    }

    const availableCategories = getAvailableToolCategories();
    elements.toolCategoryPopup.innerHTML = "";

    if (availableCategories.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "inlineMenuEmpty";
      emptyState.textContent = "All categories are already added.";
      elements.toolCategoryPopup.appendChild(emptyState);
    } else {
      availableCategories.forEach((category) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "inlineMenuOption";
        option.textContent = formatCategoryLabel(category);
        option.addEventListener("click", () => {
          addToolCategory(category);
        });
        elements.toolCategoryPopup.appendChild(option);
      });
    }

    elements.addToolGroupButton.disabled = availableCategories.length === 0;
    elements.addToolGroupButton.setAttribute(
      "aria-expanded",
      String(isToolCategoryPopupOpen()),
    );
  }

  function addToolCategory(category) {
    if (!category || state.tools.some((group) => group.category === category)) {
      closeToolCategoryPopup();
      return;
    }

    state.tools.push({
      category,
      items: [],
    });

    closeToolCategoryPopup();
    renderEditor();
  }

  function toggleToolSelection(groupIndex, category, tool, isSelected) {
    const group = state.tools[groupIndex];

    if (!group) {
      return;
    }

    const selectedFiles = new Set(
      (group.items || []).map((item) => item.file).filter(Boolean),
    );

    if (isSelected) {
      selectedFiles.add(tool.file);
    } else {
      selectedFiles.delete(tool.file);
    }

    group.items = buildToolItemsFromSelection(category, selectedFiles);
    refreshEditorState();
  }

  function buildToolItemsFromSelection(category, selectedFiles) {
    const catalog = storage.getToolCatalog();
    const categoryItems = Array.isArray(catalog[category])
      ? catalog[category]
      : [];

    return categoryItems
      .filter((tool) => selectedFiles.has(tool.file))
      .map((tool) => ({
        file: tool.file,
        alt: tool.alt,
      }));
  }

  function getAvailableToolCategories() {
    const activeCategories = new Set(
      state.tools.map((group) => group.category).filter(Boolean),
    );

    return storage
      .getToolCategories()
      .filter((category) => !activeCategories.has(category));
  }

  function toggleToolCategoryPopup() {
    if (
      !elements.toolCategoryPopup ||
      !elements.addToolGroupButton ||
      elements.addToolGroupButton.disabled
    ) {
      return;
    }

    if (isToolCategoryPopupOpen()) {
      closeToolCategoryPopup();
      return;
    }

    elements.toolCategoryPopup.hidden = false;
    elements.addToolGroupButton.setAttribute("aria-expanded", "true");
  }

  function closeToolCategoryPopup() {
    if (!elements.toolCategoryPopup || !elements.addToolGroupButton) {
      return;
    }

    elements.toolCategoryPopup.hidden = true;
    elements.addToolGroupButton.setAttribute("aria-expanded", "false");
  }

  function isToolCategoryPopupOpen() {
    return Boolean(
      elements.toolCategoryPopup && !elements.toolCategoryPopup.hidden,
    );
  }

  function openPreviewModal() {
    openModal(elements.previewModal);
  }

  function closePreviewModal() {
    closeModal(elements.previewModal);
  }

  function openResetModal() {
    openModal(elements.resetModal);
  }

  function closeResetModal() {
    closeModal(elements.resetModal);
  }

  function openModal(modalElement) {
    if (!modalElement) {
      return;
    }

    if (!document.body.classList.contains("hasModalOpen")) {
      document.body.dataset.lockedScrollY = String(
        window.scrollY || window.pageYOffset || 0,
      );
      document.body.style.top = `-${document.body.dataset.lockedScrollY}px`;
      document.body.classList.add("hasModalOpen");
    }

    modalElement.hidden = false;
  }

  function closeModal(modalElement) {
    if (!modalElement) {
      return;
    }

    modalElement.hidden = true;

    const hasVisibleModal = [elements.previewModal, elements.resetModal].some(
      (modal) => modal && !modal.hidden,
    );

    if (!hasVisibleModal) {
      const lockedScrollY = Number.parseInt(
        document.body.dataset.lockedScrollY || "0",
        10,
      );

      document.body.classList.remove("hasModalOpen");
      document.body.style.top = "";
      delete document.body.dataset.lockedScrollY;

      window.scrollTo(0, Number.isNaN(lockedScrollY) ? 0 : lockedScrollY);
    }
  }

  function closeAllModals() {
    closeModal(elements.previewModal);
    closeModal(elements.resetModal);
  }

  function performReset() {
    storage.resetCVData();
    storage.resetLayoutVersion();
    replaceState(storage.defaultCVData);
    savedSnapshot = serializeState(state);
    syncViewSwitch(storage.getLayoutVersion());
    storage.applyLayoutVersion(storage.getLayoutVersion());
    renderEditor();
  }

  function isDefaultState() {
    return (
      serializeState(state) === serializeState(storage.defaultCVData) &&
      storage.getLayoutVersion() === storage.DEFAULT_LAYOUT_VERSION
    );
  }

  function navigateToPreview() {
    window.location.href = "index.html";
  }

  function discardUnsavedChanges() {
    replaceState(storage.getCVData());
    renderEditor();
  }

  function syncViewSwitch(version) {
    if (!elements.viewSwitch) {
      return;
    }

    elements.viewSwitch.checked =
      storage.normalizeLayoutVersion(version) === "v2";
  }

  function ensureContact() {
    if (!state.contact || typeof state.contact !== "object") {
      state.contact = { email: "", tel: "" };
    }
  }

  function ensureTools() {
    if (!Array.isArray(state.tools)) {
      state.tools = [];
      return;
    }

    const catalog = storage.getToolCatalog();

    state.tools = state.tools
      .map((group) => {
        const category = String(group?.category || group?.tag || "").trim();
        const validCategoryItems = Array.isArray(catalog[category])
          ? catalog[category]
          : [];
        const selectedFiles = new Set(
          (Array.isArray(group?.items) ? group.items : [])
            .map((item) =>
              String(
                item?.file ||
                  (typeof item?.icon === "string"
                    ? item.icon.split("/").pop() || ""
                    : ""),
              ).trim(),
            )
            .filter(Boolean),
        );

        return {
          category,
          items: buildToolItemsFromCatalog(validCategoryItems, selectedFiles),
        };
      })
      .filter((group) => group.category);
  }

  function buildToolItemsFromCatalog(catalogItems, selectedFiles) {
    return catalogItems
      .filter((tool) => selectedFiles.has(tool.file))
      .map((tool) => ({
        file: tool.file,
        alt: tool.alt,
      }));
  }

  function saveDraft() {
    storage.saveCVData(state);
    savedSnapshot = serializeState(state);
    updateDirtyUi();
  }

  function refreshEditorState() {
    updateDirtyUi();
  }

  function replaceState(nextState) {
    const normalizedState = storage.mergeWithDefault(storage.clone(nextState));

    Object.keys(state).forEach((key) => {
      delete state[key];
    });

    Object.assign(state, normalizedState);
    ensureContact();
    ensureTools();
  }

  function isDirty() {
    return serializeState(state) !== savedSnapshot;
  }

  function updateDirtyUi() {
    if (!elements.previewButton) {
      return;
    }

    if (isDirty()) {
      elements.previewButton.textContent = "Preview";
      elements.previewButton.dataset.dirty = "true";
      return;
    }

    elements.previewButton.textContent = "Preview";
    elements.previewButton.dataset.dirty = "false";
  }

  function flashSavedState() {
    if (!elements.saveButton) {
      return;
    }

    const originalText = elements.saveButton.textContent;
    elements.saveButton.textContent = "Saved";

    window.setTimeout(() => {
      elements.saveButton.textContent = originalText;
    }, 1000);
  }

  function serializeState(value) {
    return JSON.stringify(storage.mergeWithDefault(storage.clone(value)));
  }

  function createEditorCard() {
    const card = document.createElement("div");
    card.className = "flexCol editorCard";
    return card;
  }

  function createCardActions(title, isActive, config = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "editorCardActions";

    const heading = document.createElement("p");
    heading.className = "editorCardTitle";
    heading.textContent = title;

    const actions = document.createElement("div");
    actions.className = "editorCardActionsRight";

    if (typeof config.onToggleMostRecent === "function") {
      const toggleButton = createActionButton(
        "★",
        `itemActionButton itemActionButtonStar${isActive ? " isActive" : ""}`,
      );
      toggleButton.setAttribute(
        "aria-label",
        config.toggleLabel || "Toggle item",
      );
      toggleButton.addEventListener("click", config.onToggleMostRecent);
      actions.appendChild(toggleButton);
    }

    if (typeof config.onRemove === "function") {
      const removeButton = createActionButton(
        "×",
        "itemActionButton itemActionButtonDanger",
      );
      removeButton.setAttribute(
        "aria-label",
        config.removeLabel || "Remove item",
      );
      removeButton.addEventListener("click", config.onRemove);
      actions.appendChild(removeButton);
    }

    wrapper.append(heading, actions);
    return wrapper;
  }

  function createActionButton(text, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    return button;
  }

  function createLabeledInput(labelText, value, onInput, fieldToken = "field") {
    const label = document.createElement("label");
    label.className = "flexCol editorFieldGroup";

    const caption = document.createElement("span");
    caption.className = "editorFieldLabel";
    caption.textContent = labelText;

    const input = document.createElement("input");
    input.className = "editorInput";
    input.id = buildFieldId(fieldToken);
    input.name = buildFieldName(fieldToken);
    input.type = "text";
    input.value = value;
    input.autocomplete = "off";
    input.addEventListener("input", (event) => onInput(event.target.value));

    label.htmlFor = input.id;
    label.append(caption, input);
    return label;
  }

  function createLabeledTextarea(
    labelText,
    value,
    onInput,
    fieldToken = "field",
  ) {
    const label = document.createElement("label");
    label.className = "flexCol editorFieldGroup";

    const caption = document.createElement("span");
    caption.className = "editorFieldLabel";
    caption.textContent = labelText;

    const textarea = document.createElement("textarea");
    textarea.className = "editorTextarea";
    textarea.id = buildFieldId(fieldToken);
    textarea.name = buildFieldName(fieldToken);
    textarea.value = value;
    textarea.autocomplete = "off";
    textarea.addEventListener("input", (event) => onInput(event.target.value));

    label.htmlFor = textarea.id;
    label.append(caption, textarea);
    return label;
  }

  function splitLines(value) {
    return String(value || "")
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function buildFieldId(...parts) {
    return `editor-${buildFieldToken(...parts)}`;
  }

  function buildFieldName(...parts) {
    return `editor-${buildFieldToken(...parts)}`;
  }

  function buildFieldToken(...parts) {
    const normalized = parts
      .flat()
      .map((part) => sanitizeFieldPart(part))
      .filter(Boolean)
      .join("-");

    return normalized || "field";
  }

  function sanitizeFieldPart(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function toggleExclusiveMostRecent(collection, activeIndex) {
    collection.forEach((item, index) => {
      item.mostRecent = index === activeIndex ? !item.mostRecent : false;
    });
    renderEditor();
  }

  function formatCategoryLabel(value) {
    return String(value || "")
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);

      reader.readAsDataURL(file);
    });
  }
});
