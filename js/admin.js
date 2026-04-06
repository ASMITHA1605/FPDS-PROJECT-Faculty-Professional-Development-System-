const API = "http://localhost:8080";
let adminCharts = {};

document.addEventListener("DOMContentLoaded", () => {
    // Check Auth
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (role !== "admin" || !token) {
        window.location.href = "index.html";
        return;
    }

    loadAdminStats();
    loadFacultySummary();
    loadAnalytics();
    loadPendingActivities();
});

// Auth Fetch Helper
async function fetchAuth(url, options = {}) {
    const token = localStorage.getItem("token");
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

// Toast Utility
function showToast(msg, icon = "✨") {
    const toast = document.getElementById("toast");
    const iconEl = document.getElementById("toastIcon");
    const msgEl = document.getElementById("toastMsg");
    if (!toast) return;

    iconEl.textContent = icon;
    msgEl.textContent = msg;
    
    toast.classList.remove("translate-y-20", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");
    
    setTimeout(() => {
        toast.classList.add("translate-y-20", "opacity-0");
        toast.classList.remove("translate-y-0", "opacity-100");
    }, 3000);
}

// 1. Load Summary Stats
async function loadAdminStats() {
    try {
        const res = await fetchAuth(`${API}/admin/stats`);
        const stats = await res.json();

        document.getElementById("statFaculty").textContent = stats.faculty || 0;
        document.getElementById("statWorkshops").textContent = stats.workshops || 0;
        document.getElementById("statConferences").textContent = stats.conferences || 0;
        document.getElementById("statFDP").textContent = stats.fdps || 0;
        document.getElementById("statPublications").textContent = stats.publications || 0;
        document.getElementById("statCredits").textContent = `₹${stats.total_credits || 0}`;

        initDistributionChart(stats);
    } catch (err) {
        console.error("Failed to load stats:", err);
    }
}

// 2. Load Faculty Summary Table
async function loadFacultySummary() {
    const body = document.getElementById("adminFacultyBody");
    const loader = document.getElementById("tableLoading");
    if (!body) return;

    try {
        const res = await fetchAuth(`${API}/admin/faculty-summary`);
        const data = await res.json();
        
        loader.classList.add("hidden");
        renderFacultyTable(data);
        
        // Setup Search
        document.getElementById("facultySearch").oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = data.filter(f => 
                f.name.toLowerCase().includes(term) || 
                f.department.toLowerCase().includes(term)
            );
            renderFacultyTable(filtered);
        };
    } catch (err) {
        loader.innerHTML = `<p class="text-red-500 font-bold">Failed to load faculty summary.</p>`;
    }
}

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

function renderFacultyTable(data) {
    const body = document.getElementById("adminFacultyBody");
    body.innerHTML = data.map((f, i) => `
        <tr class="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-none">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                        ${i + 1}
                    </div>
                    <span class="font-bold text-slate-800">${f.name}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-slate-500 font-medium">${normalizeDept(f.department) || '—'}</td>
            <td class="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/30">${f.workshops || 0}</td>
            <td class="px-6 py-4 text-center font-bold text-teal-600">${f.conferences || 0}</td>
            <td class="px-6 py-4 text-center font-bold text-green-600 bg-green-50/30">${f.fdps || 0}</td>
            <td class="px-6 py-4 text-center font-bold text-orange-600">${f.publications || 0}</td>
            <td class="px-6 py-4 text-center">
                <span class="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-black">₹${f.credits || 0}</span>
            </td>
            <td class="px-6 py-4 text-right space-x-2">
                <button onclick="viewUserDash('${f.name}')" class="text-indigo-600 hover:text-indigo-900 font-bold px-2 py-1 rounded hover:bg-indigo-50 transition-all" title="View Dashboard">👁️</button>
                <button onclick="editFaculty(${f.id})" class="text-slate-400 hover:text-slate-600 px-2 py-1" title="Edit Profile">✏️</button>
                <button onclick="delFaculty(${f.id})" class="text-red-400 hover:text-red-600 px-2 py-1" title="Delete Account">🗑️</button>
            </td>
        </tr>
    `).join("");
}

// 3. Pending Activities & Approvals
async function loadPendingActivities() {
    const body = document.getElementById("pendingBody");
    const panel = document.getElementById("approvalPanel");
    if (!body) return;

    try {
        const res = await fetchAuth(`${API}/admin/pending-activities`);
        const data = await res.json();

        if (data.length > 0) {
            panel.classList.remove("hidden");
            document.getElementById("pendingBadge").textContent = `${data.length} Pending`;
            body.innerHTML = data.map(a => `
                <tr class="hover:bg-amber-50/20 transition-all">
                    <td class="px-6 py-4 font-bold text-slate-700">${a.faculty_name}</td>
                    <td class="px-6 py-4 text-slate-600">${a.title}</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-bold">${a.activity_type}</span>
                    </td>
                    <td class="px-6 py-4 text-slate-500">${new Date(a.date).toLocaleDateString()}</td>
                    <td class="px-6 py-4 text-right space-x-2">
                        <button onclick="updateStatus(${a.id}, 'APPROVED')" class="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-indigo-700">Approve</button>
                        <button onclick="updateStatus(${a.id}, 'REJECTED')" class="text-slate-400 hover:text-red-500 px-3 py-1 text-xs font-bold">Reject</button>
                    </td>
                </tr>
            `).join("");
        } else {
            panel.classList.add("hidden");
        }
    } catch (err) {
        console.error("Failed to load pending:", err);
    }
}

async function updateStatus(id, status) {
    if (!confirm(`Mark as ${status}?`)) return;
    try {
        const res = await fetchAuth(`${API}/admin/activity-status/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Activity ${status.toLowerCase()}!`, status === 'APPROVED' ? "✅" : "❌");
            loadAdminStats();
            loadPendingActivities();
            loadFacultySummary();
        }
    } catch (err) {
        showToast("Action failed", "⚠️");
    }
}

