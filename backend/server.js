require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ MySQL Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "student",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database Connection Failed:", err);
    } else {
        console.log("✅ MySQL Connected to 'student' database...");
        connection.release();
    }
});

// ✅ Test route
app.get("/", (req, res) => {
    res.send("✅ Server is running!");
});

// ✅ Insert or Update student marks (UPSERT)
app.post("/add-marks", (req, res) => {
    const { student_id, sub1, sub2, sub3, sub4, sub5 } = req.body;

    if (!student_id) {
        return res.status(400).json({ error: "❌ Student ID is required" });
    }

    const query = `
        INSERT INTO mark_table (student_id, sub1, sub2, sub3, sub4, sub5)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        sub1 = VALUES(sub1), 
        sub2 = VALUES(sub2), 
        sub3 = VALUES(sub3), 
        sub4 = VALUES(sub4), 
        sub5 = VALUES(sub5)
    `;

    db.query(query, [student_id, sub1, sub2, sub3, sub4, sub5], (err, result) => {
    if (err) {
        console.error("❌ Error inserting/updating marks:", err);
        return res.status(500).json({ error: "❌ Failed to add or update marks" });
    }

    res.status(200).json({ message: "✅ Marks added/updated successfully!" });
});
});

// ✅ Fetch all student marks
app.get("/marks", (req, res) => {
    const query = "SELECT * FROM mark_table";

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error fetching marks:", err);
            return res.status(500).json({ error: "❌ Failed to fetch marks" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "❌ No marks found in database" });
        }

        res.status(200).json(results);
    });
});

// ✅ Fetch marks by student ID
app.get("/marks/:student_id", (req, res) => {
    const { student_id } = req.params;
    const query = "SELECT * FROM mark_table WHERE student_id = ?";

    db.query(query, [student_id], (err, results) => {
        if (err) {
            console.error("❌ Error fetching student marks:", err);
            return res.status(500).json({ error: "❌ Failed to fetch student marks" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "❌ No marks found for this student ID" });
        }

        res.status(200).json(results[0]); // Return only one object instead of an array
    });
});

// ✅ Delete student marks by ID
app.delete("/marks/:student_id", (req, res) => {
    const { student_id } = req.params;
    const query = "DELETE FROM mark_table WHERE student_id = ?";

    db.query(query, [student_id], (err, result) => {
        if (err) {
            console.error("❌ Error deleting student marks:", err);
            return res.status(500).json({ error: "❌ Failed to delete student marks" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "❌ No marks found to delete" });
        }

        res.status(200).json({ message: "✅ Marks deleted successfully!" });
    });
});

// ✅ Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
