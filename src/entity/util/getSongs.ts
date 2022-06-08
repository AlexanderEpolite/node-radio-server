import {homedir} from "os";
import fetch from "node-fetch";

const config = require("../../../config.json");

if(config.music.media_url.allow_invalid_cert)
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = String(0);

function getLocal(allowed_types: string[], path: string): string[] {
    path.replace("~", `${homedir()}/`);
    
    let songs = require("fs").readdirSync(path).filter(file => {
        return allowed_types.includes(file.split(".").pop());
    });
    
    const dirs = require("fs").readdirSync(path).filter(file => require("fs").lstatSync(path + file).isDirectory());
    
    //scan all subdirectories for songs
    for(let dir of dirs) {
        let old = songs.length;
        
        //skip dotfiles
        if(dir.startsWith(".")) {
            console.log(`Skipping ${dir} because it starts with a dot`);
            continue;
        }
        
        songs = songs.concat(require("fs").readdirSync(path + dir).filter(file => file.endsWith(".mp3")).map(file => dir + "/" + file));
        
        console.log(`Added ${songs.length - old} songs from ${dir}`);
    }
    
    if(songs.length === 0) {
        console.error(`No songs found in ${path}`);
        console.error(`if you are running windows, change the directory in config.json to be something like "C:\\Users\\you\\Music\\"`);
        process.exit(1);
    }
    
    return songs;
}

async function getRemote(allowed_types: string[], url: string): Promise<string[]> {
    const songs: string[] = [];
    
    //append a trailing slash if it is missing
    if(!url.endsWith("/songs.txt")) {
        url += "/songs.txt";
    }
    
    const s = await (await fetch(url)).text();
    
    const lines = s.split("\n");
    console.log(`lines: ${lines.length}`);
    
    //for each line
    for(let line of lines) {
        //split the line into parts
        const parts = line.split(".");
        
        //if the line is not empty and the filetype is allowed
        if(allowed_types.includes(parts[parts.length - 1] || "")) {
            songs.push(line);
        }
    }
    
    return songs;
}

export default async function(allowed_types: string[], path: string, uri: string, use_uri: boolean): Promise<string[]> {
    if(use_uri) {
        console.log(`fetching remote songs from ${uri}`);
        return await getRemote(allowed_types, uri);
    } else {
        console.log(`fetching local songs from ${path}`);
        return getLocal(allowed_types, path);
    }
}
