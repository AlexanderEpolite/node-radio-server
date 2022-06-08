# Node Radio Server

## Want to listen along to your music with friends but don't want to subscribe to a certain brand-name music service?

This is a simple NodeJS app that allows you to host a server people can connect to and all have the same music playing
at the same time.

## Windows Users
This HAS NOT BEEN TESTED on Windows.  It should work as long as you modify the
configuration file correctly, but if you encounter issues, please make an
issue on the GitHub repository so it can be fixed.

## DRM
Before you ask, DRM-restricted content cannot be played.  Buy your music in a non-encrypted form.

## Setup

1. Clone the repo: `git clone https://github.com/alexanderepolite/node-radio-server.git`.
2. Install dependencies: `cd node-radio-server` and `npm i`.
3. Compile: `tsc` (if you don't have this command, run `npm i -g typescript` to install it).
4. Modify the config.json file to your liking.  Make sure it points to your music directory.
5. Start the server with `node dist/index.js`, optionally host it using pm2.

## Interacting
You can use one of the following commands in the terminal:
- skip: skip the current song for all clients
- stats: statistics
- client-info: get a list of all ip addresses connected

You can also use tab to autofill.

## Using
Once the server has started, it will choose random songs to play.

It will give you a list of IP addresses you can use to connect to the server.  Usually, it will not list your public
IP address, so you will have to get that and port forward if you want other people to connect to your computer.

## Non-WS Music
How I initially designed this wasn't great.  You can use the WebSocket (default) to send the entire audio file, or use
an external HTTP(S) server to tell users where to get files.  That, however, requires some additional setup.  If you need
help with this part, email me (link in my GitHub profile), it is somewhat complicated:

First, have the music you want in subdirectories, then copy the `createRemoteResourceFile.js` in the root of this repository
to the root of the `url_base` in the config.json file.  Note: this only searches one directory from the current one.

Second, use `node createRemoteResourceFile.js` to generate a songs.txt file.  This will be read by the program for random song selections.

Third, have an HTTP server point to this directory that can serve the songs.txt file, as well as the other mp3 files.

Lastly, make sure you enable the URL method in the config file, else it will continue to use the WebSocket method.

## WS Music

If you are going to send music through the WebSocket, please note that it sends the ENTIRE file.  Please reduce
the bitrate of your music if it is lagging or starting a few seconds in.

## Questions?

Make an issue on the GitHub repository, I will try to respond quickly.
