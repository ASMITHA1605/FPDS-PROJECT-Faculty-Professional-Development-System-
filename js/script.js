// ================= LOGIN FUNCTION =================

function login() {
    var role = document.getElementById("role").value;
    var user = document.getElementById("username").value;
    var pass = document.getElementById("password").value;

    if (role === "admin" && user === "admin" && pass === "1234") {
        localStorage.setItem("loggedUser", "Admin");
        window.location.href = "dashboard.html";
    } 
    else if (role === "faculty" && user === "faculty" && pass === "1234") {
        localStorage.setItem("loggedUser", user);
        window.location.href = "faculty.html";
    } 
    else {
        alert("Invalid Credentials");
    }
}


// ================= FACULTY STORAGE =================

let facultyData = JSON.parse(localStorage.getItem("facultyData")) || [];

window.onload = function () {
    if (document.getElementById("facultyTable")) {
        displayFaculty();
    }
};


// ================= ADD FACULTY =================

function addFaculty() {
    let name = document.getElementById("name").value;
    let dept = document.getElementById("department").value;
    let skill = document.getElementById("skill").value;

    if (name === "" || dept === "" || skill === "") {
        alert("Please fill all fields");
        return;
    }

    facultyData.push({ name, dept, skill });
    localStorage.setItem("facultyData", JSON.stringify(facultyData));

    document.getElementById("name").value = "";
    document.getElementById("department").value = "";
    document.getElementById("skill").value = "";

    displayFaculty();
}


// ================= DISPLAY FACULTY =================

function displayFaculty() {
    let tbody = document.querySelector("#facultyTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    facultyData.forEach((faculty, index) => {
        let row = `<tr>
            <td>${faculty.name}</td>
            <td>${faculty.dept}</td>
            <td>${faculty.skill}</td>
            <td>
                <button onclick="editFaculty(${index})">Edit</button>
                <button onclick="deleteFaculty(${index})">Delete</button>
            </td>
        </tr>`;
        tbody.innerHTML += row;
    });
}


// ================= DELETE =================

function deleteFaculty(index) {
    facultyData.splice(index, 1);
    localStorage.setItem("facultyData", JSON.stringify(facultyData));
    displayFaculty();
}


// ================= EDIT =================

function editFaculty(index) {
    let faculty = facultyData[index];

    document.getElementById("name").value = faculty.name;
    document.getElementById("department").value = faculty.dept;
    document.getElementById("skill").value = faculty.skill;

    deleteFaculty(index);
}


// ================= SEARCH =================

function searchFaculty() {
    let searchValue = document.getElementById("search").value.toLowerCase();
    let rows = document.querySelectorAll("#facultyTable tbody tr");

    rows.forEach(row => {
        let text = row.innerText.toLowerCase();
        row.style.display = text.includes(searchValue) ? "" : "none";
    });
}


// ================= DASHBOARD LOGIC =================

if (window.location.pathname.includes("dashboard.html")) {

    document.getElementById("welcomeMessage").innerText =
        "Hello 👋 Welcome Back!";

    let today = new Date();
    document.getElementById("todayDate").innerText =
        "Today: " + today.toDateString();

    let facultyData = JSON.parse(localStorage.getItem("facultyData")) || [];

    if (document.getElementById("totalFaculty"))
        document.getElementById("totalFaculty").innerText = facultyData.length;
}


// ================= LOGOUT =================

function logout() {
    localStorage.removeItem("loggedUser");
}
