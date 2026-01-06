import { ValidatorUtil } from "@utils/validator.util.js";
class EasyFormRule {
    static validator(vFn, value, options = {}) {
        if (!value) {
            return Promise.resolve(true);
        }
        let result = vFn(value, options);
        return result ? Promise.resolve(true) : Promise.reject();
    }
}
EasyFormRule.isEmail = (rule, value) => EasyFormRule.validator(ValidatorUtil.isEmail, value);
EasyFormRule.isIPv4 = (rule, value) => EasyFormRule.validator(ValidatorUtil.isIPV4, value);
EasyFormRule.isIPv6 = (rule, value) => EasyFormRule.validator(ValidatorUtil.isIPV6, value);
EasyFormRule.isURL = (rule, value) => EasyFormRule.validator(ValidatorUtil.isURL, value);
EasyFormRule.isIPv4Range = (rule, value) => EasyFormRule.validator(ValidatorUtil.isIPv4Range, value);
EasyFormRule.isIPv6Range = (rule, value) => EasyFormRule.validator(ValidatorUtil.isIPv6Range, value);
EasyFormRule.isIdentityCard = (rule, value) => EasyFormRule.validator(ValidatorUtil.isIdentityCard, value);
EasyFormRule.isPort = (rule, value) => EasyFormRule.validator(ValidatorUtil.isPort, value);
export { EasyFormRule };
