
export default function() {
    console.log(`use one of the following to connect:`);
    
    //list all ip addresses
    const interfaces = require("os").networkInterfaces();
    
    for(let i in interfaces) {
        for(let j in interfaces[i]) {
            if(interfaces[i][j].family === "IPv6") {
                continue;
            }
            // noinspection HttpUrlsUsage
            console.log(`- http://${interfaces[i][j].address}:55392/`);
        }
    }
    
    console.log(`you can give someone your public ip address to have them connect to the server, but it requires port forwarding.`);
}
