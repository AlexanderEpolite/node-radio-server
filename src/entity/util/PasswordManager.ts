
import {createHash} from "crypto";

export default class PasswordManager {
    
    public constructor(
        private readonly username: string,
        private readonly password_hash: string,
    ) {
        if(password_hash.length !== 128) {
            throw new Error("password hash is not 128 characters long, please format it in base16 and ensure it is sha512");
        }
    }
    
    public async compare(username: string, password: string): Promise<boolean> {
        
        //arrow because encapsulation or something, normal ts stuff
        const isCorrect = async () => {
            if(username !== this.username) {
                return false;
            }
            
            const hash = createHash("sha512");
            hash.update(password);
            const hash_str = hash.digest("hex");
            
            return hash_str === this.password_hash;
        }
        
        //prevent timing attacks
        return new Promise((resolve) => {
            let r: boolean;
            
            isCorrect().then((result) => {
                r = result;
            });
            
            setTimeout(() => {
                resolve(r);
            }, 1500);
        });
    }
    
}
