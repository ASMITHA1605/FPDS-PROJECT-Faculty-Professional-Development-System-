const db = require("./db");
db.query("ALTER TABLE activities ADD COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED'", (err, res) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Status column already exists.");
        } else {
            console.error(err);
            process.exit(1);
        }
    } else {
        console.log("Status column added successfully.");
    }
    process.exit(0);
});
