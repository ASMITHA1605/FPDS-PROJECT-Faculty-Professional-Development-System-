// =============================================
//  FPDS — Faculty Professional Development System
//  script.js — Unified & Consolidated Logic
// =============================================

const API = "https://fpds-project-faculty-professional.onrender.com"; // UPDATE THIS BEFORE DEPLOYING FRONTEND
let charts = {}; // To store chart instances

// ── Toast Notification ──────────────────────
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "show " + type;
  setTimeout(() => { t.className = ""; }, 3000);
}

// ── Page Detection Helper ────────────────────
function onPage(name) { return window.location.pathname.includes(name); }

// Auth Fetch Helper
async function fetchAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token && !onPage("index.html")) {
      window.location.href = "index.html";
      return;
  }
  options.headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
  };
  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "index.html";
  }
  return res;
}

// ============================================
//  AUTHENTICATION (LOGIN)
// ============================================
function login() {
  const role = document.getElementById("role").value;
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) return showToast("Enter credentials", "error");

  fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
  .then(r => {
    if(!r.ok) throw new Error("Invalid Login");
    return r.json();
  })
  .then(data => {
    if (data.success) {
      localStorage.setItem("token", data.token); // Store JWT
      localStorage.setItem("loggedUser", data.user.name);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("facultyDept", data.user.department || "Faculty");
      localStorage.setItem("facultyExp", data.user.experience_years || 0);
      
      if (data.user.role === "admin") {
          window.location.href = "admin.html";
      } else {
          window.location.href = "dashboard.html";
      }
    } else {
      showToast("Invalid Login", "error");
    }
  })
  .catch((err) => showToast(err.message || "Server error", "error"));
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ============================================
//  DASHBOARD & PERFORMANCE TRACKER
// ============================================
if (onPage("dashboard.html")) {
  const loggedUser = localStorage.getItem("loggedUser");
  const viewingUser = localStorage.getItem("viewingUser");
  const userRole = localStorage.getItem("userRole");
  
  // Resolve which user data to show
  const user = (userRole === "admin" && viewingUser) ? viewingUser : loggedUser;

  if (!user) { window.location.href = "index.html"; }
  else {
    // Admin "Back" button and section hiding
    if (userRole === "admin") {
        // Hide tracker for admin themselves
        if (!viewingUser) {
            const tracker = document.querySelector(".target-tracker");
            const reward = document.querySelector(".reward-card");
            if(tracker) tracker.style.display = "none";
            if(reward) reward.style.display = "none";
            
            // Re-adjust grid if needed
            const grid = document.querySelector(".chart-grid");
            if(grid) grid.style.display = "block"; // Stack them or just leave as is
        }

        if (viewingUser) {
            const header = document.querySelector(".page-header");
            if (header && !document.getElementById("backToAdmin")) {
                const btn = document.createElement("button");
                btn.id = "backToAdmin";
                btn.className = "btn btn-primary";
                btn.innerHTML = "⬅️ Back to Admin Panel";
                btn.onclick = () => { localStorage.removeItem("viewingUser"); window.location.href = "admin.html"; };
                header.prepend(btn);
            }
        }
    }
    // 1. Sync Profile Info from DB
    fetchAuth(`${API}/faculty/${encodeURIComponent(user)}`)
    .then(r => r.json())
    .then(fac => {
      if(fac.name) {
        localStorage.setItem("facultyDept", fac.department || "Faculty");
        localStorage.setItem("facultyExp", fac.experience_years || 0);
        if(document.getElementById("facultyName")) document.getElementById("facultyName").textContent = `Welcome ${fac.name}`;
        if(document.getElementById("infoName"))    document.getElementById("infoName").textContent = fac.name;
        if(document.getElementById("infoDept"))    document.getElementById("infoDept").textContent = fac.department || "—";
        if(document.getElementById("infoExp"))     document.getElementById("infoExp").textContent = `${fac.experience_years || 0} Years`;
        const av = document.getElementById("dashAvatar");
        if(av) av.textContent = fac.name.charAt(0).toUpperCase();
      }
    });

    // 2. Load Performance Analytics
    fetchAuth(`${API}/activities`)
    .then(r => r.json())
    .then(activities => {
      const now = new Date();
      const currentSem = (now.getMonth() >= 5 && now.getMonth() <= 11) ? "Odd" : "Even";
      // Fix Academic Year logic (Academic Year starts in June, e.g., March 2026 is in 2025-26)
      const currentMonth = now.getMonth(); 
      const startYear = (currentMonth >= 5) ? now.getFullYear() : now.getFullYear() - 1;
      const currentYearStr = `${startYear}-${(startYear + 1).toString().slice(-2)}`;
      
      const badge = document.getElementById("semesterBadge");
      if(badge) badge.textContent = `${currentSem} Semester (${currentYearStr})`;

      let counts = { Workshop: 0, Conference: 0, FDP: 0, Publication: 0 };
      let semTotal = 0;
      const deptMap = {};
      const foundTypes = { Workshop: false, Conference: false, FDP: false, Publication: false };

      activities.forEach(a => {
        deptMap[a.department] = (deptMap[a.department] || 0) + 1;
        if (a.faculty_name === user) {
          if (counts[a.activity_type] !== undefined) counts[a.activity_type]++;
          // Check Semester match
          if (a.semester === currentSem && (a.academic_year === currentYearStr || !a.academic_year)) {
            semTotal++;
            foundTypes[a.activity_type] = true;
          }
        }
      });

      // Update Dashboard Counters
      const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
      setVal("workshopCount", counts.Workshop);
      setVal("conferenceCount", counts.Conference);
      setVal("fdpCount", counts.FDP);
      setVal("publicationCount", counts.Publication);

      // Tracker Credits & Progress
      const completed = Math.min(counts.Workshop, 4);
      setVal("targetCompleted", completed);
      const pBar = document.getElementById("targetProgress");
      if(pBar) {
        pBar.style.width = (completed/4)*100 + "%";
        pBar.style.background = (completed>=4) ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #4f46e5, #06b6d4)";
      }

      // Linear credits: ₹500 per workshop up to 4
      setVal("creditAmount", completed * 500);

      // Suggestions Logic
      const sBox = document.getElementById("suggestionBox");
      const sSuc = document.getElementById("targetSuccess");
      if(sBox && sSuc) {
        if(completed >= 4) { sBox.style.display="none"; sSuc.style.display="block"; }
        else {
          sBox.style.display="block"; sSuc.style.display="none";
          // If we are counting workshops specifically, suggest adding a Workshop
          const sText = document.getElementById("suggestionText");
          if(sText) sText.innerHTML = `You need ${4-completed} more Workshop activities to reach your target and earn <strong>₹${(4-completed)*500}</strong> more credits. Add a <strong>Workshop</strong>!`;
        }
      }

      // Render Charts & Leaderboard
      renderImprovementTracker(user);
      renderDeptChart(deptMap);
      renderLeaderboard(activities);
    });
  }
}

