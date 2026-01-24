
/* // ===== Global Configuration ===== */
const defaultConfig = {
  shop_name: "NAJIS CYBER CAFE",
  csc_id: "CSC12345678",
  owner_name: "Mohammad Najis",
  tagline: "सभी सरकारी सेवाएं एक जगह",
  phone_1: "9572188557",
  phone_2: "9262755215",
  whatsapp: "919572188557",
  location: "पटना, बिहार",
  whatsapp_group: "https://chat.whatsapp.com/G2Is5h6YrSWE9P0ISrxyUi",
  whatsapp_channel: "https://whatsapp.com/channel/0029VakVRGQBqbr7ZrYZ8l42",
  background_color: "#f0f4f8",
  header_color: "#2563eb",
  card_color: "#ffffff",
  accent_color: "#10b981",
  text_color: "#1f2937",
  font_family: "Poppins",
  font_size: 16
};

/* // ===== Global Variables ===== */
let allData = []; // Stores all dynamic data (jobs, results, admits, etc.)
let donationConfig = {
  upiId: "9709701986@ybl",
  payeeName: "NAJIS CYBER CAFE"
};

let currentPage = 'home';         // Tracks current page
let clickCount = 0;               // For admin login trigger
let clickTimer = null;            // Timer for click tracking
let isAdminLoggedIn = false;      // Admin login status
let isSampleDataAdded = false;    // Sample data flag
let searchText = "";              // Search input text
let itemCounter = 0;              // Counter for items rendered

/* // ===== Smart Search Matching ===== */
function smartMatch(text, query) {
  if (!query) return true;

  text = text.toLowerCase();
  query = query.toLowerCase().trim();

  // Normalize spaces
  query = query.replace(/\s+/g, " ");

  // Split query into words
  const qWords = query.split(" ");

  // Return true if any word matches the text
  return qWords.some(word => text.includes(word));
}

/* // ===== Page Navigation ===== */
function navigateTo(page) {
  currentPage = page;

  // Reset search input on tab change
  searchText = "";
  const input = document.getElementById("page-search-input");
  if (input) input.value = "";

  updatePageContent();
}

/* // ===== UpdateCounts Function ===== */
function updateCounts() {
  const app = document.getElementById('app');
  if (!app) return;

  // Use dynamic config if available, else fallback to default
  const config = window.elementSdk?.config || defaultConfig;
  const accentColor = config.accent_color;
  const baseFontSize = config.font_size;

  // Filter data by type
  const jobs = allData.filter(item => item.type === 'job');
  const results = allData.filter(item => item.type === 'result');
  const admits = allData.filter(item => item.type === 'admit');
  const admissions = allData.filter(item => item.type === 'admission');

  // Update count cards
  const updateCard = (selector, label, count) => {
    const card = app.querySelector(selector);
    if (card) {
      card.textContent = `${count} ${label}`;
      card.style.color = accentColor;
      card.style.fontSize = `${baseFontSize * 1.1}px`;
    }
  };

  updateCard('#jobs-count-card', 'Jobs Available', jobs.length);
  updateCard('#results-count-card', 'Results', results.length);
  updateCard('#admits-count-card', 'Admit Cards', admits.length);
  updateCard('#admissions-count-card', 'Admissions', admissions.length);

  // Update navigation tab labels
  const updateNav = (selector, icon, label, count) => {
    const nav = app.querySelector(selector);
    if (nav) nav.textContent = `${icon} ${label} (${count})`;
  };

  updateNav('.nav-link[data-page="jobs"]', '💼', 'Jobs', jobs.length);
  updateNav('.nav-link[data-page="results"]', '📊', 'Results', results.length);
  updateNav('.nav-link[data-page="admits"]', '🎫', 'Admit Cards', admits.length);
  updateNav('.nav-link[data-page="admissions"]', '🎓', 'Admissions', admissions.length);
}

/* // ===== updatePageContent Function ===== */
function updatePageContent() {
  const app = document.getElementById('app');
  if (!app) return;

  // Highlight active nav tab
  app.querySelectorAll('.nav-link').forEach(link => {
    const linkPage = link.getAttribute('data-page');
    const isActive = linkPage === currentPage;
    link.style.fontWeight = isActive ? '700' : '600';
    link.style.borderBottom = isActive ? '3px solid white' : 'none';
  });

  // Page sections mapped by ID
  const sections = {
    home: '#home-content',
    jobs: '#jobs-content',
    results: '#results-content',
    admits: '#admits-content',
    admissions: '#admissions-content'
  };

  // Show/hide sections
  Object.entries(sections).forEach(([page, selector]) => {
    const section = app.querySelector(selector);
    if (section) section.style.display = currentPage === page ? 'block' : 'none';
  });

  // Trigger render functions
  switch (currentPage) {
    case 'jobs': renderJobsList(); break;
    case 'results': renderResultsList(); break;
    case 'admits': renderAdmitsList(); break;
    case 'admissions': renderAdmissionsList(); break;
    case 'home':
      initHomeCounts();
      initNavCounts();
      initHomeLatestPreviews();
      break;
  }

  // Show/hide search box
  const searchBox = document.getElementById("page-search-box");
  const searchInput = document.getElementById("page-search-input");
  const searchablePages = ["jobs", "results", "admits", "admissions"];

  if (searchBox) {
    if (searchablePages.includes(currentPage)) {
      searchBox.style.display = "flex";
    } else {
      searchBox.style.display = "none";
      searchText = "";
      if (searchInput) searchInput.value = "";
    }
  }
}

/* // ===== fetchJobsFromFirestore Function ===== */
async function fetchJobsFromFirestore() {
  // Fetch documents from 'jobs' collection ordered by creation date (newest first)
  const snapshot = await window.firebaseFirestore
    .collection("jobs")
    .orderBy("created_at", "desc")
    .get();

  // Format each document with its ID and data
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/* // ===== initHomeCounts Function ===== */
function initHomeCounts() {
  // Wait until Firebase is ready
  if (!window.fb) {
    setTimeout(initHomeCounts, 300);
    return;
  }

  // Get homepage count cards
  const jobsCard = document.getElementById('jobs-count-card');
  const resultsCard = document.getElementById('results-count-card');
  const admitsCard = document.getElementById('admits-count-card');
  const admissionsCard = document.getElementById('admissions-count-card');

  // Listen for live job updates
  window.fb.listen("jobs", jobs => {
    if (jobsCard) jobsCard.textContent = `${jobs.length} Jobs Available`;
  });

  // Listen for live result updates
  window.fb.listen("results", results => {
    if (resultsCard) resultsCard.textContent = `${results.length} Results`;
  });

  // Listen for live admit card updates
  window.fb.listen("admits", admits => {
    if (admitsCard) admitsCard.textContent = `${admits.length} Admit Cards`;
  });

  // Listen for live admission updates
  window.fb.listen("admissions", admissions => {
    if (admissionsCard) admissionsCard.textContent = `${admissions.length} Admissions`;
  });
}

/* // ===== initNavCounts Function ===== */
function initNavCounts() {
  // Wait until Firebase is ready
  if (!window.fb) {
    setTimeout(initNavCounts, 300);
    return;
  }

  // Get navigation tab elements
  const navJobs = document.querySelector('.nav-link[data-page="jobs"]');
  const navResults = document.querySelector('.nav-link[data-page="results"]');
  const navAdmits = document.querySelector('.nav-link[data-page="admits"]');
  const navAdmissions = document.querySelector('.nav-link[data-page="admissions"]');

  // Listen for live job updates
  window.fb.listen("jobs", jobs => {
    if (navJobs) navJobs.textContent = `💼 Jobs (${jobs.length})`;
  });

  // Listen for live result updates
  window.fb.listen("results", results => {
    if (navResults) navResults.textContent = `📊 Results (${results.length})`;
  });

  // Listen for live admit card updates
  window.fb.listen("admits", admits => {
    if (navAdmits) navAdmits.textContent = `🎫 Admit Cards (${admits.length})`;
  });

  // Listen for live admission updates
  window.fb.listen("admissions", admissions => {
    if (navAdmissions) navAdmissions.textContent = `🎓 Admissions (${admissions.length})`;
  });
}

/* // ===== initHomeLatestPreviews Function ===== */
function initHomeLatestPreviews() {
  // Wait until Firebase is ready
  if (!window.fb) {
    setTimeout(initHomeLatestPreviews, 300);
    return;
  }

  // Get preview containers
  const jobsBox = document.getElementById("latest-jobs-preview");
  const resultsBox = document.getElementById("latest-results-preview");
  const admitsBox = document.getElementById("latest-admits-preview");

  // Helper function to render latest items
  const renderLatest = (items, box, emptyMsg) => {
    if (!box) return;

    const latest = items
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5);

    box.innerHTML = latest.length === 0
      ? `<p>${emptyMsg}</p>`
      : latest.map((item, index) => `
  <div style="padding:10px 0; position:relative;">
    
    <strong style="display:block; font-weight:700;">
      ${item.title}
      ${item.isNew ? '<span class="new-badge">NEW</span>' : ''}
    </strong>

    <small style="color:#374151;">
      ${item.status}
    </small>

    ${index !== latest.length - 1
          ? `<div style="
            margin-top:10px;
            height:4px;
            background:linear-gradient(to right, #0055ff, transparent);
          "></div>`
          : ""
        }

  </div>
`).join("")
      ;
  };

  // Listen for latest jobs
  window.fb.listen("jobs", jobs => renderLatest(jobs, jobsBox, "No jobs yet"));

  // Listen for latest results
  window.fb.listen("results", results => renderLatest(results, resultsBox, "No results yet"));

  // Listen for latest admit cards
  window.fb.listen("admits", admits => renderLatest(admits, admitsBox, "No admit cards yet"));
}





/* // ===== editJob Function ===== */
window.editJob = function (id, title, posts, status, isNew) {
  const form = document.querySelector('#job-form');
  if (!form) return;

  // Fill form fields with job details
  document.querySelector('#job-title').value = title;
  document.querySelector('#job-posts').value = posts;
  document.querySelector('#job-status').value = status;
  document.querySelector('#job-is-new').checked = Boolean(isNew);

  // Mark form with edit mode (store job ID)
  form.setAttribute("data-edit-id", id);

  // Update submit button text
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Update Job";

  // Show status message
  showStatusMessage('job-status-msg', 'Edit mode enabled', 'info');
};

/* // ===== editResult Function ===== */
window.editResult = function (id, title, status, isNew) {
  const form = document.querySelector('#result-form');
  if (!form) return;

  // Fill form fields with result details
  document.querySelector('#result-title').value = title;
  document.querySelector('#result-status').value = status;
  document.querySelector('#result-is-new').checked = Boolean(isNew);

  // Mark form with edit mode (store result ID)
  form.setAttribute('data-edit-id', id);

  // Update submit button text
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Update Result";

  // Show status message
  showStatusMessage('result-status-msg', 'Edit mode enabled', 'info');
};

/* // ===== editAdmit Function ===== */
window.editAdmit = function (id, title, status, isNew) {
  const form = document.querySelector('#admit-form');
  if (!form) return;

  // Fill form fields with admit card details
  document.querySelector('#admit-title').value = title;
  document.querySelector('#admit-status').value = status;
  document.querySelector('#admit-is-new').checked = Boolean(isNew);

  // Mark form with edit mode (store admit card ID)
  form.setAttribute('data-edit-id', id);

  // Update submit button text
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Update Admit Card";

  // Show status message
  showStatusMessage('admit-status-msg', 'Edit mode enabled', 'info');
};

let editingNoticeId = null;

window.editNotice = function (id, title, isNew) {
  editingNoticeId = id;

  const titleInput = document.getElementById("notice-title");
  const isNewCheckbox = document.getElementById("notice-is-new");
  const submitBtn = document.querySelector("#notice-form button");

  if (titleInput) titleInput.value = title;
  if (isNewCheckbox) isNewCheckbox.checked = Boolean(isNew);
  if (submitBtn) submitBtn.innerText = "Update Notice";

  // optional: ensure notices tab is visible
  switchAdminTab("notices");
};


/* // ===== editAdmission Function ===== */
window.editAdmission = function (id, title, status, isNew) {
  const form = document.querySelector('#admission-form');
  if (!form) return;

  // Fill form fields with admission details
  document.querySelector('#admission-title').value = title;
  document.querySelector('#admission-status').value = status;
  document.querySelector('#admission-is-new').checked = Boolean(isNew);

  // Mark form with edit mode (store admission ID)
  form.setAttribute('data-edit-id', id);

  // Update submit button text
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.textContent = "Update Admission";

  // Show status message
  showStatusMessage('admission-status-msg', 'Edit mode enabled', 'info');
};




/* // ===== deleteItem Function ===== */
window.deleteItem = async function (collection, id) {
  // Confirm before deleting
  const confirmed = confirm("Delete this item?");
  if (!confirmed) return;

  try {
    // Log action for debugging
    console.log("Deleting:", collection, id);

    // Remove item from Firebase
    await window.fb.remove(collection, id);

    // Success message
    alert("Deleted successfully");
  } catch (err) {
    // Log error and show failure message
    console.error("Delete error:", err);
    alert("Delete failed");
  }
};

/* // ===== deleteItem Function ===== */
window.deleteItem = async function (collection, id) {
  // Confirm before deleting
  const confirmed = confirm("Are you sure you want to delete?");
  if (!confirmed) return;

  try {
    // Remove item from Firebase
    await window.fb.remove(collection, id);
    alert("Deleted successfully");
  } catch (err) {
    // Log error and show failure message
    console.error("Delete error:", err);
    alert("Delete failed");
  }
};




/* // ===== loadAdminJobs Function ===== */
function loadAdminJobs() {
  window.fb.listen("jobs", jobs => {
    // Sort jobs by latest createdAt
    jobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const jobsList = document.getElementById("jobs-list");
    const jobsCount = document.querySelector("#admin-tab-jobs h5");
    if (!jobsList) return;

    // Handle empty state
    if (jobs.length === 0) {
      jobsList.innerHTML = "<p>No jobs added yet</p>";
      if (jobsCount) jobsCount.textContent = "Existing Jobs (0)";
      return;
    }

    // Update count
    if (jobsCount) jobsCount.textContent = `Existing Jobs (${jobs.length})`;

    // Render job items
    jobsList.innerHTML = jobs.map(job => `
      <div class="item-row">
        <span style="flex:1">
          ${job.title}
          ${job.isNew ? '<span class="new-badge">NEW</span>' : ''}
        </span>
   <div class="admin-actions">
  <button class="btn-edit"
    onclick="editJob(
      '${job.id}',
      '${job.title.replace(/'/g, "\\'")}',
      '${job.posts}',
      '${job.status}',
      ${job.isNew}
    )">
    ✏️ Edit
  </button>

  <button class="btn-delete"
    onclick="deleteItem('jobs','${job.id}')">
    🗑 Delete
  </button>
