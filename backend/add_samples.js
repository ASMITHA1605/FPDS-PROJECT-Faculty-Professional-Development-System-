const db = require("./db");
const activities = [
    { faculty: "faculty", type: "Workshop", title: "Modern Web Design", date: "2024-03-10", organizer: "Google", department: "CSE", semester: "Even", academic_year: "2023-24" },
    { faculty: "faculty", type: "Conference", title: "AI in Education", date: "2024-03-11", organizer: "IEEE", department: "CSE", semester: "Even", academic_year: "2023-24" },
    { faculty: "faculty", type: "FDP", title: "Full Stack Development", date: "2024-03-12", organizer: "NIELIT", department: "CSE", semester: "Even", academic_year: "2023-24" }
];

let completed = 0;
activities.forEach(a => {
    const sql = "INSERT INTO activities (faculty_name, activity_type, title, date, organizer, department, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [a.faculty, a.type, a.title, a.date, a.organizer, a.department, a.semester, a.academic_year], (err) => {
        if (err) console.error(err);
        completed++;
        if (completed === activities.length) {
            console.log("Sample activities added successfully");
            process.exit(0);
        }
    });
});
