const db = require("./db");
const adminUser = { name: "admin", department: "Administration", password: "admin123", experience_years: 10 };

db.query("SELECT * FROM faculty WHERE name = 'admin'", (err, result) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    if (result.length > 0) {
        console.log("Admin user already exists.");
        console.log("Username: admin");
        console.log("Password: " + result[0].password);
        process.exit(0);
    } else {
        const sql = "INSERT INTO faculty (name, department, password, experience_years) VALUES (?, ?, ?, ?)";
        db.query(sql, [adminUser.name, adminUser.department, adminUser.password, adminUser.experience_years], (err, result) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log("Admin user created successfully.");
            console.log("Username: admin");
            console.log("Password: admin123");
            process.exit(0);
        });
    }
});