// 4. Analytics Charts
async function loadAnalytics() {
    try {
        const res = await fetchAuth(`${API}/admin/growth`);
        const data = await res.json();
        initGrowthChart(data);
    } catch (err) {
        console.error("Analytics failure:", err);
    }
}

function initGrowthChart(data) {
    const ctx = document.getElementById("growthChart").getContext("2d");
    if (adminCharts['growth']) adminCharts['growth'].destroy();
    
    adminCharts['growth'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.year),
            datasets: [{
                label: 'Activities',
                data: data.map(d => d.count),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 4,
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#e2e8f0' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function initDistributionChart(stats) {
    const ctx = document.getElementById("distChart").getContext("2d");
    if (adminCharts['dist']) adminCharts['dist'].destroy();
    
    adminCharts['dist'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Workshops', 'Conferences', 'FDP', 'Publications'],
            datasets: [{
                data: [stats.workshops, stats.conferences, stats.fdps, stats.publications],
                backgroundColor: ['#3b82f6', '#14b8a6', '#10b981', '#f59e0b'],
                hoverOffset: 10,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { weight: 'bold' } } }
            }
        }
    });
}

// Admin Navigation & Faculty Management
function viewUserDash(name) {
    localStorage.setItem("viewingUser", name);
    showToast(`Redirecting to ${name}'s dashboard...`, "🚀");
    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 1000);
}

function delFaculty(id) {
    if (!confirm("Delete this faculty account? This cannot be undone.")) return;
    fetchAuth(`${API}/faculty/${id}`, { method: "DELETE" })
    .then(() => { showToast("Faculty deleted!"); loadAdminStats(); loadFacultySummary(); });
}

function editFaculty(id) {
    // Placeholder for edit logic or redirection
    showToast("Editing faculty module coming soon!", "🛠️");
}
