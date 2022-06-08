#!

import {WebSocketServer, WebSocket} from "ws";
import {createServer} from "http";
import Song from "./entity/Song";
import {readFileSync} from "fs";

import * as mm from 'music-metadata/lib/core';
import listNetworkInterfaces from "./entity/util/listNetworkInterfaces";
import getSongs from "./entity/util/getSongs";
import PasswordManager from "./entity/util/PasswordManager";
import parsePath from "./entity/util/parsePath";
import fetch from "node-fetch";

const config = require("../config.json");

let current_song: Song;
let song_started_time: number;

//load a list of all songs from the config path
let songs: string[] = [];

let pw_man: PasswordManager | undefined;

let songs_played = 0;

if(config.server.auth.enabled) {
    pw_man = new PasswordManager(config.server.auth.username, config.server.auth.password_sha512);
}

getSongs(config.music.allowed_filetypes, parsePath(), config.music.media_url.url_base, config.music.method.url).then(async (r) => {
    console.log(`Found ${r.length} songs`);
    songs = r;
    await st();
});

console.log(`found ${songs.length} songs`);

//on connection
function onConnection(socket: WebSocket) {
    
    //NodeRadio headers
    socket.send("NODE-RADIO/1.0");
    socket.send("Current-Song: " + current_song?.name);
    socket.send("Song-Length: " + current_song?.length);
    socket.send("Song-Position: " + (Date.now() - song_started_time));
    socket.send("Users-Online: " + server.clients.size);
    socket.send("Metadata: " + JSON.stringify(current_song?.metadata));
    socket.send("URL-Audio: " + config.music.method.url);
    
    if(config.music.method.url) {
        socket.send("URL-Base: " + config.music.media_url.url_base);
    }
    
    //on user message
    socket.on("message", (data) => {
        const d = data.toString();
        
        //send the current song data
        if(d.startsWith("Fetch-Song")) {
            //send the current song data
            
            if(config.music.method.url) {
                socket.send("Song-Data: " + current_song.uri);
            } else {
                socket.send("Song-Data: " + current_song.data.toString("base64"));
            }
        }
    });
}

const http_server = createServer((req, res) => {
    if(pw_man) {
        //if there is no auth, send the WWW-Authenticate header
        if(!req.headers.authorization) {
            res.writeHead(401, {
                "WWW-Authenticate": "Basic realm=\"NodeRadio\""
            });
            res.end();
            return;
        } else {
            //if there is an auth, check it
            const auth = Buffer.from(req.headers.authorization.split(" ")[1] || "", "base64").toString().split(":");
            if(!auth || !auth[0] || !auth[1]) {
                res.writeHead(401);
                res.end("Access denied");
                return;
            }
            pw_man.compare(auth[0], auth[1]).then((r) => {
                if(r) {
                    const site = readFileSync("./pub/index.html").toString();
                    res.writeHead(200, {'Content-Type': "text/html"});
                    res.end(site);
                } else {
                    res.writeHead(401);
                    res.end("Access denied");
                }
            });
            
            return;
        }
    }
    
    const site = readFileSync("./pub/index.html").toString();
    res.writeHead(200, {'Content-Type': "text/html"});
    res.end(site);
});

const server = new WebSocketServer({
    server: http_server,
});

http_server.listen(55392);

console.log(`server started`);

listNetworkInterfaces();

server.on("connection", (socket) => {
    onConnection(socket);
});

async function newSong(): Promise<Song> {
    let random_song = songs[Math.floor(Math.random() * songs.length)];
    if(songs.length > 1 && config.music.no_duplicates && current_song) {
        while(random_song === current_song.name) {
            random_song = songs[Math.floor(Math.random() * songs.length)];
        }
    }
    let buff_temp: Buffer;
    
    if(!config.music.method.url) {
        buff_temp = readFileSync(`${parsePath()}${random_song}`);
    } else {
        buff_temp = (await (await (fetch(config.music.media_url.url_base + random_song))).buffer())
    }
    
    let m_tmp = await mm.parseBuffer(buff_temp);
    
    let song_data = readFileSync(parsePath() + random_song);
    
    // @ts-ignore
    const cs = new Song(random_song, (m_tmp.format.duration || 0) * 1000, random_song, song_data, {
        title: m_tmp.common.title,
        artist: m_tmp.common.artist,
        album: m_tmp.common.album,
    });
    console.log("Playing " + cs.name);
    songs_played++;
    current_song = cs;
    return cs;
}

let timeout: string | number | NodeJS.Timeout | undefined;

async function to() {
    const d = await st();
    song_started_time = Date.now();
    
    //notify clients that a new song has been played
    server.clients.forEach((client) => {
        if(client.readyState === WebSocket.OPEN) {
            client.send("New-Song: " + d.name);
            client.send("Song-Length: " + d.length);
            client.send("Song-Position: " + (Date.now() - song_started_time));
            client.send("Users-Online: " + server.clients.size);
            client.send("Metadata: " + JSON.stringify(d.metadata));
            
        }
    });
}

//choose a random song
async function st() {
    const d = await newSong();
    song_started_time = Date.now();
    
    timeout = setTimeout(async () => {
        await to();
    }, d.length);
    
    return d;
}

const myRL = require('serverline');

myRL.init();
myRL.setCompletion(["skip", "stats", "client-info"]);

myRL.setPrompt('> ');

myRL.on('line', async (line) => {
    const args = line.split(" ");
    switch(args[0]) {
        case "skip": {
            clearTimeout(timeout);
            await to();
            return;
        }
        case "stats": {
            console.log(`songs played: ${songs_played}; connected users: ${server.clients.size}`);
            return;
        }
        case "client-info": {
            let i = 1;
            for(const c of server.clients) {
                // @ts-ignore
                console.log(`${i}: ${c._socket.remoteAddress}`);
            }
            return;
        }
        default:
            console.warn(`unknown command`);
            break;
    }
})

