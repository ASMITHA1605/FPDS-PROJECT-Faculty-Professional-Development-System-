const db = require("./db");
const now = new Date();
const currentMonth = now.getMonth();
const startYear = (currentMonth >= 5) ? now.getFullYear() : now.getFullYear() - 1;
const currentYearStr = `${startYear}-${(startYear + 1).toString().slice(-2)}`;
const currentSem = (currentMonth >= 5 && currentMonth <= 11) ? "Odd" : "Even";

const activities = [
    { faculty: "Dr. Ravi", type: "Workshop", title: "ML in Healthcare", date: "2026-03-05", organizer: "NIT", department: "CSE", semester: currentSem, academic_year: currentYearStr },
    { faculty: "Dr. Ravi", type: "Conference", title: "IEEE Cloud 2026", date: "2026-03-06", organizer: "IEEE", department: "CSE", semester: currentSem, academic_year: currentYearStr },
    { faculty: "Dr. Ravi", type: "FDP", title: "Microservices", date: "2026-03-07", organizer: "IBM", department: "CSE", semester: currentSem, academic_year: currentYearStr },
    { faculty: "Dr. Ravi", type: "Publication", title: "Edge Computing Trends", date: "2026-03-08", organizer: "Elsevier", department: "CSE", semester: currentSem, academic_year: currentYearStr }
];

let completedCount = 0;
activities.forEach(a => {
    const sql = "INSERT INTO activities (faculty_name, activity_type, title, date, organizer, department, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [a.faculty, a.type, a.title, a.date, a.organizer, a.department, a.semester, a.academic_year], (err) => {
        if (err) console.error(err);
        completedCount++;
        if (completedCount === activities.length) {
            console.log(`Successfully added 4 activities for Dr. Ravi (Year: ${currentYearStr}, Sem: ${currentSem})`);
            process.exit(0);
        }
    });
});
