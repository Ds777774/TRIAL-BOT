const { Client, MessageEmbed } = require('discord.js');
const { setTimeout } = require('timers');

module.exports = {
  name: 'bumpReminder',
  execute(message) {
    // Check if the message is from Disboard bot
    if (message.author.id === '1338037787924107365' && message.content.includes('Thx for bumping our Server!')) {
      // Find the user who bumped the server
      const bumpedUser = message.mentions.users.first();
      if (bumpedUser) {
        // Thank the user immediately after the bump
        sendThankYouMessage(bumpedUser, message.guild);

        // Send a reminder message after 5 minutes
        setTimeout(() => {
          sendReminderMessage(bumpedUser, message.guild);
        }, 5 * 60 * 1000); // 5 minutes in milliseconds
      }
    }
  }
};

// Function to send a thank you message
function sendThankYouMessage(user, guild) {
  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Thank you for bumping!')
    .setDescription(`Thank you, ${user}, for bumping the server! Your support is greatly appreciated!`);

  // Send the message in the current channel or you can choose a specific channel
  const channel = guild.channels.cache.find(c => c.name === 'general'); // Change to desired channel name
  if (channel) {
    channel.send({ embeds: [embed] });
  }
}

// Function to send a reminder message after 5 minutes
function sendReminderMessage(user, guild) {
  const embed = new MessageEmbed()
    .setColor('#ff9900')
    .setTitle('Friendly Reminder')
    .setDescription(`Hey ${user}, don't forget to bump the server again! Your support helps us grow!`);

  // Send the reminder message in the same channel or another one
  const channel = guild.channels.cache.find(c => c.name === 'general'); // Change to desired channel name
  if (channel) {
    channel.send({ embeds: [embed] });
  }
}