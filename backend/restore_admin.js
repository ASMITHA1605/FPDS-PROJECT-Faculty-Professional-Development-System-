const db = require("./db");
const sql = "INSERT INTO faculty (name, password, department) VALUES ('admin', 'admin123', 'Administration')";
db.query(sql, (err, res) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("Admin user restored successfully.");
    process.exit(0);
});
