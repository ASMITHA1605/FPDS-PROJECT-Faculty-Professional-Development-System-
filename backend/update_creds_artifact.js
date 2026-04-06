const db = require("./db");
const fs = require("fs");
const path = require("path");

const artifactPath = "C:\\Users\\asmit\\.gemini\\antigravity\\brain\\e4a44276-5f8c-47bc-8c61-ff4a6066f8c5\\credentials.md";

db.query("SELECT id, name, password FROM faculty", (err, res) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    
    let content = "# Faculty Login Credentials\n\n";
    content += "Below are the login IDs and passwords for all registered faculty members in the system.\n\n";
    content += "| ID | Name | Password |\n";
    content += "|----|------|----------|\n";
    
    res.forEach(r => {
        content += `| ${r.id} | ${r.name} | ${r.password} |\n`;
    });
    
    content += "\n> [!IMPORTANT]\n";
    content += "> These credentials are for initial login and testing. Please ensure faculty members update their passwords if necessary.\n";
    
    try {
        fs.writeFileSync(artifactPath, content, "utf8");
        console.log("Credentials artifact updated successfully.");
    } catch (e) {
        console.error("Error writing artifact:", e);
        process.exit(1);
    }
    process.exit(0);
});
