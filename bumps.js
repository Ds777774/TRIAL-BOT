const { EmbedBuilder } = require('discord.js');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Ensure the table exists
const createTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS bump_leaderboard (
            user_id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            bump_count INTEGER DEFAULT 0
        );
    `;
    await pool.query(query);
};

// Update bump count in the database
const updateBumpCount = async (userId, username) => {
    try {
        await createTable(); // Ensure table exists
        const query = `
            INSERT INTO bump_leaderboard (user_id, username, bump_count)
            VALUES ($1, $2, 1)
            ON CONFLICT (user_id)
            DO UPDATE SET bump_count = bump_leaderboard.bump_count + 1, username = EXCLUDED.username;
        `;
        const res = await pool.query(query, [userId, username]);
        console.log(`Bump recorded for: ${username}`);  // Log successful update
    } catch (err) {
        console.error("Error updating bump count:", err);
    }
};

// Get leaderboard data
const getLeaderboard = async () => {
    try {
        const query = `SELECT username, bump_count FROM bump_leaderboard ORDER BY bump_count DESC LIMIT 10;`;
        const result = await pool.query(query);
        return result.rows;
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        return [];
    }
};

// Handle bump detection
const trackBump = async (message) => {
    const bumpBotId = '1338037787924107365'; // Replace with the actual bot's ID
    const bumpMessageSubstring = "Thx for bumping our Server! We will remind you in 2 hours!"; // Partial match

    // Log every incoming message
    console.log(`Message from ${message.author.username}: ${message.content}`);

    // Only track messages from the specified bump bot
    if (message.author.id !== bumpBotId) {
        console.log(`Message is not from the bump bot. Skipping...`);
        return;
    }

    // Check if the message contains the bump message substring and mentions a user
    if (message.content.includes(bumpMessageSubstring) && message.mentions.users.size > 0) {
        const bumpedUser = message.mentions.users.first();
        console.log(`Bump detected! User: ${bumpedUser.username}`);
        await updateBumpCount(bumpedUser.id, bumpedUser.username);
    } else {
        console.log("No bump message or no user mentioned.");
    }
};

// Handle `!bumps` command
const execute = async (message) => {
    try {
        const leaderboard = await getLeaderboard();

        if (leaderboard.length === 0) {
            return message.channel.send("No bumps recorded yet.");
        }

        const embed = new EmbedBuilder()
            .setTitle("📊 Bump Leaderboard")
            .setColor("#acf508");

        leaderboard.forEach((entry, index) => {
            embed.addFields({ name: `#${index + 1} - ${entry.username}`, value: `${entry.bump_count} bumps`, inline: false });
        });

        message.channel.send({ embeds: [embed] });
    } catch (err) {
        console.error("Error executing `!bumps` command:", err);
        message.channel.send("An error occurred while fetching the leaderboard.");
    }
};

module.exports = { trackBump, execute };