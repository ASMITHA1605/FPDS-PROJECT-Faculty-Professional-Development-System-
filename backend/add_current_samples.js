const db = require("./db");
const now = new Date();
const currentMonth = now.getMonth();
const startYear = (currentMonth >= 5) ? now.getFullYear() : now.getFullYear() - 1;
const currentYearStr = `${startYear}-${(startYear + 1).toString().slice(-2)}`;
const currentSem = (currentMonth >= 5 && currentMonth <= 11) ? "Odd" : "Even";

const activities = [
    { faculty: "faculty", type: "Workshop", title: "Advanced Node.js", date: "2026-03-10", organizer: "Google", department: "CSE", semester: currentSem, academic_year: currentYearStr },
    { faculty: "faculty", type: "Conference", title: "Future of AI", date: "2026-03-11", organizer: "IEEE", department: "CSE", semester: currentSem, academic_year: currentYearStr },
    { faculty: "faculty", type: "FDP", title: "Cloud Architecture", date: "2026-03-12", organizer: "AWS", department: "CSE", semester: currentSem, academic_year: currentYearStr },
    { faculty: "faculty", type: "Publication", title: "Agentic AI Paper", date: "2026-03-13", organizer: "Nature", department: "CSE", semester: currentSem, academic_year: currentYearStr }
];

let completed = 0;
activities.forEach(a => {
    const sql = "INSERT INTO activities (faculty_name, activity_type, title, date, organizer, department, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [a.faculty, a.type, a.title, a.date, a.organizer, a.department, a.semester, a.academic_year], (err) => {
        if (err) console.error(err);
        completed++;
        if (completed === activities.length) {
            console.log(`Successfully added 4 activities for corrected Year: ${currentYearStr}, Semester: ${currentSem}`);
            process.exit(0);
        }
    });
});
