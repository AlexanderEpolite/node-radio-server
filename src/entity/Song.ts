import Metadata from "./Metadata";

export default class Song {
    
    /**
     * Describes a song.
     *
     * @param name {string} The name of the song.
     * @param length {number} The length of the song in milliseconds.
     * @param uri {string} The URI of the song.
     * @param data {Buffer} The raw data of the song.
     * @param metadata {Metadata} The metadata of the song.
     */
    public constructor(
        public readonly name: string,
        public readonly length: number,
        public readonly uri: string,
        public readonly data: Buffer,
        public readonly metadata: Metadata,
    ) {}
    
}
