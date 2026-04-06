const db = require("./db");
db.query("SELECT id, name, password FROM faculty", (err, res) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("| ID | Name | Password |");
    console.log("|----|------|----------|");
    res.forEach(r => {
        console.log(`| ${r.id} | ${r.name} | ${r.password} |`);
    });
    process.exit(0);
});
