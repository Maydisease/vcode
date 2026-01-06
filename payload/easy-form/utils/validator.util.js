import isEmail from 'validator/lib/isEmail';
import isIP from 'validator/lib/isIP';
import isIPRange from 'validator/lib/isIPRange';
import isURL from 'validator/lib/isURL';
import isPort from 'validator/lib/isPort';
import isIdentityCard from 'validator/lib/isIdentityCard';
class ValidatorUtil {
    static isEmail(value, options = {}) {
        return isEmail(value, options);
    }
    static isIPV4(value) {
        return isIP(value, 4);
    }
    static isIPV6(value) {
        return isIP(value, 6);
    }
    static isIPv4Range(value) {
        return isIPRange(value, 4);
    }
    static isIPv6Range(value) {
        return isIPRange(value, 6);
    }
    static isURL(value, options = {}) {
        return isURL(value, options);
    }
    static isPort(value) {
        return isPort(`${value}`);
    }
    static isIdentityCard(value, locale) {
        return isIdentityCard(`${value}`, locale);
    }
}
export { ValidatorUtil };
