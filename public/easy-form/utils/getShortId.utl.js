import md5 from "blueimp-md5";
function getShortIdUtl(text) {
    text = md5(text);
    return text.length > 8 ? text.substring(0, 8) : text;
}
export { getShortIdUtl };
