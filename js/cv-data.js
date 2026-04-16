(function () {
  const STORAGE_KEY = "cvData";
  const LAYOUT_STORAGE_KEY = "cvLayoutVersion";
  const DEFAULT_LAYOUT_VERSION = "v1";

  const TOOL_LIBRARY = {
    "no-code": [
      { file: "framer-logo.svg", alt: "Framer" },
      { file: "webflow-logo.svg", alt: "Webflow" },
      { file: "wordpress-logo.svg", alt: "WordPress" },
      { file: "zapier-logo.svg", alt: "Zapier" },
    ],
    "artificial-intelligence": [
      { file: "chatgpt-logo.svg", alt: "ChatGPT" },
      { file: "copilot-logo.svg", alt: "GitHub Copilot" },
      { file: "midjourney-logo.svg", alt: "Midjourney" },
    ],
    design: [
      { file: "figma-logo.svg", alt: "Figma" },
      { file: "creativecloud-logo.svg", alt: "Adobe Creative Cloud" },
      { file: "illustrator-logo.svg", alt: "Adobe Illustrator" },
      { file: "photoshop-logo.svg", alt: "Adobe Photoshop" },
      { file: "premiere-logo.svg", alt: "Adobe Premiere Pro" },
      { file: "miro-logo.svg", alt: "Miro" },
      { file: "analytics-logo.svg", alt: "Analytics" },
      { file: "meet-logo.svg", alt: "Google Meet" },
      { file: "notion-logo.svg", alt: "Notion" },
    ],
  };

  const FALLBACK_AVATAR_SRC = "data/avatar-default.svg";

  const defaultCVData = {
    avatar: "",
    name: "",
    role: "",
    languages: [],
    experience: [],
    tools: [],
    education: [],
    interests: [],
    contact: {
      email: "",
      tel: "",
    },
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getRootDocument(root) {
    return root?.nodeType === Node.DOCUMENT_NODE
      ? root
      : root?.ownerDocument || document;
  }

  function clearNode(node) {
    if (!node) {
      return;
    }

    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function createNode(
    root,
    tagName,
    { className = "", text = "", attributes = {} } = {},
  ) {
    const element = getRootDocument(root).createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (text) {
      element.textContent = text;
    }

    Object.entries(attributes).forEach(([name, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        element.setAttribute(name, value);
      }
    });

    return element;
  }

  function getCVData() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return clone(defaultCVData);
    }

    try {
      const parsed = JSON.parse(raw);
      return mergeWithDefault(parsed);
    } catch (error) {
      return clone(defaultCVData);
    }
  }

  function saveCVData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeWithDefault(data)));
  }

  function resetCVData() {
    localStorage.removeItem(STORAGE_KEY);
    return clone(defaultCVData);
  }

  function getLayoutVersion() {
    const value = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return normalizeLayoutVersion(value);
  }

  function saveLayoutVersion(version) {
    const normalizedVersion = normalizeLayoutVersion(version);
    localStorage.setItem(LAYOUT_STORAGE_KEY, normalizedVersion);
    return normalizedVersion;
  }

  function resetLayoutVersion() {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
    return DEFAULT_LAYOUT_VERSION;
  }

  function normalizeLayoutVersion(version) {
    return version === "v2" ? "v2" : DEFAULT_LAYOUT_VERSION;
  }

  function applyLayoutVersion(version, root = document) {
    const normalizedVersion = normalizeLayoutVersion(version);

    root.documentElement?.setAttribute?.(
      "data-layout-version",
      normalizedVersion,
    );
    const body = root.body || root.querySelector("body");
    body?.setAttribute?.("data-layout-version", normalizedVersion);

    return normalizedVersion;
  }

  function mergeWithDefault(data) {
    const merged = clone(defaultCVData);
    const source = data && typeof data === "object" ? data : {};

    if (typeof source.avatar === "string") {
      merged.avatar = source.avatar;
    }

    if (typeof source.name === "string") {
      merged.name = source.name;
    }

    if (typeof source.role === "string") {
      merged.role = source.role;
    }

    if (Array.isArray(source.languages)) {
      merged.languages = source.languages;
    }

    if (Array.isArray(source.experience)) {
      merged.experience = normalizeExperienceData(source.experience);
    }

    if (Array.isArray(source.tools)) {
      merged.tools = normalizeToolsData(source.tools);
    }

    if (Array.isArray(source.education)) {
      merged.education = normalizeEducationData(source.education);
    }

    if (Array.isArray(source.interests)) {
      merged.interests = source.interests;
    }

    if (source.contact && typeof source.contact === "object") {
      merged.contact = {
        email:
          typeof source.contact.email === "string" ? source.contact.email : "",
        tel: typeof source.contact.tel === "string" ? source.contact.tel : "",
      };
    }

    return merged;
  }

  function normalizeExperienceData(experience) {
    return (experience || [])
      .filter((job) => job && typeof job === "object")
      .map((job) => ({
        dateText: typeof job.dateText === "string" ? job.dateText : "",
        title: typeof job.title === "string" ? job.title : "",
        about: Array.isArray(job.about)
          ? job.about.map((item) => String(item || ""))
          : [],
        points: Array.isArray(job.points)
          ? job.points.map((item) => String(item || ""))
          : [],
        mostRecent: Boolean(job.mostRecent),
      }));
  }

  function normalizeEducationData(education) {
    return (education || [])
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        dateText: typeof item.dateText === "string" ? item.dateText : "",
        title: typeof item.title === "string" ? item.title : "",
        school: typeof item.school === "string" ? item.school : "",
        tags: Array.isArray(item.tags)
          ? item.tags.map((tag) => String(tag || ""))
          : [],
        mostRecent: Boolean(item.mostRecent),
      }));
  }

  function normalizeToolsData(tools) {
    return (tools || [])
      .filter((group) => group && typeof group === "object")
      .map((group) => {
        const category = String(group.category || group.tag || "").trim();
        const items = Array.isArray(group.items) ? group.items : [];

        return {
          category,
          items: items
            .map((tool) => normalizeToolItem(tool, category))
            .filter(Boolean),
        };
      });
  }

  function normalizeToolItem(tool, category) {
    if (!tool || typeof tool !== "object") {
      return null;
    }

    const file = getToolFileName(tool);
    const alt = String(
      tool.alt || tool.name || fileToLabel(file || "") || "",
    ).trim();

    if (!file && !tool.icon) {
      return null;
    }

    return {
      file: file || "",
      icon: buildToolIconPath(category, { ...tool, file }),
      alt,
    };
  }

  function getToolFileName(tool) {
    if (typeof tool.file === "string" && tool.file.trim()) {
      return tool.file.trim();
    }

    if (typeof tool.icon === "string" && tool.icon.trim()) {
      const parts = tool.icon.split("/");
      return parts[parts.length - 1] || "";
    }

    return "";
  }

  function buildToolIconPath(category, tool) {
    if (
      tool &&
      typeof tool.icon === "string" &&
      tool.icon.trim() &&
      !tool.icon.includes("data/tools/")
    ) {
      return tool.icon;
    }

    const file = getToolFileName(tool || {});

    if (!category || !file) {
      return typeof tool?.icon === "string" ? tool.icon : "";
    }

    return `data/tools/${category}/${file}`;
  }

  function getToolCatalog() {
    return clone(TOOL_LIBRARY);
  }

  function getToolCategories() {
    return Object.keys(TOOL_LIBRARY);
  }

  function renderCV(data, root = document) {
    renderAvatar(data, root);
    renderName(data, root);
    renderLanguages(data, root);
    renderExperience(data, root);
    renderTools(data, root);
    renderEducation(data, root);
    renderInterests(data, root);
    renderContact(data, root);
  }

  function renderAvatar(data, root) {
    const avatar = root.querySelector(".avatar");

    if (!avatar) {
      return;
    }

    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = FALLBACK_AVATAR_SRC;
    };

    avatar.src =
      typeof data.avatar === "string" && data.avatar.trim()
        ? data.avatar
        : FALLBACK_AVATAR_SRC;
  }

  function renderName(data, root) {
    const name = root.querySelector(".name");
    const role = root.querySelector(".role");

    if (name) {
      name.textContent = typeof data.name === "string" ? data.name : "";
    }

    if (role) {
      role.textContent = typeof data.role === "string" ? data.role : "";
    }
  }

  function renderLanguages(data, root) {
    const namesContainer = root.querySelector(".nameLanguages");
    const levelsContainer = root.querySelector(".levelLanguages");

    if (!namesContainer || !levelsContainer) {
      return;
    }

    namesContainer.innerHTML = "";
    levelsContainer.innerHTML = "";

    (data.languages || []).forEach((language) => {
      const name = document.createElement("p");
      name.className = "textSmall fs10";
      name.textContent = String(language.name || "");
      namesContainer.appendChild(name);

      const progressContainer = document.createElement("div");
      progressContainer.className = "progressContainer";

      const progressBar = document.createElement("div");
      progressBar.className = "progressBar";
      progressBar.style.setProperty(
        "--progress",
        `${normalizePercent(language.level)}%`,
      );

      progressContainer.appendChild(progressBar);
      levelsContainer.appendChild(progressContainer);
    });
  }

  function renderExperience(data, root) {
    const jobList = root.querySelector(".jobList");

    if (!jobList) {
      return;
    }

    clearNode(jobList);

    (data.experience || []).forEach((job) => {
      const article = createNode(root, "article", {
        className: `flexCol job${job.mostRecent ? " mostRecent" : ""}`,
      });

      const topBar = createNode(root, "div", {
        className: "flexRow jobTopBar",
      });
      const date = createNode(root, "time", {
        className: "jobTopBarDate",
        text: String(job.dateText || ""),
      });

      topBar.appendChild(date);

      if (job.mostRecent) {
        topBar.appendChild(
          createNode(root, "div", {
            className: "jobMostRecentTag",
            text: "most recent",
          }),
        );
      }

      const content = createNode(root, "div", {
        className: "flexRow jobContent",
      });
      const info = createNode(root, "div", { className: "flexCol jobInfo" });
      const title = createNode(root, "h3", {
        className: "textSmall fs10",
        text: String(job.title || ""),
      });
      const about = createNode(root, "div", { className: "flexRow aboutJob" });
      const pointsWrapper = createNode(root, "div", {
        className: "jobFeaturedPoints",
      });
      const pointsList = createNode(root, "ul", {
        className: "jobFeaturedPointsText",
      });

      (job.about || []).filter(Boolean).forEach((item, index, items) => {
        about.appendChild(
          createNode(root, "p", {
            className: "aboutJobText",
            text: String(item),
          }),
        );

        if (index < items.length - 1) {
          about.appendChild(
            createNode(root, "p", {
              className: "aboutJobText separator",
              text: "|",
            }),
          );
        }
      });

      (job.points || []).filter(Boolean).forEach((point) => {
        pointsList.appendChild(createNode(root, "li", { text: String(point) }));
      });

      info.append(title, about);
      pointsWrapper.appendChild(pointsList);
      content.append(info, pointsWrapper);
      article.append(topBar, content);
      jobList.appendChild(article);
    });
  }

  function renderTools(data, root) {
    const toolsFrame = root.querySelector(".toolsFrame");

    if (!toolsFrame) {
      return;
    }

    toolsFrame.innerHTML = "";

    normalizeToolsData(data.tools || []).forEach((group) => {
      if (!group.category) {
        return;
      }

      const selectedItems = (group.items || []).filter(Boolean);

      if (selectedItems.length === 0) {
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "toolsContent";

      const tag = document.createElement("div");
      tag.className = "toolsTag";
      tag.textContent = group.category;

      const icons = document.createElement("div");
      icons.className = "toolsIcons";

      selectedItems.forEach((tool) => {
        const icon = document.createElement("img");
        icon.src = buildToolIconPath(group.category, tool);
        icon.alt = String(tool.alt || fileToLabel(tool.file || ""));
        icon.className = "toolsIcon";
        icons.appendChild(icon);
      });

      wrapper.append(tag, icons);
      toolsFrame.appendChild(wrapper);
    });
  }

  function renderEducation(data, root) {
    const educationList = root.querySelector(".educationList");

    if (!educationList) {
      return;
    }

    clearNode(educationList);

    (data.education || []).forEach((education) => {
      const article = createNode(root, "article", {
        className: `flexCol education${education.mostRecent ? " mostRecent" : ""}`,
      });
      const topBar = createNode(root, "div", {
        className: "flexRow educationTopBar",
      });
      const date = createNode(root, "time", {
        className: "educationTopBarDate",
        text: String(education.dateText || ""),
      });
      const content = createNode(root, "div", {
        className: "flexCol educationContent",
      });
      const title = createNode(root, "h3", {
        className: "textSmall fs10",
        text: String(education.title || ""),
      });
      const frame = createNode(root, "div", { className: "educationFrame" });
      const school = createNode(root, "p", {
        className: "schoolName",
        text: String(education.school || ""),
      });

      topBar.appendChild(date);

      if (education.mostRecent) {
        const mostRecentIcon = createNode(root, "img", {
          attributes: { src: "data/mostRecentTag.svg", alt: "Most recent" },
        });
        topBar.appendChild(mostRecentIcon);
      }

      (education.tags || []).filter(Boolean).forEach((tagText) => {
        frame.appendChild(
          createNode(root, "p", {
            className: "educationTag",
            text: String(tagText),
          }),
        );
      });

      content.append(title, frame, school);
      article.append(topBar, content);
      educationList.appendChild(article);
    });
  }

  function renderInterests(data, root) {
    const interestsContent = root.querySelector(".interestsContent");

    if (!interestsContent) {
      return;
    }

    clearNode(interestsContent);

    (data.interests || []).forEach((interest) => {
      interestsContent.appendChild(
        createNode(root, "div", {
          className: "interestsTag",
          text: String(interest || ""),
        }),
      );
    });
  }

  function renderContact(data, root) {
    const contactContent = root.querySelector(".contactContent");

    if (!contactContent) {
      return;
    }

    clearNode(contactContent);

    const email =
      data.contact && typeof data.contact.email === "string"
        ? data.contact.email.trim()
        : "";
    const tel =
      data.contact && typeof data.contact.tel === "string"
        ? data.contact.tel.trim()
        : "";

    const parts = [];

    if (email) {
      parts.push(
        createContactLink(
          {
            className: "contactContentText contactLink",
            href: `mailto:${email}`,
            text: email,
          },
          root,
        ),
      );
    }

    if (tel) {
      parts.push(
        createContactLink(
          {
            className: "contactContentText contactLink",
            href: `tel:${normalizeTelHref(tel)}`,
            text: tel,
          },
          root,
        ),
      );
    }

    parts.forEach((node, index) => {
      if (index > 0) {
        contactContent.appendChild(
          createNode(root, "span", {
            className: "contactContentText",
            text: "|",
            attributes: { "aria-hidden": "true" },
          }),
        );
      }

      contactContent.appendChild(node);
    });
  }

  function createContactLink({ className, href, text }, root = document) {
    const link = createNode(root, "a", {
      className,
      text,
      attributes: { href },
    });
    return link;
  }

  function normalizeTelHref(value) {
    return String(value).replace(/[^\d+]/g, "");
  }

  function normalizePercent(value) {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return 0;
    }

    return Math.max(0, Math.min(100, number));
  }

  function fileToLabel(value) {
    return String(value || "")
      .replace(/\.svg$/i, "")
      .replace(/[-_]+/g, " ")
      .trim();
  }

  window.cvStorage = {
    STORAGE_KEY,
    LAYOUT_STORAGE_KEY,
    DEFAULT_LAYOUT_VERSION,
    TOOL_LIBRARY,
    defaultCVData,
    getCVData,
    saveCVData,
    resetCVData,
    getLayoutVersion,
    saveLayoutVersion,
    resetLayoutVersion,
    applyLayoutVersion,
    renderCV,
    renderAvatar,
    clone,
    mergeWithDefault,
    normalizePercent,
    normalizeToolsData,
    getToolCategories,
    getToolCatalog,
    buildToolIconPath,
    fileToLabel,
    normalizeLayoutVersion,
  };
})();
