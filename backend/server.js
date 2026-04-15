const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const JWT_SECRET = "fpds_secret_key_2026"; // In production, use env variable
const DEMO_MODE = false; // Set to false to use the real database!

app.use(cors());
app.use(express.json());

// SERVE STATIC FILES
app.use(express.static(path.join(__dirname, "..")));

// AUTH MIDDLEWARE
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(403).json({ message: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Unauthorized" });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        req.userName = decoded.name;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.userRole !== "admin") return res.status(403).json({ message: "Require Admin Role" });
    next();
};

// SERVE LOGIN PAGE BY DEFAULT
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});

// LOGIN API
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM faculty WHERE name=? AND password=?";
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.length > 0) {
            const user = result[0];
            const role = (user.name === "admin") ? "admin" : "faculty";
            const token = jwt.sign({ id: user.id, role: role, name: user.name }, JWT_SECRET, { expiresIn: "24h" });
            res.json({ success: true, token, user: { ...user, role } });
        } else {
            res.status(401).json({ success: false, message: "Invalid login" });
        }
    });
});

// ADD ACTIVITY
app.post("/addActivity", verifyToken, (req, res) => {
    // Demo mode bypass
    if (DEMO_MODE) {
        return res.json({
            success: true,
            message: "Activity Added (Demo Mode)",
            status: "APPROVED"
        });
    }

    const { faculty, type, title, date, organizer, department, semester, academic_year } = req.body;
    // Automatically set status to PENDING for faculty, APPROVED for admin
    const status = (req.userRole === "admin") ? "APPROVED" : "PENDING";

    const sql = `
        INSERT INTO activities 
        (faculty_name, activity_type, title, date, organizer, department, semester, academic_year, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [faculty, type, title, date, organizer, department, semester, academic_year, status], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, message: "Activity Added", status });
    });
});

// GET ACTIVITIES
app.get("/activities", verifyToken, (req, res) => {
    let sql = "SELECT * FROM activities WHERE status = 'APPROVED' OR faculty_name = ? ORDER BY date DESC";
    let params = [req.userName];
    // Admin can see all, faculty only their own and approved ones
    if (req.userRole === "admin") {
        sql = "SELECT * FROM activities ORDER BY date DESC";
        params = [];
    }
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result);
    });
});

// DELETE ACTIVITY
app.delete("/activities/:id", verifyToken, (req, res) => {
    const sql = "DELETE FROM activities WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, message: "Activity deleted" });
    });
});

// UPDATE ACTIVITY (Admin Only)
app.put("/activities/:id", verifyToken, isAdmin, (req, res) => {
    const { activity_type, title, date, organizer, department, semester, academic_year, status } = req.body;
    const sql = `
        UPDATE activities 
        SET activity_type=?, title=?, date=?, organizer=?, department=?, semester=?, academic_year=?, status=?
        WHERE id=?
    `;
    db.query(sql, [activity_type, title, date, organizer, department, semester, academic_year, status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, message: "Activity updated" });
    });
});

// GET ALL FACULTY (Admin)
app.get("/faculty", verifyToken, isAdmin, (req, res) => {
    const sql = "SELECT id, name, department, experience_years FROM faculty ORDER BY name ASC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result);
    });
});

// ADD NEW FACULTY
app.post("/addFaculty", verifyToken, isAdmin, (req, res) => {
    const { name, department, password, experience_years } = req.body;
    const sql = "INSERT INTO faculty (name, department, password, experience_years) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, department, password, experience_years || 0], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, message: "Faculty added" });
    });
});

// DELETE FACULTY
app.delete("/faculty/:id", verifyToken, isAdmin, (req, res) => {
    const sql = "DELETE FROM faculty WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, message: "Faculty deleted" });
    });
});

// IMPROVEMENT TRACKER API
app.get("/improvement/:faculty", verifyToken, (req, res) => {
    const faculty = req.params.faculty;
    const sql = `
        SELECT 
            YEAR(date) as year,
            SUM(CASE WHEN activity_type = 'Workshop' THEN 1 ELSE 0 END) as workshops,
            SUM(CASE WHEN activity_type = 'Conference' THEN 1 ELSE 0 END) as conferences,
            SUM(CASE WHEN activity_type = 'FDP' THEN 1 ELSE 0 END) as fdps,
            SUM(CASE WHEN activity_type = 'Publication' THEN 1 ELSE 0 END) as publications
        FROM activities
        WHERE faculty_name = ? AND status = 'APPROVED'
        GROUP BY YEAR(date)
        ORDER BY year DESC
        LIMIT 3
    `;
    db.query(sql, [faculty], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        const sorted = result.sort((a, b) => a.year - b.year);
        const formatted = sorted.map(r => ({
            year: r.year.toString(),
            workshops: r.workshops,
            conferences: r.conferences,
            fdps: r.fdps,
            publications: r.publications
        }));
        res.json(formatted);
    });
});

// GET SINGLE FACULTY (Profile)
app.get("/faculty/:name", verifyToken, (req, res) => {
    const sql = "SELECT * FROM faculty WHERE name = ?";
    db.query(sql, [req.params.name], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result[0] || {});
    });
});

// UPDATE FACULTY PROFILE
app.put("/faculty/:name", verifyToken, (req, res) => {
    const { department, experience_years } = req.body;
    const name = req.params.name;
    const sql = "UPDATE faculty SET department = ?, experience_years = ? WHERE name = ?";
    db.query(sql, [department, experience_years, name], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, message: "Profile updated" });
    });
});

// ============================================
//  ADMIN ANALYTICS & AGGREGATES
// ============================================

// 1. SYSTEM-WIDE STATS
app.get("/admin/stats", verifyToken, isAdmin, (req, res) => {
    const queries = {
        faculty: "SELECT COUNT(*) as count FROM faculty",
        workshops: "SELECT COUNT(*) as count FROM activities WHERE activity_type = 'Workshop' AND status = 'APPROVED'",
        conferences: "SELECT COUNT(*) as count FROM activities WHERE activity_type = 'Conference' AND status = 'APPROVED'",
        fdps: "SELECT COUNT(*) as count FROM activities WHERE activity_type = 'FDP' AND status = 'APPROVED'",
        publications: "SELECT COUNT(*) as count FROM activities WHERE activity_type = 'Publication' AND status = 'APPROVED'",
        total_acts: "SELECT COUNT(*) as count FROM activities WHERE status = 'APPROVED'"
    };

    const results = {};
    let completed = 0;
    const keys = Object.keys(queries);

    keys.forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) return res.status(500).json({ error: err });
            results[key] = result[0].count;
            completed++;
            if (completed === keys.length) {
                const creditSql = `
                    SELECT faculty_name, COUNT(*) as count 
                    FROM activities 
                    WHERE activity_type = 'Workshop' AND status = 'APPROVED'
                    GROUP BY faculty_name
                `;
                db.query(creditSql, (err, rows) => {
                    if (err) return res.status(500).json({ error: err });
                    let totalCredits = 0;
                    rows.forEach(r => {
                        totalCredits += Math.min(r.count, 4) * 500;
                    });
                    results.total_credits = totalCredits;
                    res.json(results);
                });
            }
        });
    });
});

// 2. FACULTY CONSOLIDATED SUMMARY (Table)
app.get("/admin/faculty-summary", verifyToken, isAdmin, (req, res) => {
    const sql = `
        SELECT 
            f.id,
            f.name, 
            f.department,
            SUM(CASE WHEN a.activity_type = 'Workshop' AND a.status = 'APPROVED' THEN 1 ELSE 0 END) as workshops,
            SUM(CASE WHEN a.activity_type = 'Conference' AND a.status = 'APPROVED' THEN 1 ELSE 0 END) as conferences,
            SUM(CASE WHEN a.activity_type = 'FDP' AND a.status = 'APPROVED' THEN 1 ELSE 0 END) as fdps,
            SUM(CASE WHEN a.activity_type = 'Publication' AND a.status = 'APPROVED' THEN 1 ELSE 0 END) as publications,
            COUNT(CASE WHEN a.status = 'APPROVED' THEN a.id END) as total_activities
        FROM faculty f
        LEFT JOIN activities a ON f.name = a.faculty_name
        GROUP BY f.id, f.name, f.department
        ORDER BY total_activities DESC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err });

        const creditSql = `
            SELECT faculty_name, COUNT(*) as count 
            FROM activities 
            WHERE activity_type = 'Workshop' AND status = 'APPROVED'
            GROUP BY faculty_name
        `;
        db.query(creditSql, (err, creditsRows) => {
            if (err) return res.status(500).json({ error: err });

            const facultyCredits = {};
            creditsRows.forEach(r => {
                facultyCredits[r.faculty_name] = Math.min(r.count, 4) * 500;
            });

            const final = result.map(f => ({
                ...f,
                credits: facultyCredits[f.name] || 0
            }));
            res.json(final);
        });
    });
});

// 3. PENDING ACTIVITIES (Approval)
app.get("/admin/pending-activities", verifyToken, isAdmin, (req, res) => {
    const sql = "SELECT * FROM activities WHERE status = 'PENDING' ORDER BY date DESC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result);
    });
});

// 4. APPROVE/REJECT ACTIVITY
app.put("/admin/activity-status/:id", verifyToken, isAdmin, (req, res) => {
    const { status } = req.body;
    const sql = "UPDATE activities SET status = ? WHERE id = ?";
    db.query(sql, [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, message: `Activity ${status.toLowerCase()}` });
    });
});

// 5. SYSTEM GROWTH (Analytics)
app.get("/admin/growth", verifyToken, isAdmin, (req, res) => {
    const sql = `
        SELECT 
            YEAR(date) as year,
            COUNT(*) as count
        FROM activities
        WHERE status = 'APPROVED'
        GROUP BY YEAR(date)
        ORDER BY year ASC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});