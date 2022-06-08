
import {homedir} from "os";

const config = require("../../../config.json");

let dir = config.music.local.path;

dir = dir.replace("~", homedir() + "/");

if(!dir.endsWith("/")) {
    dir += "/";
}

export default function(): string {
    return dir;
}
