#!

//this is a utility file to create a songs.txt file based on the contents in the directory it is run in.

function getLocal(allowed_types, path) {
    
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

console.log(`Searching for songs in ${__dirname}...`);
const files = getLocal(["mp3", "wav", "ogg", "m4a"], __dirname + "/");
console.log(`found ${files.length} files.`);

const fs = require("fs");

if(fs.existsSync("./songs.txt")) {
    console.log(`a file named songs.txt already exists!  It will be moved to songs.txt.bak`);
    fs.renameSync("./songs.txt", "./songs.txt.bak");
}

fs.writeFileSync("./songs.txt", files.join("\n"));

console.log(`File contents written!`);

console.log(`Note: you can also automate this script if audio is regularly added using cron.`);