</div>
  </div>
    `).join('');
  });
}

/* // ===== loadAdminResults Function ===== */
function loadAdminResults() {
  window.fb.listen("results", items => {
    // Sort results by latest createdAt
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const list = document.getElementById("results-list");
    const count = document.querySelector("#admin-tab-results h5");
    if (!list) return;

    // Handle empty state
    if (items.length === 0) {
      list.innerHTML = "<p>No results added yet</p>";
      if (count) count.textContent = "Existing Results (0)";
      return;
    }

    // Update count
    if (count) count.textContent = `Existing Results (${items.length})`;

    // Render result items
    list.innerHTML = items.map(i => `
      <div class="item-row">
        <span style="flex:1">
          ${i.title}
          ${i.isNew ? '<span class="new-badge">NEW</span>' : ''}
        </span>
     <div class="admin-actions">
  <button class="btn-edit"
    onclick="editResult(
      '${i.id}',
      '${i.title.replace(/'/g, "\\'")}',
      '${i.status}',
      ${i.isNew}
    )">
    ✏️ Edit
  </button>

  <button class="btn-delete"
    onclick="deleteItem('results','${i.id}')">
    🗑 Delete
  </button>
</div>
   </div>
    `).join("");
  });
}

/* // ===== loadAdminAdmits Function ===== */
function loadAdminAdmits() {
  window.fb.listen("admits", items => {
    // Sort admit cards by latest createdAt
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const list = document.getElementById("admits-list");
    const count = document.querySelector("#admin-tab-admits h5");
    if (!list) return;

    // Handle empty state
    if (items.length === 0) {
      list.innerHTML = "<p>No admit cards added yet</p>";
      if (count) count.textContent = "Existing Admit Cards (0)";
      return;
    }

    // Update count
    if (count) count.textContent = `Existing Admit Cards (${items.length})`;

    // Render admit card items
    list.innerHTML = items.map(i => `
      <div class="item-row">
        <span style="flex:1">
          ${i.title}
          ${i.isNew ? '<span class="new-badge">NEW</span>' : ''}
        </span>
        <button onclick="editAdmit(
  <div class="admin-actions">
  <button class="btn-edit"
    onclick="editAdmit(
      '${i.id}',
      '${i.title.replace(/'/g, "\\'")}',
      '${i.status}',
      ${i.isNew}
    )">
    ✏️ Edit
  </button>

  <button class="btn-delete"
    onclick="deleteItem('admits','${i.id}')">
    🗑 Delete
  </button>
</div>
    </div>
    `).join("");
  });
}

/* // ===== loadAdminAdmissions Function ===== */
function loadAdminAdmissions() {
  window.fb.listen("admissions", items => {
    // Sort admissions by latest createdAt
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const list = document.getElementById("admissions-list");
    const count = document.querySelector("#admin-tab-admissions h5");
    if (!list) return;

    // Handle empty state
    if (items.length === 0) {
      list.innerHTML = "<p>No admissions added yet</p>";
      if (count) count.textContent = "Existing Admissions (0)";
      return;
    }

    // Update count
    if (count) count.textContent = `Existing Admissions (${items.length})`;

    // Render admission items
    list.innerHTML = items.map(i => `
      <div class="item-row">
        <span style="flex:1">
          ${i.title}
          ${i.isNew ? '<span class="new-badge">NEW</span>' : ''}
        </span>
<div class="admin-actions">
  <button class="btn-edit"
    onclick="editAdmission(
      '${i.id}',
      '${i.title.replace(/'/g, "\\'")}',
      '${i.status}',
      ${i.isNew}
    )">
    ✏️ Edit
  </button>

  <button class="btn-delete"
    onclick="deleteItem('admissions','${i.id}')">
    🗑 Delete
  </button>
</div>
    </div>
    `).join("");
  });
}

/* // ===== loadAdminNotices Function ===== */
function loadAdminNotices() {
  window.fb.listen("notices", notices => {
    const box = document.getElementById("notices-list");
    if (!box) return;

    box.innerHTML = notices.map(n => `
  <div class="item-row" style="display:flex;justify-content:space-between;gap:10px;">
    
    <div style="flex:1;font-weight:600;">
      ${n.title}
      ${n.isNew ? '<span class="new-badge">NEW</span>' : ''}
    </div>

    <div class="admin-actions">
      <button 
        class="btn-edit notice-edit-btn"
        data-id="${n.id}"
        data-title="${n.title.replace(/"/g, "&quot;")}"
        data-isnew="${n.isNew}"
      >
        ✏️ Edit
      </button>

      <button 
        class="btn-delete"
        onclick="deleteItem('notices','${n.id}')"
      >
        🗑 Delete
      </button>
    </div>
  </div>
