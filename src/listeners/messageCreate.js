const CommandContext = require("../structures/CommandContext");

module.exports = {
    name: "messageCreate",
    exec: async (client, msg) => {
        if (!msg.guild || msg.author.bot) return;
        if (!msg.channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) return;  

        const prefix = msg.content.toLowerCase().startsWith(client.prefix) ? client.prefix : `<@!${client.user.id}>`;
        if (!msg.content.toLowerCase().startsWith(prefix)) return;
        
        const args = msg.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(c => c.aliases && c.aliases.includes(commandName));
        if (command) {
            try {
                await command.exec(new CommandContext(command, msg, args));
            } catch (e) {
                console.error(e);
            }
        }
    }
};
