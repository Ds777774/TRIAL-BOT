const { EmbedBuilder } = require("discord.js");
const { Pool } = require("pg"); 

// Set up PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATA_BASE,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
}); 

// Auto-reconnect on database errors
pool.on("error", async (err) => {
  console.error("Database connection lost. Attempting to reconnect...", err);
  try {
    await pool.query("SELECT 1"); // Test reconnection
    console.log("Database reconnected successfully.");
  } catch (error) {
    console.error("Reconnection attempt failed:", error);
  }
}); 

// Keep the connection alive every 2 minutes
setInterval(async () => {
  try {
    await pool.query("SELECT now()"); // Lightweight keep-alive query
  } catch (err) {
    console.error("Database keep-alive failed:", err);
  }
}, 120000); // 120000ms = 2 minutes 

// Create the `bumps` table if it doesn't exist
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bumps (
        userId TEXT PRIMARY KEY,
        username TEXT,
        count INTEGER DEFAULT 0
      )
    `);
    console.log("Bump table ensured.");
  } catch (err) {
    console.error("Failed to initialize database:", err.message);
  }
})(); 

const BUMP_BOT_ID = "1338037787924107365";
const BUMP_MESSAGE = "Thx for bumping our Server! We will remind you in 2 hours!"; 

module.exports = {
  handleBumpMessage: async (message) => {
    if (message.author.id === BUMP_BOT_ID && message.content.startsWith(BUMP_MESSAGE)) {
      const mentionedUser = message.mentions.users.first();
      if (!mentionedUser) return; 

      const userId = mentionedUser.id;
      const username = mentionedUser.username; 

      try {
        const res = await pool.query(`SELECT count FROM bumps WHERE userId = $1`, [userId]); 

        if (res.rows.length > 0) {
          // Update bump count
          await pool.query(`UPDATE bumps SET count = count + 1 WHERE userId = $1`, [userId]);
        } else {
          // Insert new user
          await pool.query(`INSERT INTO bumps (userId, username, count) VALUES ($1, $2, 1)`, [userId, username]);
        }
      } catch (err) {
        console.error("Database error:", err.message);
      }
    }
  }, 

  showLeaderboard: async (message) => {
    try {
      const res = await pool.query(`SELECT username, count FROM bumps ORDER BY count DESC LIMIT 10`); 

      if (res.rows.length === 0) {
        return message.channel.send("No bumps recorded yet.");
      } 

      const leaderboard = res.rows
        .map((entry, index) => `**${index + 1}.** ${entry.username} - **${entry.count} bumps**`)
        .join("\n"); 

      const embed = new EmbedBuilder()
        .setTitle("DISBOARD BUMPS")
        .setColor("#acf508")
        .setDescription(leaderboard)
        .setFooter({ text: "Keep bumping to climb the leaderboard!" }); 

      message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Database error:", err.message);
      message.channel.send("Error retrieving leaderboard.");
    }
  },
};