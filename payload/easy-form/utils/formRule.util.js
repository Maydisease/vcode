class FormRuleUtil {
    static maxLengthRule(maxLen, returnObj = false) {
        let regx = new RegExp(`^.{0,${maxLen}}$`);
        let rule = {
            pattern: regx,
            message: `最大支持${maxLen}个字符`
        };
        if (returnObj) {
            return rule;
        }
        return [
            rule
        ];
    }
}
export { FormRuleUtil };
