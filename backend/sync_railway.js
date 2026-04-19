const mysql = require("mysql2");

// HARDCODED Railway Credentials for Sync
const railwayConfig = {
    host: "mainline.proxy.rlwy.net",
    user: "root",
    password: "zjYHyiIICoyyrcErWtiZWnuYlnSeXcxr",
    database: "railway",
    port: 59037,
    connectTimeout: 20000
};

console.log("🚀 Connecting to Railway to sync database...");
const db = mysql.createConnection(railwayConfig);

db.connect((err) => {
    if (err) {
        console.error("❌ CONNECTION FAILED:", err.message);
        console.log("\n💡 TIP: Make sure you are on MOBILE HOTSPOT so the port isn't blocked!");
        process.exit(1);
    }
    console.log("✅ CONNECTED to Railway.");

    // 1. Create Tables
    const createFacultyTable = `
        CREATE TABLE IF NOT EXISTS faculty (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            department VARCHAR(100),
            password VARCHAR(100),
            experience_years INT DEFAULT 0
        );
    `;

    const createActivitiesTable = `
        CREATE TABLE IF NOT EXISTS activities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            faculty_name VARCHAR(100),
            activity_type VARCHAR(50),
            title VARCHAR(200),
            date DATE,
            organizer VARCHAR(100),
            department VARCHAR(100),
            semester VARCHAR(20),
            academic_year VARCHAR(20),
            status VARCHAR(20) DEFAULT 'PENDING'
        );
    `;

    db.query(createFacultyTable, (err) => {
        if (err) throw err;
        console.log("✅ Faculty table verified.");

        db.query(createActivitiesTable, (err) => {
            if (err) throw err;
            console.log("✅ Activities table verified.");

            // 2. Add Admin User
            const addAdmin = "INSERT IGNORE INTO faculty (name, department, password, experience_years) VALUES ('admin', 'Administration', 'admin123', 0)";
            db.query(addAdmin, (err) => {
                if (err) throw err;
                console.log("✅ Admin user (admin / admin123) added to Railway.");
                
                console.log("\n✨ SYNC COMPLETE! Your Render login should now work.");
                db.end();
                process.exit(0);
            });
        });
    });
});
