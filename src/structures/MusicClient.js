const express = require('express');
const { Manager } = require('@lavacord/discord.js');
const { Client, Collection } = require('discord.js');
const { promises: { readdir } } = require('fs');
const { join } = require('path');
const { LavasfyClient } = require('lavasfy');

require('../extensions');

module.exports = class MusicClient extends Client {
    /** @param {import("discord.js").ClientOptions} [opt] */
    constructor(opt) {
        super(opt);
        this.commands = new Collection();
        this.manager = new Manager(this, [
            {
                id: 'main',
                host: process.env.LAVA_HOST,
                port: process.env.LAVA_PORT,
                password: process.env.LAVA_PASS
            }
        ]);
        this.spotify = process.env.ENABLE_SPOTIFY === 'true'
            ? new LavasfyClient({
                clientID: process.env.SPOTIFY_ID,
                clientSecret: process.env.SPOTIFY_SECRET,
                playlistLoadLimit: Number(process.env.SPOTIFY_PLAYLIST_PAGE_LIMIT),
                audioOnlyResults: true,
                useSpotifyMetadata: true
            }, this.manager.nodes.get('main'))
            : null;

        this.prefix = process.env.PREFIX.toLowerCase();

        // Set up Express server
        this.setupExpress();
    }

    build() {
        this.loadCommands();
        this.loadEventListeners();
        this.login(process.env.TOKEN);

        this.manager
            .on('ready', node => console.log(`Node ${node.id} is ready!`))
            .on('disconnect', (ws, node) => console.log(`Node ${node.id} disconnected.`))
            .on('reconnecting', node => console.log(`Node ${node.id} tries to reconnect.`))
            .on('error', (error, node) => console.error(`Node ${node.id} got an error: ${error.message}`));
    }

    /** @private */
    async loadCommands() {
        try {
            const commands = await readdir(join(__dirname, '..', 'commands'));
            for (const commandFile of commands) {
                const command = require(`../commands/${commandFile}`);
                this.commands.set(command.name, command);
            }
        } catch (error) {
            console.error('Error loading commands:', error);
        }
    }

    /** @private */
    async loadEventListeners() {
        try {
            const listeners = await readdir(join(__dirname, '..', 'listeners'));
            for (const listenerFile of listeners) {
                const listener = require(`../listeners/${listenerFile}`);
                this.on(listener.name, (...args) => listener.exec(this, ...args));
            }
        } catch (error) {
            console.error('Error loading event listeners:', error);
        }
    }

    /** @private */
    setupExpress() {
        const app = express();
        const port = process.env.PORT || 3000;

        app.get('/', (req, res) => {
            res.send('Bot is alive!');
        });

        app.listen(port, () => {
            console.log(`Express server running on port ${port} to keep the bot alive.`);
        });
    }
};