`).join("");



  });
}



// ✅ NOTICE EDIT BUTTON (MODULE SAFE)
document.addEventListener("click", function (e) {
  const btn = e.target.closest(".notice-edit-btn");
  if (!btn) return;

  const id = btn.dataset.id;
  const title = btn.dataset.title;
  const isNew = btn.dataset.isnew === "true";

  editingNoticeId = id;

  const titleInput = document.getElementById("notice-title");
  const isNewCheckbox = document.getElementById("notice-is-new");
  const submitBtn = document.querySelector("#notice-form button");

  if (titleInput) titleInput.value = title;
  if (isNewCheckbox) isNewCheckbox.checked = isNew;
  if (submitBtn) submitBtn.innerText = "Update Notice";

  switchAdminTab("notices");
});


/* // ===== loadDonationSettings Function ===== */
function loadDonationSettings() {
  // Retry until Firebase is ready
  if (!window.fb) {
    setTimeout(loadDonationSettings, 300);
    return;
  }

  // Listen for settings updates
  window.fb.listen("settings", async (items) => {
    const donation = items.find(i => i.id === "donation");

    // ✅ If donation settings missing, create default entry
    if (!donation) {
      await window.fb.update("settings", "donation", {
        upiId: donationConfig.upiId || "",
        payeeName: donationConfig.payeeName || "",
        createdAt: Date.now()
      });
      return;
    }

    // Update local config
    donationConfig.upiId = donation.upiId;
    donationConfig.payeeName = donation.payeeName;

    // Update UI elements safely
    const currentUpi = document.getElementById("current-upi");
    if (currentUpi) currentUpi.textContent = donation.upiId;

    const currentPayee = document.getElementById("current-payee");
    if (currentPayee) currentPayee.textContent = donation.payeeName;

    const upiText = document.getElementById("upi-id-text");
    if (upiText) upiText.textContent = donation.upiId;
  });
}




/* // ===== renderJobsList Function ===== */
function renderJobsList() {
  const box = document.getElementById("jobs-list-container");
  if (!box) return;

  // Show loading state
  box.innerHTML = "Loading jobs...";

  // Listen for jobs data from Firebase
  window.fb.listen("jobs", jobs => {
    // Filter jobs based on search text
    jobs = jobs.filter(job =>
      smartMatch(job.title + " " + job.status, searchText)
    );

    // Sort jobs by latest createdAt
    jobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Handle empty state
    if (jobs.length === 0) {
      box.innerHTML = "No jobs available";
      return;
    }

    // Clear container before rendering
    box.innerHTML = "";

    // Render job cards (HOME PAGE)
    jobs.forEach(job => {
      box.innerHTML += `
    <div style="background:white;padding:15px;border-radius:8px;
      box-shadow:0 2px 6px rgba(0,0,0,0.1);
      margin-bottom:14px;">
      
      <h3 style="font-weight:700">
        ${job.title.replace(/'/g, "\\'")}
        ${job.isNew ? '<span class="new-badge">NEW</span>' : ''}
      </h3>

      <p><b>Posts:</b> ${job.posts}</p>
      <p><b>Status:</b> ${job.status}</p>
    </div>
  `;
    });

  });
}

/* // ===== renderResultsList Function ===== */
function renderResultsList() {
  const box = document.getElementById("results-list-container");
  if (!box) return;

  // Show loading state
  box.innerHTML = "Loading results...";

  // Listen for results data from Firebase
  window.fb.listen("results", results => {
    // Filter results based on search text
    results = results.filter(r =>
      smartMatch(r.title + " " + r.status, searchText)
    );

    // Sort results by latest createdAt
    results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Handle empty state
    if (results.length === 0) {
      box.innerHTML = "No results available";
      return;
    }

    // Clear container before rendering
    box.innerHTML = "";

    // Render result cards
    results.forEach(result => {
      box.innerHTML += `
        <div style="background:white;padding:15px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1)">
          <h3 style="font-weight:700">
            ${result.title.replace(/'/g, "\\'")}
            ${result.isNew ? '<span class="new-badge">NEW</span>' : ''}
          </h3>
          <p><b>Status:</b> ${result.status}</p>
        </div>
      `;
    });
  });
}

/* // ===== renderAdmitsList Function ===== */
function renderAdmitsList() {
  const box = document.getElementById("admits-list-container");
  if (!box) return;

  // Show loading state
  box.innerHTML = "Loading admit cards...";

  // Listen for admit cards data from Firebase
  window.fb.listen("admits", admits => {
    // Filter admits based on search text
    admits = admits.filter(a =>
      smartMatch(a.title + " " + a.status, searchText)
    );

    // Sort admits by latest createdAt
    admits.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Handle empty state
    if (admits.length === 0) {
      box.innerHTML = "No admit cards available";
      return;
    }

    // Clear container before rendering
    box.innerHTML = "";

    // Render admit card items
    admits.forEach(admit => {
      box.innerHTML += `
        <div style="background:white;padding:15px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1)">
          <h3 style="font-weight:700">
            ${admit.title.replace(/'/g, "\\'")}
            ${admit.isNew ? '<span class="new-badge">NEW</span>' : ''}
          </h3>
          <p><b>Status:</b> ${admit.status}</p>
        </div>
      `;
    });
  });
}

/* // ===== renderAdmissionsList Function ===== */
function renderAdmissionsList() {

  const box = document.getElementById("admissions-list-container");
  if (!box) return;

  // Show loading state
  box.innerHTML = "Loading admissions...";

  // Listen for admissions data from Firebase
  window.fb.listen("admissions", admissions => {
    // Filter admissions based on search text
    admissions = admissions.filter(ad =>
      smartMatch(ad.title + " " + ad.status, searchText)
    );

    // Sort admissions by latest createdAt
    admissions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Handle empty state
    if (admissions.length === 0) {
      box.innerHTML = "No admissions available";
      return;
    }

    // Clear container before rendering
    box.innerHTML = "";

    // Render admission cards
    admissions.forEach(admission => {
      box.innerHTML += `
          <div style="background:white;padding:15px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1)">
            <h3 style="font-weight:700">
              ${admission.title.replace(/'/g, "\\'")}
              ${admission.isNew ? '<span class="new-badge">NEW</span>' : ''}
            </h3>
            <p><b>Status:</b> ${admission.status}</p>
          </div>
        `;
    });
  });
}

/* ===== renderNotices Function ===== */
function renderNotices() {
  if (!window.fb) {
    setTimeout(renderNotices, 300);
    return;
  }

  const noticeBox = document.getElementById("notice-list");
  if (!noticeBox) return;

  window.fb.listen("notices", notices => {
    // sort latest first
    notices.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // show only latest 5
    const latest = notices.slice(0, 5);

    if (latest.length === 0) {
      noticeBox.innerHTML = "<p>No notices available</p>";
      return;
    }

    noticeBox.innerHTML = latest.map(n => `
        <div style="
          padding:6px 0;
          border-bottom:1px dashed #f59e0b;
          font-size:14px;
          font-weight:600;
          color:#374151;
        ">
          • ${n.title}
          ${n.isNew ? `<span class="new-badge">NEW</span>` : ""}
        </div>
      `).join("");
  });
}

/* // ===== editJobFromFirebase Function ===== */
window.editJobFromFirebase = function (job) {
  const form = document.querySelector('#job-form');
  if (!form) return;

  // Fill form fields with job details
  const titleField = document.querySelector('#job-title');
  const postsField = document.querySelector('#job-posts');
  const statusField = document.querySelector('#job-status');

  if (titleField) titleField.value = job.title || "";
  if (postsField) postsField.value = job.posts || "";
  if (statusField) statusField.value = job.status || "";

  // Mark form with edit mode (store job ID)
  form.setAttribute('data-edit-id', job.id);

  // Show status message
  showStatusMessage('job-status-msg', 'Edit mode enabled', 'info');
};



/* // ===== switchAdminTab Function ===== */
function switchAdminTab(tabName) {
  const app = document.getElementById('app');
  if (!app) return;

  // Toggle active class on tabs
  const tabs = app.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    const isActive = tab.getAttribute('data-tab') === tabName;
    tab.classList.toggle('active', isActive);
  });

  // Hide all tab contents
  const tabContents = app.querySelectorAll('.admin-tab-content');
  tabContents.forEach(content => {
    content.style.display = 'none';
  });

  // Show the selected tab content
  const activeContent = app.querySelector(`#admin-tab-${tabName}`);
  if (activeContent) {
    activeContent.style.display = 'block';
  }
}




/* // ===== copyUPIId Function ===== */
function copyUPIId() {
  const upiId = donationConfig.upiId;
  if (!upiId) {
    showPaymentStatus("UPI not available", "error");
    return;
  }

  // Modern clipboard API support
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(upiId)
      .then(() => {
        showPaymentStatus("✓ UPI ID Copied!", "success");
      })
      .catch(() => {
        // Fallback if copy fails
        showPaymentStatus("UPI ID: " + upiId, "info");
      });
  } else {
    // Fallback if clipboard API not supported
    showPaymentStatus("UPI ID: " + upiId, "info");
  }
}

/* // ===== openUPIPay Function ===== */
function openUPIPay(amount) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Construct UPI payment URL
  const upiUrl =
    "upi://pay?pa=" + encodeURIComponent(donationConfig.upiId) +
    "&pn=" + encodeURIComponent(donationConfig.payeeName) +
    "&am=" + encodeURIComponent(amount) +
    "&cu=INR";

  if (isMobile) {
    // 📱 MOBILE → open UPI app directly
    window.location.href = upiUrl;
  } else {
    // 💻 DESKTOP → show QR + auto-scroll
    showDynamicQR(amount);

    setTimeout(() => {
      const qrElement = document.getElementById("dynamic-qr");
      if (qrElement) {
        qrElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }
}

/* // ===== Custom Pay Button Click Handler ===== */
document.addEventListener("click", function (e) {
  if (e.target?.id === "custom-pay-btn") {
    const input = document.getElementById("custom-amount");
    if (!input) return;

    // Parse entered amount safely
    const amount = parseInt(input.value, 10);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      showPaymentStatus("Please enter a valid amount", "error");
      return;
    }

    // Trigger UPI payment flow
    openUPIPay(amount);
  }
});

/* // ===== showDynamicQR Function ===== */
function showDynamicQR(amount) {
  // Construct UPI payment link
  const upiLink =
    "upi://pay?pa=" + encodeURIComponent(donationConfig.upiId) +
    "&pn=" + encodeURIComponent(donationConfig.payeeName) +
    "&am=" + encodeURIComponent(amount) +
    "&cu=INR";

  const qrDiv = document.getElementById("dynamic-qr");
  if (!qrDiv) return;

  // Render QR code + message
  qrDiv.innerHTML = `
    <img 
      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}"
      alt="UPI Payment QR"
      style="width:200px;display:block;margin:0 auto"
    >
    <p style="font-size:13px;text-align:center;font-weight:700;margin-top:6px">
      Scan to pay ₹${amount}
    </p>
  `;
}

/* // ===== showPaymentStatus Function ===== */
function showPaymentStatus(message, type) {
  const statusDiv = document.getElementById('payment-status');
  if (!statusDiv) return;

  // Set message and make visible
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';

  // Apply styles based on type
  switch (type) {
    case 'success':
      statusDiv.style.backgroundColor = '#d1fae5'; // light green
      statusDiv.style.color = '#065f46';           // dark green
      break;
    case 'error':
      statusDiv.style.backgroundColor = '#fee2e2'; // light red
      statusDiv.style.color = '#991b1b';           // dark red
      break;
    default:
      statusDiv.style.backgroundColor = '#dbeafe'; // light blue
      statusDiv.style.color = '#1e40af';           // dark blue
      break;
  }

  // Hide after 3 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}




/* // ===== editItem Function ===== */
window.editItem = function (backendId) {
  const item = allData.find(d => d.__backendId === backendId);
  if (!item) return;

  const app = document.getElementById('app');
  if (!app) return;

  // Helper to fill form fields
  function fillForm({ titleSel, postsSel, statusSel, isNewSel, formSel, btnText, tabName }, values) {
    const titleInput = app.querySelector(titleSel);
    const postsInput = postsSel ? app.querySelector(postsSel) : null;
    const statusInput = app.querySelector(statusSel);
    const isNewCheckbox = app.querySelector(isNewSel);
    const submitBtn = app.querySelector(`${formSel} button[type="submit"]`);

    if (titleInput) titleInput.value = values.title || '';
    if (postsInput) postsInput.value = values.posts || '';
    if (statusInput) statusInput.value = values.status || '';
    if (isNewCheckbox) isNewCheckbox.checked = values.isNew || false;

    if (submitBtn) {
      submitBtn.textContent = btnText;
      submitBtn.setAttribute('data-edit-id', backendId);
    }

    switchAdminTab(tabName);
  }

  // Handle different item types
  if (item.type === 'job') {
    fillForm(
      {
        titleSel: '#job-title',
        postsSel: '#job-posts',
        statusSel: '#job-status',
        isNewSel: '#job-is-new',
        formSel: '#job-form',
        btnText: 'Update Job',
        tabName: 'jobs'
      },
      {
        title: item.job_title,
        posts: item.job_posts,
        status: item.job_status,
        isNew: item.job_is_new
      }
    );
  } else if (item.type === 'result') {
    fillForm(
      {
        titleSel: '#result-title',
        statusSel: '#result-status',
        isNewSel: '#result-is-new',
        formSel: '#result-form',
        btnText: 'Update Result',
        tabName: 'results'
      },
      {
        title: item.result_title,
        status: item.result_status,
        isNew: item.result_is_new
      }
    );
  } else if (item.type === 'admit') {
    fillForm(
      {
        titleSel: '#admit-title',
        statusSel: '#admit-status',
        isNewSel: '#admit-is-new',
        formSel: '#admit-form',
        btnText: 'Update Admit Card',
        tabName: 'admits'
      },
      {
        title: item.admit_title,
        status: item.admit_status,
        isNew: item.admit_is_new
      }
    );
  } else if (item.type === 'admission') {
    fillForm(
      {
        titleSel: '#admission-title',
        statusSel: '#admission-status',
        isNewSel: '#admission-is-new',
        formSel: '#admission-form',
        btnText: 'Update Admission',
        tabName: 'admissions'
      },
      {
        title: item.admission_title,
        status: item.admission_status,
        isNew: item.admission_is_new
      }
    );
  }
};

/* // ===== showStatusMessage Function ===== */
function showStatusMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Set message text
  element.textContent = message;

  // Apply color based on type
  switch (type) {
    case 'success':
      element.style.color = '#10b981'; // green
      break;
    case 'error':
      element.style.color = '#ef4444'; // red
      break;
    default:
      element.style.color = '#f59e0b'; // amber
      break;
  }

  // Auto-clear message for success/error after 3 seconds
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      element.textContent = '';
    }, 3000);
  }
}

function renderContent(config) {
  const backgroundColor = config.background_color || defaultConfig.background_color;
  const headerColor = config.header_color || defaultConfig.header_color;
  const cardColor = config.card_color || defaultConfig.card_color;
  const accentColor = config.accent_color || defaultConfig.accent_color;
  const textColor = config.text_color || defaultConfig.text_color;
  const customFont = config.font_family || defaultConfig.font_family;
  const baseFontSize = config.font_size || defaultConfig.font_size;

  const jobs = allData.filter(item => item.type === 'job');
  const results = allData.filter(item => item.type === 'result');
  const admits = allData.filter(item => item.type === 'admit');
  const admissions = allData.filter(item => item.type === 'admission');

  const services = [
    "Ration Card", "Voter Card", "PAN Card (Personal & Society)", "Ayushman Card", "Labour Card (Update)",
    "Kisan Credit Card", "Divyang Card + Disability Certificate", "PRAN Card", "Farmer Registration", "Passport Service",
    "Rail Ticket", "EPFO (PF)", "Bike Insurance", "Driving License", "Jeevan Jyoti Premium Payment",
    "Bill Payment", "Caste/Residence/Income Certificate", "Admission Form", "JOB VACANCY INFORMATION", "Cash Withdrawal/Deposit",
    "Scholarship Form", "Aadhar Card Print", "Photocopy", "SIM Activation", "Passport Size Photo",
    "GST Registration", "ABC ID Card", "E-KYC Pension", "Health Card", "Diesel Subsidy",
    "Examination", "PM Kisan Application & E-KYC", "Crop Insurance", "Recharge", "Dakhil Kharij",
    "Land Receipt", "New Ration Card + Name Add/Remove", "Online Scholarship", "Jeevan Pramaan", "FASTag",
    "Biodata (CV/RESUME)", "Crop Insurance", "New Electricity Connection", "Passport", "Online Account Opening",
    "Aadhar Card Correction", "Online New Gas Connection", "SIM Recharge"
  ];

  const app = document.getElementById('app');
  app.innerHTML = `
        <main style="width: 100%; min-height: 100%; background-color: ${backgroundColor}; font-family: ${customFont}, sans-serif; padding: 1rem;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); color: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
              <div style="flex: 1; min-width: 200px;">
                <h1 id="admin-trigger" style="font-size: ${baseFontSize * 1.8}px; font-weight: 800; margin-bottom: 0.25rem; cursor: pointer; user-select: none;">🏪 ${config.shop_name || defaultConfig.shop_name}</h1>
                <p style="font-size: ${baseFontSize * 0.95}px; opacity: 0.95; font-weight: 500;">📍 ${config.location || defaultConfig.location}</p>
                <p style="font-size: ${baseFontSize * 0.85}px; opacity: 0.9; margin-top: 0.25rem;">🆔 CSC ID: ${config.csc_id || defaultConfig.csc_id}</p>
              </div>
              <div style="text-align: right;">
                <p style="font-size: ${baseFontSize * 1.1}px; font-weight: 700; margin-bottom: 0.5rem;">👤 Owner: ${config.owner_name || defaultConfig.owner_name}</p>
                <p style="font-size: ${baseFontSize * 0.9}px; font-weight: 600;">✨ ${config.tagline || defaultConfig.tagline}</p>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div style="background-color: ${headerColor}; border-radius: 8px; padding: 0.75rem; margin-bottom: 0rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow-x: auto; white-space: nowrap;">
            <div style="display: inline-flex; gap: 1rem; min-width: 100%;">
              <div class="nav-link" data-page="home" style="color: white; padding: 0.5rem 1rem; font-weight: 600; font-size: ${baseFontSize * 0.9}px; border-bottom: 3px solid white;">🏠 Home</div>
              <div class="nav-link" data-page="jobs" style="color: white; padding: 0.5rem 1rem; font-weight: 600; font-size: ${baseFontSize * 0.9}px;">💼 Jobs (${jobs.length})</div>
              <div class="nav-link" data-page="results" style="color: white; padding: 0.5rem 1rem; font-weight: 600; font-size: ${baseFontSize * 0.9}px;">📊 Results (${results.length})</div>
              <div class="nav-link" data-page="admits" style="color: white; padding: 0.5rem 1rem; font-weight: 600; font-size: ${baseFontSize * 0.9}px;">🎫 Admit Cards (${admits.length})</div>
              <div class="nav-link" data-page="admissions" style="color: white; padding: 0.5rem 1rem; font-weight: 600; font-size: ${baseFontSize * 0.9}px;">🎓 Admissions (${admissions.length})</div>
            </div>
          </div>

          <!-- Separator Line -->
          <div style="height: 2px; background: linear-gradient(90deg, transparent 0%, ${headerColor} 50%, transparent 100%); margin: 0.5rem 0;"></div>

          <!-- Scrolling Marquee Text -->
          <div style="background: linear-gradient(135deg, ${accentColor} 0%, ${headerColor} 100%); border-radius: 8px; padding: 0.75rem; margin-bottom: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; margin-top: 0.5rem;">
            <marquee behavior="scroll" direction="left" scrollamount="5" style="color: white; font-weight: 700; font-size: ${baseFontSize * 0.95}px;">
              ✅ All Government Services Available | 📝 Fill Online Forms from Home | 📞 Call: ${config.phone_1 || defaultConfig.phone_1}
            </marquee>
          </div>

      
          <!-- 🔍 PAGE SEARCH (Jobs / Results / Admit / Admission) -->
<div id="page-search-box"
     style="display:none; margin:14px auto; max-width:520px;
            background:#ffffff; padding:10px 12px;
            border-radius:12px;
            box-shadow:0 4px 12px rgba(0,0,0,0.12);
            display:flex; gap:10px; align-items:center;">

  <input
    id="page-search-input"
    type="text"
    placeholder="Search..."
    style="
      flex:1;
      padding:10px 14px;
      border-radius:8px;
      border:1.5px solid ${headerColor};
      outline:none;
      font-size:14px;
    "
  />

  <button id="page-search-clear"
          style="
            background:#ef4444;
            color:white;
            border:none;
            border-radius:8px;
            padding:8px 12px;
            cursor:pointer;
            font-size:14px;
          ">
    Clear
  </button>
</div>


          <!-- Home Content -->
          <div id="home-content">
            <!-- 🔔 NOTICE BOARD -->
<div id="notice-board"
  style="
    display:none;
    background:#fff7ed;
    border:2px solid #f59e0b;
    border-radius:10px;
    padding:1rem;
    margin-bottom:1.5rem;
    box-shadow:0 4px 10px rgba(0,0,0,0.1);
  ">


  <h3 style="
    font-weight:800;
    color:#b45309;
    margin-bottom:0.75rem;
    display:flex;
    align-items:center;
    gap:8px;
  ">
    🔔 Latest Notices
  </h3>

  <div id="notice-list">
    Loading notices...
  </div>

</div>

            <!-- Services Section -->
            <div style="margin-bottom: 1.5rem;">
              <h2 style="color: ${headerColor}; font-size: ${baseFontSize * 1.5}px; font-weight: 800; margin-bottom: 1rem; text-align: center;">Our Services</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                <div class="service-card" style="background-color: ${cardColor}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
                  <div style="font-size: ${baseFontSize * 2.5}px; margin-bottom: 0.75rem;">💼</div>
                  <h3 style="color: ${headerColor}; font-size: ${baseFontSize * 1.1}px; font-weight: 700; margin-bottom: 0.5rem;">Job Updates</h3>
                  <p style="color: ${textColor}; font-size: ${baseFontSize * 0.9}px;">Latest Government Job Information</p>
                  <p id="jobs-count-card" style="color: ${accentColor}; font-weight: 700; font-size: ${baseFontSize * 1.1}px; margin-top: 0.5rem;">${jobs.length} Jobs Available</p>
                </div>
                <div class="service-card" style="background-color: ${cardColor}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
                  <div style="font-size: ${baseFontSize * 2.5}px; margin-bottom: 0.75rem;">📊</div>
                  <h3 style="color: ${headerColor}; font-size: ${baseFontSize * 1.1}px; font-weight: 700; margin-bottom: 0.5rem;">Results</h3>
                  <p style="color: ${textColor}; font-size: ${baseFontSize * 0.9}px;">Check All Exam Results Here</p>
                  <p id="results-count-card" style="color: ${accentColor}; font-weight: 700; font-size: ${baseFontSize * 1.1}px; margin-top: 0.5rem;">${results.length} Results</p>
                </div>
                <div class="service-card" style="background-color: ${cardColor}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
                  <div style="font-size: ${baseFontSize * 2.5}px; margin-bottom: 0.75rem;">🎫</div>
                  <h3 style="color: ${headerColor}; font-size: ${baseFontSize * 1.1}px; font-weight: 700; margin-bottom: 0.5rem;">Admit Cards</h3>
                  <p style="color: ${textColor}; font-size: ${baseFontSize * 0.9}px;">Download Admit Cards</p>
                  <p id="admits-count-card" style="color: ${accentColor}; font-weight: 700; font-size: ${baseFontSize * 1.1}px; margin-top: 0.5rem;">${admits.length} Admit Cards</p>
                </div>
                <div class="service-card" style="background-color: ${cardColor}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
                  <div style="font-size: ${baseFontSize * 2.5}px; margin-bottom: 0.75rem;">🎓</div>
                  <h3 style="color: ${headerColor}; font-size: ${baseFontSize * 1.1}px; font-weight: 700; margin-bottom: 0.5rem;">Admissions</h3>
                  <p style="color: ${textColor}; font-size: ${baseFontSize * 0.9}px;">College Admission Information</p>
                  <p id="admissions-count-card" style="color: ${accentColor}; font-weight: 700; font-size: ${baseFontSize * 1.1}px; margin-top: 0.5rem;">${admissions.length} Admissions</p>
                </div>
              </div>
            </div>

            <!-- Latest Updates Section -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
              <!-- Latest Jobs -->
              <div style="background-color: ${cardColor}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: ${headerColor}; font-size: ${baseFontSize * 1.2}px; font-weight: 800; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: ${baseFontSize * 1.8}px;">💼</span>
                  Latest Jobs
                </h3>
                <div id="latest-jobs-preview"></div>
                <div class="nav-link" data-page="jobs" style="color: ${accentColor}; font-weight: 700; font-size: ${baseFontSize * 0.9}px; margin-top: 1rem; display: inline-block; cursor: pointer; text-decoration: none;">
                  View All Jobs →
                </div>
              </div>

              <!-- Latest Results -->
              <div style="background-color: ${cardColor}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: ${headerColor}; font-size: ${baseFontSize * 1.2}px; font-weight: 800; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: ${baseFontSize * 1.8}px;">📊</span>
                  Latest Results
                </h3>
                <div id="latest-results-preview"></div>
                <div class="nav-link" data-page="results" style="color: ${accentColor}; font-weight: 700; font-size: ${baseFontSize * 0.9}px; margin-top: 1rem; display: inline-block; cursor: pointer; text-decoration: none;">
                  View All Results →
                </div>
              </div>

              <!-- Latest Admit Cards -->
              <div style="background-color: ${cardColor}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: ${headerColor}; font-size: ${baseFontSize * 1.2}px; font-weight: 800; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: ${baseFontSize * 1.8}px;">🎫</span>
                  Admit Cards
                </h3>
                <div id="latest-admits-preview"></div>
                <div class="nav-link" data-page="admits" style="color: ${accentColor}; font-weight: 700; font-size: ${baseFontSize * 0.9}px; margin-top: 1rem; display: inline-block; cursor: pointer; text-decoration: none;">
                  View All Admit Cards →
                </div>
              </div>
            </div>

            <!-- Important Services Section -->
            <div style="margin-bottom: 1.5rem;">
              <h2 style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); color: white; font-size: ${baseFontSize * 1.5}px; font-weight: 800; margin-bottom: 1rem; text-align: center; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Important Services</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.75rem;">
                ${services.map((service, index) => `
                  <div class="important-service-card" style="padding: 0.75rem; border-left: 5px solid ${accentColor}; background-color: ${cardColor}; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 0.5rem;">
                    <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 26px; width: 26px; height: 26px; background: linear-gradient(135deg, ${headerColor}, ${accentColor}); color: white; border-radius: 50%; font-size: ${baseFontSize * 0.75}px; font-weight: 700; flex-shrink: 0;">${index + 1}</span>
                    <span style="color: ${textColor}; font-size: ${baseFontSize * 0.9}px; font-weight: 600;">${service}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Donation Section - Working Buttons -->
            <div id="donation-section" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); border-radius: 12px; padding: 1.5rem; box-shadow: 0 6px 20px rgba(0,0,0,0.2); margin-bottom: 1.5rem; position: relative; overflow: hidden; border: 3px solid rgba(255,255,255,0.3);">
              <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background-color: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <div style="position: absolute; bottom: -25px; left: -25px; width: 100px; height: 100px; background-color: rgba(255,255,255,0.08); border-radius: 50%;"></div>
              
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="margin-bottom: 1rem;">
                  <div style="font-size: ${baseFontSize * 2.5}px; margin-bottom: 0.5rem;">🙏❤️</div>
                  <h2 style="color: white; font-size: ${baseFontSize * 1.5}px; font-weight: 800; margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2); font-family: ${customFont}, sans-serif;">समाज सेवा में हाथ बटाएं</h2>
                  <p style="color: white; font-size: ${baseFontSize * 0.95}px; line-height: 1.6; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto;">
                    आपके ₹10 से भी किसी का भला हो सकता है<br>
                    <span style="font-size: ${baseFontSize * 0.85}px;">जरूरतमंद, गरीब छात्र, बेसहारा लोगों की मदद करें</span>
                  </p>
                </div>

                <div style="background-color: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 400px; margin-left: auto; margin-right: auto;">
                  
   

                  <div style="background-color: #f0f4f8; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
                    <p style="color: #666; font-size: ${baseFontSize * 0.75}px; font-weight: 600; margin: 0 0 0.5rem 0;">📱 UPI ID</p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap;">
                      <p id="upi-id-text" style="color: ${headerColor}; font-size: ${baseFontSize * 0.95}px; font-weight: 700; margin: 0; font-family: monospace;">Loading....</p>
                      <button id="copy-upi-btn" class="donate-btn" style="background: linear-gradient(135deg, ${accentColor} 0%, ${headerColor} 100%); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: ${baseFontSize * 0.75}px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s;">📋 Copy</button>
                    </div>
                  </div>

<div class="donate-controls">

  <p class="donate-title">Quick Donate Amount</p>

  <!-- ✅ ONLY QUICK BUTTONS -->
  <div class="donate-buttons">
    <button data-amount="10" class="quick-donate-btn">₹10</button>
    <button data-amount="20" class="quick-donate-btn">₹20</button>
    <button data-amount="50" class="quick-donate-btn">₹50</button>
    <button data-amount="100" class="quick-donate-btn">₹100</button>
  </div>

  <!-- ✅ CUSTOM AMOUNT (OUTSIDE GRID) -->
  <div class="custom-donate">
    <input 
      type="number"
      id="custom-amount"
      placeholder="Enter amount ₹"
      min="1"
    >
    <button id="custom-pay-btn">Pay</button>
  </div>

  <!-- ✅ QR AREA -->
  <div id="dynamic-qr"></div>

</div>


                  <!-- 🔴 GENERATED QR WILL APPEAR HERE -->

                  <div id="payment-status" style="margin-top: 0.75rem; padding: 0.5rem; border-radius: 6px; font-size: ${baseFontSize * 0.8}px; font-weight: 600; display: none;"></div>
                </div>

                <div style="background-color: rgba(255,255,255,0.2); border-radius: 8px; padding: 0.75rem; backdrop-filter: blur(10px);">
                  <p style="color: white; font-size: ${baseFontSize * 0.85}px; font-weight: 600; margin: 0; line-height: 1.5;">
                    🌟 आपका हर रुपया सही जगह इस्तेमाल होगा 🌟<br>
                    <span style="font-size: ${baseFontSize * 0.75}px;">पारदर्शिता और ईमानदारी का वादा</span>
                  </p>
                </div>

                <p style="color: white; font-size: ${baseFontSize * 0.75}px; font-weight: 600; margin-top: 0.75rem; opacity: 0.9;">
                  किसी भी सवाल के लिए: <a href="https://wa.me/${config.whatsapp || defaultConfig.whatsapp}?text=Donation के बारे में जानकारी चाहिए" target="_blank" rel="noopener noreferrer" style="color: white; text-decoration: underline;">WhatsApp करें</a>
                </p>
              </div>
            </div> 

   
   
            <!-- WhatsApp Join Section -->
            <div style="background-color: ${cardColor}; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1.5rem; border: 2px solid ${accentColor};">
              <h3 style="color: ${headerColor}; font-size: ${baseFontSize * 1.3}px; font-weight: 800; margin-bottom: 1rem; text-align: center;">Join for Updates</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <a href="${config.whatsapp_group || defaultConfig.whatsapp_group}" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; padding: 1rem; border-radius: 8px; text-decoration: none; text-align: center; font-weight: 700; font-size: ${baseFontSize * 0.95}px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 0.75rem;">
                  <div class="wa-logo">💬</div>
                  <span>Join WhatsApp Group</span>
                </a>
                <a href="${config.whatsapp_channel || defaultConfig.whatsapp_channel}" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; padding: 1rem; border-radius: 8px; text-decoration: none; text-align: center; font-weight: 700; font-size: ${baseFontSize * 0.95}px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 0.75rem;">
                  <div class="wa-logo">📢</div>
                  <span>Follow Channel</span>
                </a>
              </div>
              <p style="color: ${textColor}; font-size: ${baseFontSize * 0.9}px; text-align: center; line-height: 1.5; font-weight: 600;">
                Get Latest Updates on Admissions, Exams, Results, Vacancies, Scholarships, Employment
              </p>
            </div>

            <!-- Contact Section -->
            <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); border-radius: 10px; padding: 1.25rem; box-shadow: 0 6px 20px rgba(0,0,0,0.15); margin-bottom: 1rem; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background-color: rgba(255,255,255,0.1); border-radius: 50%;"></div>
              <div style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; background-color: rgba(255,255,255,0.08); border-radius: 50%;"></div>
              
              <div style="position: relative; z-index: 1;">
                <div style="text-align: center; margin-bottom: 1rem;">
                  <div style="display: inline-flex; align-items: center; justify-content: center; background-color: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 50%; margin-bottom: 0.75rem;">
                    <span style="font-size: ${baseFontSize * 1.5}px;">📱</span>
                  </div>
                  <div>
                    <h2 style="color: white; font-size: ${baseFontSize * 1.4}px; font-weight: 800; margin-bottom: 0.25rem; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Contact Us</h2>
                    <p style="color: white; font-size: ${baseFontSize * 0.85}px; line-height: 1.4; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                      Fill online exam forms, govt schemes, scholarship admissions from home
                    </p>
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; max-width: 600px; margin: 0 auto;">
                  <a href="https://wa.me/${config.whatsapp || defaultConfig.whatsapp}?text=Hello" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; padding: 0.9rem 1rem; border-radius: 8px; text-decoration: none; text-align: center; font-weight: 700; font-size: ${baseFontSize * 0.95}px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 0.4rem; border: 2px solid rgba(255,255,255,0.3);">
                    <span style="font-size: ${baseFontSize * 1.3}px;">💬</span>
                    <span>WhatsApp</span>
                  </a>
                  <a href="tel:${config.phone_1 || defaultConfig.phone_1}" style="background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%); color: white; padding: 0.9rem 1rem; border-radius: 8px; text-decoration: none; text-align: center; font-weight: 700; font-size: ${baseFontSize * 0.95}px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 0.4rem; border: 2px solid rgba(255,255,255,0.3);">
                    <span style="font-size: ${baseFontSize * 1.3}px;">📞</span>
                    <span>Call Now</span>
                  </a>
                </div>
                
                <div style="text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.3);">
                  <p style="color: white; font-size: ${baseFontSize * 0.8}px; font-weight: 600; margin-bottom: 0.3rem;">Our Numbers</p>
                  <p style="color: rgba(255,255,255,0.95); font-size: ${baseFontSize * 0.9}px; font-weight: 700;">${config.phone_1 || defaultConfig.phone_1} / ${config.phone_2 || defaultConfig.phone_2}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Jobs Content -->
          <div id="jobs-content" style="display: none;">
            <h2 style="color: ${headerColor}; font-size: ${baseFontSize * 1.5}px; font-weight: 800; margin-bottom: 1rem; text-align: center;">Latest Government Jobs</h2>
            

            <div id="jobs-list-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;"></div>
          </div>

          <!-- Results Content -->
          <div id="results-content" style="display: none;">
            <h2 style="color: ${headerColor}; font-size: ${baseFontSize * 1.5}px; font-weight: 800; margin-bottom: 1rem; text-align: center;">Latest Results</h2>
           

            <div id="results-list-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;"></div>
          </div>

          <!-- Admits Content -->
          <div id="admits-content" style="display: none;">
            <h2 style="color: ${headerColor}; font-size: ${baseFontSize * 1.5}px; font-weight: 800; margin-bottom: 1rem; text-align: center;">Latest Admit Cards</h2>
            <div id="admits-list-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;"></div>
          </div>

          <!-- Admissions Content -->
          <div id="admissions-content" style="display: none;">
            <h2 style="color: ${headerColor}; font-size: ${baseFontSize * 1.5}px; font-weight: 800; margin-bottom: 1rem; text-align: center;">Latest Admissions</h2>
            <div id="admissions-list-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;"></div>
          </div>

          <!-- Admin Panel -->
          <div id="admin-panel" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); z-index: 9999; overflow-y: auto; padding: 1rem; box-sizing: border-box;">
            <div style="max-width: 600px; margin: 2rem auto; background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); border-radius: 12px; padding: 2rem; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
              <h2 style="color: white; font-size: ${baseFontSize * 1.8}px; font-weight: 800; margin-bottom: 1.5rem; text-align: center;">Admin Panel</h2>
              
              <!-- Login Form -->
              <div id="admin-login" style="background-color: rgba(255,255,255,0.95); border-radius: 8px; padding: 1.5rem;">
<!-- Admin Email -->
  <input
    type="email"
    id="admin-email"
    placeholder="Admin Email"
    style="
      width:100%;
      padding:0.75rem;
      border:2px solid #ddd;
      border-radius:8px;
      margin-bottom:0.75rem;
      font-size:16px;
    "
  >

  <!-- Admin Password -->
  <input
    type="password"
    id="admin-password"
    placeholder="Password"
    style="
      width:100%;
      padding:0.75rem;
      border:2px solid #ddd;
      border-radius:8px;
      margin-bottom:1rem;
      font-size:16px;
    "
  >

                <button id="admin-login-btn" style="width: 100%; background: linear-gradient(135deg, ${accentColor} 0%, ${headerColor} 100%); color: white; padding: 0.75rem; border: none; border-radius: 6px; font-weight: 700; font-size: ${baseFontSize}px; cursor: pointer;">
                  Login
                </button>
                <p id="admin-error" style="display: none; color: #ef4444; text-align: center; margin-top: 0.75rem; font-weight: 600;">Wrong Password!</p>
              </div>

              <!-- Admin Content -->
              <div id="admin-content" style="display: none;">
                <!-- Admin Tabs -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; background-color: rgba(255,255,255,0.2); border-radius: 8px; padding: 0.5rem; overflow-x: auto;">
                  <div class="admin-tab active" data-tab="jobs" style="flex: 1; text-align: center; padding: 0.75rem; color: white; font-weight: 600; font-size: ${baseFontSize * 0.85}px; border-radius: 6px; background-color: rgba(255,255,255,0.3); border-bottom: 3px solid white; min-width: 80px;">Jobs</div>
                  <div class="admin-tab" data-tab="results" style="flex: 1; text-align: center; padding: 0.75rem; color: white; font-weight: 600; font-size: ${baseFontSize * 0.85}px; border-radius: 6px; min-width: 80px;">Results</div>
                  <div class="admin-tab" data-tab="admits" style="flex: 1; text-align: center; padding: 0.75rem; color: white; font-weight: 600; font-size: ${baseFontSize * 0.85}px; border-radius: 6px; min-width: 80px;">Admits</div>
                  <div class="admin-tab" data-tab="admissions" style="flex: 1; text-align: center; padding: 0.75rem; color: white; font-weight: 600; font-size: ${baseFontSize * 0.85}px; border-radius: 6px; min-width: 100px;">Admissions</div>
                  <div class="admin-tab" data-tab="notices" style="flex: 1; text-align: center; padding: 0.75rem; color: white; font-weight: 600; font-size: ${baseFontSize * 0.85}px; border-radius: 6px; min-width: 100px;">Notices</div>
               <!--   <div class="admin-tab" data-tab="donation" style="flex: 1; text-align: center; padding: 0.75rem; color: white; font-weight: 600; font-size: ${baseFontSize * 0.85}px; border-radius: 6px; min-width: 100px;">Donation</div>   -->
                </div>

                <!-- Jobs Tab -->
                <div id="admin-tab-jobs" class="admin-tab-content" style="background-color: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem;">
                  <h4 style="color: ${headerColor}; font-size: ${baseFontSize * 1.2}px; font-weight: 700; margin-bottom: 1rem;">
                    Add New Job
                  </h4>
                  <form id="job-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <input type="text" id="job-title" placeholder="Job Title (e.g., BPSC 69th Combined Competitive Exam)" required style="padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: ${baseFontSize * 0.9}px; width: 100%; box-sizing: border-box;">
                    <input type="text" id="job-posts" placeholder="Total Posts (e.g., 500+ Posts)" required style="padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: ${baseFontSize * 0.9}px; width: 100%; box-sizing: border-box;">
                    <input type="text" id="job-status" placeholder="Status (e.g., Application Started - Last Date: 15 March 2024)" required style="padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: ${baseFontSize * 0.9}px; width: 100%; box-sizing: border-box;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: ${baseFontSize * 0.9}px; color: ${textColor};">
                      <input type="checkbox" id="job-is-new" style="width: 18px; height: 18px; cursor: pointer;">
                      <span>Mark as NEW?</span>
                    </label>
                    <button type="submit" style="background: linear-gradient(135deg, ${accentColor} 0%, ${headerColor} 100%); color: white; padding: 0.75rem; border: none; border-radius: 6px; font-weight: 600; font-size: ${baseFontSize * 0.9}px; cursor: pointer;">
                      Add Job
                    </button>
                  </form>
                  <p id="job-status-msg" style="margin-top: 0.75rem; text-align: center; font-weight: 600; font-size: ${baseFontSize * 0.9}px;"></p>
                  
                  <div style="margin-top: 1.5rem; border-top: 2px solid #eee; padding-top: 1rem;">
                    <h5 style="color: ${headerColor}; font-size: ${baseFontSize * 1.1}px; font-weight: 700; margin-bottom: 0.75rem;">
                      Existing Jobs (${jobs.length})
                    </h5>
                    <div id="jobs-list" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto;"></div>
                  </div>
                </div>

                <!-- Results Tab -->
                <div id="admin-tab-results" class="admin-tab-content" style="display: none; background-color: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem;">
                  <h4 style="color: ${headerColor}; font-size: ${baseFontSize * 1.2}px; font-weight: 700; margin-bottom: 1rem;">
                    Add New Result
                  </h4>
                  <form id="result-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <input type="text" id="result-title" placeholder="Result Title (e.g., BPSC 68th Preliminary Result)" required style="padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: ${baseFontSize * 0.9}px; width: 100%; box-sizing: border-box;">
                    <input type="text" id="result-status" placeholder="Status (e.g., Declared - Check Now)" required style="padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: ${baseFontSize * 0.9}px; width: 100%; box-sizing: border-box;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: ${baseFontSize * 0.9}px; color: ${textColor};">
                      <input type="checkbox" id="result-is-new" style="width: 18px; height: 18px; cursor: pointer;">
                      <span>Mark as NEW?</span>
                    </label>
                    <button type="submit" style="background: linear-gradient(135deg, ${accentColor} 0%, ${headerColor} 100%); color: white; padding: 0.75rem; border: none; border-radius: 6px; font-weight: 600; font-size: ${baseFontSize * 0.9}px; cursor: pointer;">
                      Add Result
                    </button>
                  </form>
                  <p id="result-status-msg" style="margin-top: 0.75rem; text-align: center; font-weight: 600; font-size: ${baseFontSize * 0.9}px;"></p>
                  
                  <div style="margin-top: 1.5rem; border-top: 2px solid #eee; padding-top: 1rem;">
                    <h5 style="color: ${headerColor}; font-size: ${baseFontSize * 1.1}px; font-weight: 700; margin-bottom: 0.75rem;">
                      Existing Results (${results.length})
                    </h5>
                    <div id="results-list" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto;"></div>
                  </div>
                </div>

                <!-- Admits Tab -->
                <div id="admin-tab-admits" class="admin-tab-content" style="display: none; background-color: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem;">
                  <h4 style="color: ${headerColor}; font-size: ${baseFontSize * 1.2}px; font-weight: 700; margin-bottom: 1rem;">
                    Add New Admit Card
                  </h4>
                  <form id="admit-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <input type="text" id="admit-title" placeholder="Admit Card Title (e.g., BPSC 69th Preliminary Admit Card)" required style="padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: ${baseFontSize * 0.9}px; width: 100%; box-sizing: border-box;">
                    <input type="text" id="admit-status" placeholder="Status (e.g., Released - Download Now)" required style="padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: ${baseFontSize * 0.9}px; width: 100%; box-sizing: border-box;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: ${baseFontSize * 0.9}px; color: ${textColor};">
                      <input type="checkbox" id="admit-is-new" style="width: 18px; height: 18px; cursor: pointer;">
                      <span>Mark as NEW?</span>
                    </label>
                    <button type="submit" style="background: linear-gradient(135deg, ${accentColor} 0%, ${headerColor} 100%); color: white; padding: 0.75rem; border: none; border-radius: 6px; font-weight: 600; font-size: ${baseFontSize * 0.9}px; cursor: pointer;">
                      Add Admit Card
                    </button>
                  </form>
                  <p id="admit-status-msg" style="margin-top: 0.75rem; text-align: center; font-weight: 600; font-size: ${baseFontSize * 0.9}px;"></p>
                  
                  <div style="margin-top: 1.5rem; border-top: 2px solid #eee; padding-top: 1rem;">
                    <h5 style="color: ${headerColor}; font-size: ${baseFontSize * 1.1}px; font-weight: 700; margin-bottom: 0.75rem;">
                      Existing Admit Cards (${admits.length})
                    </h5>
                    <div id="admits-list" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto;"></div>
                  </div>
                </div>

                <!-- Admissions Tab -->
                <div id="admin-tab-admissions" class="admin-tab-content" style="display: none; background-color: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem;">
                  <h4 style="color: ${headerColor}; font-size: ${baseFontSize * 1.2}px; font-weight: 700; margin-bottom: 1rem;">
                    Add New Admission
                  </h4>
                  <form id="admission-form" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <input type="text" id="admission-title" placeholder="Admission Title (e.g., IIT JEE Main 2024 Registration)" required style="padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: ${baseFontSize * 0.9}px; width: 100%; box-sizing: border-box;">
                    <input type="text" id="admission-status" placeholder="Status (e.g., Application Open - Last Date: 15 March)" required style="padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; font-size: ${baseFontSize * 0.9}px; width: 100%; box-sizing: border-box;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: ${baseFontSize * 0.9}px; color: ${textColor};">
                      <input type="checkbox" id="admission-is-new" style="width: 18px; height: 18px; cursor: pointer;">
                      <span>Mark as NEW?</span>
                    </label>
                    <button type="submit" style="background: linear-gradient(135deg, ${accentColor} 0%, ${headerColor} 100%); color: white; padding: 0.75rem; border: none; border-radius: 6px; font-weight: 600; font-size: ${baseFontSize * 0.9}px; cursor: pointer;">
                      Add Admission
                    </button>
                  </form>
                  <p id="admission-status-msg" style="margin-top: 0.75rem; text-align: center; font-weight: 600; font-size: ${baseFontSize * 0.9}px;"></p>
                  
                  <div style="margin-top: 1.5rem; border-top: 2px solid #eee; padding-top: 1rem;">
                    <h5 style="color: ${headerColor}; font-size: ${baseFontSize * 1.1}px; font-weight: 700; margin-bottom: 0.75rem;">
                      Existing Admissions (${admissions.length})
                    </h5>
                    <div id="admissions-list" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto;"></div>
                  </div>
                </div>

                <!-- Notices Tab -->
<div id="admin-tab-notices" class="admin-tab-content"
     style="display:none; background-color:white; border-radius:8px; padding:1.5rem; margin-bottom:1rem;">

  <h4 style="
    color:#2563eb;
    font-size:18px;
    font-weight:700;
    margin-bottom:1rem;
  ">
    Add New Notice
  </h4>

  <form id="notice-form"
        style="display:flex; flex-direction:column; gap:0.75rem;">

    <textarea
  id="notice-title"
  placeholder="Notice text (same as WhatsApp message)"
  required
  style="padding:0.6rem;border:1px solid #ddd;border-radius:6px;
         font-size:14px;min-height:80px;resize:vertical;font-family:inherit;">
</textarea>


    <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;">
  <input type="checkbox" id="notice-is-new"
         style="width:18px;height:18px;cursor:pointer;">
  <span>Mark as NEW?</span>
</label>


    <button type="submit"
      style="
        background:linear-gradient(135deg,#10b981,#2563eb);
        color:white;
        padding:0.75rem;
        border:none;
        border-radius:6px;
        font-weight:600;
        font-size:14px;
        cursor:pointer;
      ">
      Add Notice
    </button>

  </form>

  <p id="notice-status-msg"
     style="
       margin-top:0.75rem;
       text-align:center;
       font-weight:600;
       font-size:14px;
     ">
  </p>

  <div style="margin-top:1.5rem; border-top:2px solid #eee; padding-top:1rem;">
    <h5 style="
      color:#2563eb;
      font-size:16px;
      font-weight:700;
      margin-bottom:0.75rem;
    ">
      Existing Notices
    </h5>

    <div id="notices-list"
         style="display:flex; flex-direction:column; gap:0.5rem; max-height:260px; overflow-y:auto;">
    </div>
  </div>

</div>



                <!-- Donation Settings Tab -->
<div id="admin-tab-donation" class="admin-tab-content"
     style="display:none; background-color:white; border-radius:8px; padding:1.5rem;">

  <h4 style="color:#2563eb; font-size:18px; font-weight:700; margin-bottom:1rem;">
    Donation Settings
  </h4>

  <!-- CURRENT VALUES -->
  <div style="
    background:#f9fafb;
    border:1px solid #e5e7eb;
    border-radius:6px;
    padding:0.75rem;
    margin-bottom:1rem;
    font-size:14px;
  ">
    <p><b>Current UPI ID:</b> <span id="current-upi">—</span></p>
    <p><b>Current Payee Name:</b> <span id="current-payee">—</span></p>
  </div>

  <!-- FORM -->
  <form id="donation-form" style="display:flex; flex-direction:column; gap:0.75rem;">

    <input
      type="text"
      id="donation-upi"
      placeholder="UPI ID (e.g. 9709701986@ybl)"
      style="padding:0.6rem; border:1px solid #ddd; border-radius:6px;"
      required
    >

    <input
      type="text"
      id="donation-name"
      placeholder="Payee Name (e.g. NAJIS CYBER CAFE)"
      style="padding:0.6rem; border:1px solid #ddd; border-radius:6px;"
      required
    >

    <button type="submit"
      style="
        background:linear-gradient(135deg,#10b981,#2563eb);
        color:white;
        padding:0.75rem;
        border:none;
        border-radius:6px;
        font-weight:700;
        cursor:pointer;
      ">
      Save Donation Settings
    </button>

  </form>

  <p id="donation-status-msg"
     style="margin-top:0.75rem; font-weight:600; text-align:center;">
  </p>
</div>



                <div style="margin-top:1.5rem; padding-top:1rem; border-top:2px dashed rgba(255,255,255,0.4);">
  <button id="admin-close-btn"
    style="width:100%; background:linear-gradient(135deg,#0ea5e9,#14b8a6);
    color:white; padding:0.9rem; border:none; border-radius:8px; font-weight:700;">
    Close Admin Panel
  </button>
</div>

              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 2rem; padding: 2rem 1.5rem; background-color: ${cardColor}; border-radius: 12px; font-size: ${baseFontSize * 0.9}px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 2px solid ${headerColor};">
            <!-- Share Section -->
            <div style="text-align: center; margin-bottom: 1.5rem; padding: 0.75rem; background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <p style="font-size: ${baseFontSize * 1}px; font-weight: 700; margin: 0; color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <span style="font-size: ${baseFontSize * 1.3}px;">🙏</span>
                <span>Please Share</span>
                <span style="font-size: ${baseFontSize * 1.3}px;">🙏</span>
              </p>
            </div>
            
            <!-- Credits Section -->
            <div style="text-align: center;">
              <p style="font-size: ${baseFontSize * 0.75}px; margin-bottom: 0.5rem; color: ${textColor}; font-weight: 500;">Designed & Maintained by</p>
              <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%); display: inline-block; padding: 0.75rem 1.5rem; border-radius: 8px; margin-bottom: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                <p style="font-weight: 800; font-size: ${baseFontSize * 1.1}px; margin: 0 0 0.25rem 0; color: white;">webDrop Technologies</p>
                <p style="font-weight: 600; font-size: ${baseFontSize * 0.9}px; margin: 0; color: white;">MD ARSHAD ALI</p>
              </div>
              <p style="font-size: ${baseFontSize * 0.7}px; color: ${textColor}; opacity: 0.7; margin: 0; font-weight: 500;">© 2025 All Rights Reserved</p>
            </div>
          </div>

          <!-- 🔔 Floating Notice Button -->
<button id="noticeToggleBtn"
  style="
    position:fixed;
    top:40%;
    right:0;
    z-index:9999;
    background:#f59e0b;
    color:white;
    border:none;
    border-radius:8px 0 0 8px;
    padding:10px 14px;
    font-weight:800;
    cursor:pointer;
    box-shadow:0 4px 12px rgba(0,0,0,0.25);
  ">
  🔔
</button>

        </main>
        <!-- ⬆️ Scroll To Top Button -->
<button id="scrollTopBtn"
  style="
    position:fixed;
    bottom:24px;
    right:24px;
    z-index:9999;
    display:none;
    background:#2563eb;
    color:white;
    border:none;
    border-radius:50%;
    width:44px;
    height:44px;
    font-size:20px;
    cursor:pointer;
    box-shadow:0 6px 14px rgba(0,0,0,0.25);
  ">
  ⬆️
</button>

      `;

  setupEventListeners();
}


function setupEventListeners() {
  const app = document.getElementById('app');

  // Copy UPI Button
  const copyUpiBtn = app.querySelector('#copy-upi-btn');
  if (copyUpiBtn) {
    copyUpiBtn.addEventListener('click', copyUPIId);
  }

  // Donate Buttons
  const donateButtons = app.querySelectorAll('.quick-donate-btn');

  donateButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      // remove active from all
      donateButtons.forEach(b => b.classList.remove('active'));

      // add active to clicked
      this.classList.add('active');

      const amount = this.getAttribute('data-amount');
      openUPIPay(amount);
    });
  });

  // 🔴 when user types custom amount → remove quick button highlight
  const customAmountInput = document.getElementById("custom-amount");

  if (customAmountInput) {
    customAmountInput.addEventListener("input", () => {
      document
        .querySelectorAll(".quick-donate-btn")
        .forEach(btn => btn.classList.remove("active"));
    });
  }

  // 🔴 when Pay button clicked → remove quick button highlight
  const payBtn = document.getElementById("custom-pay-btn");

  if (payBtn) {
    payBtn.addEventListener("click", () => {
      document
        .querySelectorAll(".quick-donate-btn")
        .forEach(btn => btn.classList.remove("active"));
    });
  }


  const adminTrigger = app.querySelector('#admin-trigger');
  const adminPanel = app.querySelector('#admin-panel');
  const adminLoginBtn = app.querySelector('#admin-login-btn');
  const adminPasswordInput = app.querySelector('#admin-password');
  const adminLogin = app.querySelector('#admin-login');
  const adminContent = app.querySelector('#admin-content');
  const adminError = app.querySelector('#admin-error');
  const adminCloseBtn = app.querySelector('#admin-close-btn');

  if (adminTrigger && adminPanel) {
    adminTrigger.addEventListener('click', function () {
      clickCount++;

      if (clickTimer) clearTimeout(clickTimer);

      if (clickCount === 3) {
        adminPanel.style.display = 'block';

        // AUTOFOCUS EMAIL INPUT
        setTimeout(() => {
          const email = document.getElementById('admin-email');
          if (email) email.focus();
        }, 100);


        clickCount = 0;
      }


      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 500);
    });
  }

  // 🔐 ADMIN LOGIN USING FIREBASE AUTH
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", async () => {
      const email = document.getElementById("admin-email").value.trim();
      const password = document.getElementById("admin-password").value.trim();

      if (!email || !password) {
        adminError.style.display = "block";
        adminError.innerText = "Email & password required";
        return;
      }

      try {
        await signInWithEmailAndPassword(window.auth, email, password);

        // ✅ LOGIN SUCCESS UI UPDATE
        adminError.style.display = "none";
        adminLogin.style.display = "none";
        adminContent.style.display = "block";
        isAdminLoggedIn = true;

        // Load admin data
        switchAdminTab("jobs");
        loadAdminJobs();
        loadAdminResults();
        loadAdminAdmits();
        loadAdminAdmissions();
        loadAdminNotices();

      } catch (err) {
        console.error(err);
        adminError.style.display = "block";
        adminError.innerText = "Invalid login";
      }

    });
  }

  if (adminCloseBtn && adminPanel) {
    adminCloseBtn.addEventListener('click', () => {
      adminPanel.style.display = 'none';
    });
  }


  const adminTabs = app.querySelectorAll('.admin-tab');
  adminTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const tabName = this.getAttribute('data-tab');
      switchAdminTab(tabName);
    });
  });


  /* Job Form Submission */
  const jobForm = app.querySelector('#job-form');
  if (jobForm) {
    jobForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.querySelector('#job-title').value.trim();
      const posts = document.querySelector('#job-posts').value.trim();
      const status = document.querySelector('#job-status').value.trim();
      const isNew = document.querySelector('#job-is-new').checked;


      if (!title || !posts || !status) {
        alert("Please fill all fields");
        return;
      }

      const editId = jobForm.getAttribute("data-edit-id");

      // 🔁 UPDATE JOB
      if (editId) {
        await window.fb.update("jobs", editId, {
          title,
          posts,
          status,
          isNew
        });


        jobForm.removeAttribute("data-edit-id");
        jobForm.reset();


        const btn = jobForm.querySelector('button[type="submit"]');
        btn.textContent = "Add Job";

        showStatusMessage('job-status-msg', 'Job updated successfully', 'success');
        return;
      }


      // ➕ ADD NEW JOB
      await window.fb.add("jobs", {
        title,
        posts,
        status,
        isNew,
        createdAt: Date.now()
      });


      showStatusMessage('job-status-msg', 'Job added successfully', 'success');
      jobForm.reset();
    });
  }

  /* Result Form Submission */
  const resultForm = document.querySelector('#result-form');

  if (resultForm) {
    resultForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.querySelector('#result-title').value.trim();
      const status = document.querySelector('#result-status').value.trim();
      const isNew = document.querySelector('#result-is-new').checked;

      if (!title || !status) return alert("Fill all fields");

      const editId = resultForm.getAttribute("data-edit-id");

      if (editId) {
        await window.fb.update("results", editId, {
          title,
          status,
          isNew
        });

        resultForm.removeAttribute("data-edit-id");
        showStatusMessage('result-status-msg', 'Result updated successfully', 'success');
      } else {
        await window.fb.add("results", {
          title,
          status,
          isNew,
          createdAt: Date.now()
        });
        showStatusMessage('result-status-msg', 'Result added successfully', 'success');
      }
      resultForm.reset();

      const btn = resultForm.querySelector('button[type="submit"]');
      btn.textContent = "Add Result";


    });

  }

  /* Admit Form Submission */
  const admitForm = document.querySelector('#admit-form');

  if (admitForm) {
    admitForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.querySelector('#admit-title').value.trim();
      const status = document.querySelector('#admit-status').value.trim();
      const isNew = document.querySelector('#admit-is-new').checked;

      if (!title || !status) {
        alert("Fill all fields");
        return;
      }

      const editId = admitForm.getAttribute("data-edit-id");

      // 🔁 UPDATE ADMIT
      if (editId) {
        await window.fb.update("admits", editId, {
          title,
          status,
          isNew
        });

        admitForm.removeAttribute("data-edit-id");
        showStatusMessage('admit-status-msg', 'Admit Card updated successfully', 'success');
      }
      // ➕ ADD NEW ADMIT
      else {
        await window.fb.add("admits", {
          title,
          status,
          isNew,
          createdAt: Date.now()
        });

        showStatusMessage('admit-status-msg', 'Admit Card added successfully', 'success');
      }

      admitForm.reset();

      const btn = admitForm.querySelector('button[type="submit"]');
      btn.textContent = "Add Admit Card";
    });
  }


  /* Admission Form Submission */
  const admissionForm = document.querySelector('#admission-form');

  if (admissionForm) {
    admissionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.querySelector('#admission-title').value.trim();
      const status = document.querySelector('#admission-status').value.trim();
      const isNew = document.querySelector('#admission-is-new').checked;

      if (!title || !status) return alert("Fill all fields");

      const editId = admissionForm.getAttribute("data-edit-id");

      if (editId) {
        await window.fb.update("admissions", editId, {
          title,
          status,
          isNew
        });

        admissionForm.removeAttribute("data-edit-id");
        showStatusMessage('admission-status-msg', 'Admission updated', 'success');

      } else {
        await window.fb.add("admissions", {
          title,
          status,
          isNew,
          createdAt: Date.now()
        });

        showStatusMessage('admission-status-msg', 'Admission added successfully', 'success');
      }

      admissionForm.reset();

    });

  }


  const noticeForm = document.getElementById("notice-form");

  if (noticeForm) {
    noticeForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("notice-title").value.trim();
      const isNew = document.getElementById("notice-is-new").checked;

      if (editingNoticeId) {
        await window.fb.update("notices", editingNoticeId, {
          title,
          isNew
        });
        editingNoticeId = null;
      } else {
        await window.fb.add("notices", {
          title,
          isNew,
          createdAt: Date.now()
        });
      }

      noticeForm.reset();
      document.querySelector("#notice-form button").innerText = "Add Notice";


      noticeForm.reset();
      showStatusMessage("notice-status-msg", "Notice added", "success");
    });
  }


  /* Donation Settings Form Submission */
  const donationForm = document.querySelector('#donation-form');

  if (donationForm) {
    donationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const upiInput = document.getElementById('donation-upi');
      const nameInput = document.getElementById('donation-name');
      const submitBtn = donationForm.querySelector('button[type="submit"]');

      const upiId = upiInput.value.trim();
      const payeeName = nameInput.value.trim();

      if (!upiId || !payeeName) {
        alert("Please fill all fields");
        return;
      }

      submitBtn.textContent = "Saving...";
      submitBtn.disabled = true;

      await window.fb.update("settings", "donation", {
        upiId,
        payeeName,
        updatedAt: Date.now()
      });



      // ✅ CLEAR INPUTS AFTER SAVE
      upiInput.value = "";
      nameInput.value = "";

      // ✅ RESET BUTTON
      submitBtn.textContent = "Save Donation Settings";
      submitBtn.disabled = false;

      showStatusMessage(
        'donation-status-msg',
        'Donation settings updated successfully',
        'success'
      );
    });
  }



  const navLinks = app.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const page = this.getAttribute('data-page');
      if (page) {
        navigateTo(page);
      }
    });
  });

  const cards = app.querySelectorAll('.service-card, .quick-link-item');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    card.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '';
    });
  });

  const buttons = app.querySelectorAll('a[href^="https://wa.me"], a[href^="tel:"]');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'scale(1.05)';
    });
    button.addEventListener('mouseleave', function () {
      this.style.transform = 'scale(1)';
    });
  });


  // 🔍 PAGE SEARCH + CLEAR (FIXED)
  const searchInput = document.getElementById("page-search-input");
  const clearBtn = document.getElementById("page-search-clear");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchText = searchInput.value.toLowerCase();

      if (currentPage === "jobs") renderJobsList();
      if (currentPage === "results") renderResultsList();
      if (currentPage === "admits") renderAdmitsList();
      if (currentPage === "admissions") renderAdmissionsList();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchText = "";
      searchInput.value = "";

      if (currentPage === "jobs") renderJobsList();
      if (currentPage === "results") renderResultsList();
      if (currentPage === "admits") renderAdmitsList();
      if (currentPage === "admissions") renderAdmissionsList();
    });
  }

  // ⬆️ Scroll To Top Logic (FINAL – FOR #app SCROLL)
  const scrollBtn = document.getElementById("scrollTopBtn");
  const appScroll = document.getElementById("app");

  if (scrollBtn && appScroll) {
    appScroll.addEventListener("scroll", () => {
      if (appScroll.scrollTop > 80) {
        scrollBtn.style.display = "block";
      } else {
        scrollBtn.style.display = "none";
      }
    });

    scrollBtn.addEventListener("click", () => {
      appScroll.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
  // 🔔 Notice Toggle Button Logic
  const noticeBtn = document.getElementById("noticeToggleBtn");
  const noticeBoard = document.getElementById("notice-board");

  if (noticeBtn && noticeBoard) {
    noticeBtn.addEventListener("click", () => {
      if (noticeBoard.style.display === "none") {
        noticeBoard.style.display = "block";
        noticeBoard.scrollIntoView({ behavior: "smooth" });
      } else {
        noticeBoard.style.display = "none";
      }
    });
  }



  updatePageContent();
}

/* // ===== init Function ===== */
function init() {
  // Render default content
  renderContent(defaultConfig);

  // Initialize homepage counts
  initHomeCounts();

  // Initialize navigation counts
  initNavCounts();

  // Load latest previews for homepage
  initHomeLatestPreviews();

  // Load donation settings from Firebase
  loadDonationSettings();


  renderNotices();

}

init();


