import { v4 } from "uuid";
import md5 from "blueimp-md5";
function getRandomIdUtil(len = 8) {
    const uuid = v4().toString();
    let longHash = md5(uuid);
    return longHash.length > len ? longHash.substring(0, len) : longHash;
}
export { getRandomIdUtil };