// ── Improvement Tracker (Enhanced) ──────────
function renderImprovementTracker(user) {
    const el = document.getElementById("improvementChart");
    if (!el) return;

    fetchAuth(`${API}/improvement/${encodeURIComponent(user)}`)
    .then(r => r.json())
    .then(data => {
        // Prepare 3-Year Baseline
        const now = new Date();
        const y3 = now.getFullYear();
        const y2 = y3 - 1;
        const y1 = y2 - 1;
        const years = [y1.toString(), y2.toString(), y3.toString()];
        
        // Update Dynamic Title
        const titleEl = document.getElementById("impTitle");
        if(titleEl) titleEl.textContent = `Improvement Tracker (${y1} - ${y3})`;

        // Map data or use 0s
        const mapYear = (year) => {
            const found = data.find(d => d.year === year);
            return found ? found : { workshops:0, conferences:0, fdps:0, publications:0 };
        };

        const yearData = years.map(mapYear);
        const datasets = [
            { label: "Workshop", color: "#4f46e5", data: yearData.map(d=>d.workshops) },
            { label: "Conference", color: "#06b6d4", data: yearData.map(d=>d.conferences) },
            { label: "FDP", color: "#10b981", data: yearData.map(d=>d.fdps) },
            { label: "Publication", color: "#f59e0b", data: yearData.map(d=>d.publications) }
        ];

        if(charts['improvement']) charts['improvement'].destroy();
        
        const ctx = el.getContext("2d");
        charts['improvement'] = new Chart(el, {
            type: "line",
            data: {
                labels: years,
                datasets: datasets.map(ds => ({
                    label: ds.label,
                    data: ds.data,
                    borderColor: ds.color,
                    backgroundColor: ds.color + "22", // Pale fill
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 3
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom", labels: { usePointStyle: true, padding: 20 } },
                    tooltip: { mode: "index", intersect: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { borderDash: [5, 5] } },
                    x: { grid: { display: false } }
                }
            }
        });
    });
}

// ── Department Chart (Doughnut) ──────────────
function normalizeDept(name) {
    if (!name) return "Other";
    const n = name.trim().toLowerCase();
    if (n.includes("computer science engineering") || n.includes("dept of computer science") || n === "cse") return "CSE";
    if (n.includes("information technology") || n === "it") return "IT";
    if (n.includes("artificial intelligence") || n.includes("ai")) return "AI";
    if (n.includes("cyber security") || n.includes("cyber")) return "Cyber Security";
    if (n.includes("civil engineering") || n === "civil") return "Civil";
    if (n.includes("biomedical") || n === "bme") return "Biomedical";
    if (n.includes("electronics") || n.includes("ece") || n.includes("communication")) return "ECE";
    if (n.includes("design") || n === "csd") return "CSD";
    return name;
}

function renderDeptChart(dict) {
    const el = document.getElementById("deptChart");
    if(!el) return;
    
    // Normalize and consolidate the dictionary
    const consolidated = {};
    Object.keys(dict).forEach(key => {
        const norm = normalizeDept(key);
        consolidated[norm] = (consolidated[norm] || 0) + dict[key];
    });

    if(charts['dept']) charts['dept'].destroy();
    charts['dept'] = new Chart(el, {
        type: "doughnut",
        data: {
            labels: Object.keys(consolidated),
            datasets: [{
                data: Object.values(consolidated),
                backgroundColor: ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "75%",
            plugins: { 
                legend: { 
                    position: "bottom", 
                    labels: { 
                        boxWidth: 12, 
                        padding: 15,
                        font: { size: 11, weight: '500' },
                        usePointStyle: true
                    } 
                } 
            }
        }
    });
}

// ── Leaderboard ──────────────────────────────
function renderLeaderboard(acts) {
    const scores = {};
    acts.forEach(a => { scores[a.faculty_name] = (scores[a.faculty_name] || 0) + 1; });
    const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]).slice(0, 5);
    const board = document.getElementById("leaderboard");
    if(!board) return;
    
    board.innerHTML = sorted.map((s, i) => `
        <div class="leaderboard-item">
            <div class="leaderboard-info">
                <span class="rank-icon">${["🥇","🥈","🥉","4️⃣","5️⃣"][i]}</span>
                <span class="lb-name">${s[0]}</span>
            </div>
            <span class="lb-score">${s[1]} Acts</span>
        </div>
    `).join("");
}

// ============================================
//  ACTIVITY HISTORY (ACTIVITY LIST)
// ============================================
if (onPage("activity-list.html")) {
  loadActivityList();
}

function loadActivityList() {
  const user = localStorage.getItem("loggedUser");
  const body = document.getElementById("activityBody");
  if(!body) return;
  fetchAuth(`${API}/activities`)
  .then(r => r.json())
  .then(data => {
    const list = data.filter(a => a.faculty_name === user);
    if(list.length === 0) {
        if(document.getElementById("actEmpty")) document.getElementById("actEmpty").style.display = "block";
        body.innerHTML = "";
    } else {
        if(document.getElementById("actEmpty")) document.getElementById("actEmpty").style.display = "none";
        body.innerHTML = list.map(a => `
          <tr>
            <td>${a.activity_type}</td>
            <td>${a.title}</td>
            <td>${new Date(a.date).toLocaleDateString()}</td>
            <td>${a.organizer}</td>
            <td>${a.department || "—"}</td>
            <td><button class="btn btn-outline" onclick="deleteHistoryAct(${a.id})" style="color:var(--danger)">🗑️</button></td>
          </tr>
        `).join("");
    }
  });
}

function deleteHistoryAct(id) {
  if(!confirm("Delete this activity?")) return;
  fetchAuth(`${API}/activities/${id}`, { method: "DELETE" }).then(() => loadActivityList());
}

function filterActivities() {
  const term = document.getElementById("actSearch").value.toLowerCase();
  const rows = document.querySelectorAll("#activityBody tr");
  rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(term) ? "" : "none");
}

// ============================================
//  ACTIVITY ADD (FORM)
// ============================================
function addActivity() {
  const title = document.getElementById("title").value.trim();
  const date = document.getElementById("date").value;
  if(!title || !date) return showToast("Title and Date required", "error");

  const payload = {
    faculty: localStorage.getItem("loggedUser"),
    type: document.getElementById("type").value,
    title: title,
    date: date,
    organizer: document.getElementById("organizer").value,
    department: localStorage.getItem("facultyDept") || "Faculty",
    semester: document.getElementById("semester").value,
    academic_year: document.getElementById("academicYear").value
  };

  fetchAuth(`${API}/addActivity`, {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(() => { showToast("Activity Added!"); window.location.href="dashboard.html"; });
}

// ============================================
//  REPORTS (FACULTY SUMMARY)
// ============================================
if (onPage("report.html")) {
  loadReports();
}

function loadReports() {
  const body = document.getElementById("reportBody");
  if(!body) return;
  fetchAuth(`${API}/activities`).then(r => r.json()).then(data => {
    const rMap = {};
    data.forEach(a => {
      const name = a.faculty_name;
      if(!rMap[name]) rMap[name] = { w:0, c:0, f:0, p:0, t:0 };
      const t = a.activity_type;
      if(t==="Workshop") rMap[name].w++; 
      if(t==="Conference") rMap[name].c++; 
      if(t==="FDP") rMap[name].f++; 
      if(t==="Publication") rMap[name].p++;
      rMap[name].t++;
    });
    body.innerHTML = Object.entries(rMap).map(([n, d]) => `<tr><td>${n}</td><td>${d.w}</td><td>${d.c}</td><td>${d.f}</td><td>${d.p}</td><td>${d.t}</td></tr>`).join("");
  });
}

// ============================================
//  PROFILE MANAGEMENT
// ============================================
if (onPage("profile.html")) {
  const user = localStorage.getItem("loggedUser");
  fetchAuth(`${API}/faculty/${encodeURIComponent(user)}`).then(r => r.json()).then(fac => {
    if(fac.name) {
      if(document.getElementById("profileNameInput")) document.getElementById("profileNameInput").value = fac.name;
      if(document.getElementById("profileDeptInput")) document.getElementById("profileDeptInput").value = fac.department || "";
      if(document.getElementById("profileExpInput"))  document.getElementById("profileExpInput").value  = fac.experience_years || 0;
    }
  });
}

function saveProfile() {
  const user = localStorage.getItem("loggedUser");
  const dept = document.getElementById("profileDeptInput").value;
  const exp = document.getElementById("profileExpInput").value;

  fetchAuth(`${API}/faculty/${encodeURIComponent(user)}`, {
    method: "PUT",
    body: JSON.stringify({ department: dept, experience_years: exp })
  })
  .then(() => {
    showToast("Profile Updated!");
    localStorage.setItem("facultyDept", dept);
    localStorage.setItem("facultyExp", exp);
    setTimeout(() => location.reload(), 1000);
  });
}

// ============================================
//  ADMIN FACULTY MANAGEMENT
// ============================================
if (onPage("faculty.html")) {
  loadFacultyList();
}

function loadFacultyList() {
  const body = document.getElementById("facultyBody");
  if(!body) return;
  fetchAuth(`${API}/faculty`).then(r => r.json()).then(list => {
    body.innerHTML = list.map(f => `<tr><td>${f.id}</td><td>${f.name}</td><td>${f.department}</td><td><button class="btn btn-outline" style="color:var(--danger)" onclick="delFaculty(${f.id})">🗑️</button></td></tr>`).join("");
  });
}

function delFaculty(id) {
  if(!confirm("Delete this faculty account?")) return;
  fetchAuth(`${API}/faculty/${id}`, { method: "DELETE" }).then(() => loadFacultyList());
}

function filterFacultyTable() {
  const term = document.getElementById("facultySearch").value.toLowerCase();
  const rows = document.querySelectorAll("#facultyBody tr");
  rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(term) ? "" : "none");
}

function addFacultyAccount() {
  const name = document.getElementById("newFacultyName").value;
  const dept = document.getElementById("newFacultyDept").value;
  const pass = document.getElementById("newFacultyPass").value;
  if(!name || !pass) return showToast("Name and Pass required", "error");
  fetchAuth(`${API}/addFaculty`, {
    method: "POST",
    body: JSON.stringify({ name, department: dept, password: pass })
  }).then(() => { showToast("Faculty Added!"); loadFacultyList(); });
}