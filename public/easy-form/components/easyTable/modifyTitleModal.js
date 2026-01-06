import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { dialogWrapper } from "@components/easyDialog/dialogWrapper.js";
import { EasyFormService } from "@components/easyForm/easyForm.service.js";
import { useImperativeHandle, useMemo } from "react";
import lodash from "lodash";
import { scopeService } from './scope.service.js';
import { message } from "antd";
import { FormRuleUtil } from "@utils/formRule.util.js";
export default dialogWrapper((props) => {
    const title = lodash.get(props, 'data.record.title', undefined);
    const easyFormInst = useMemo(() => new EasyFormService(), []);
    const formConfig = easyFormInst.defineConfig([{
            label: "标题",
            name: "tableTitle",
            type: "text",
            required: true,
            value: title,
            rules: FormRuleUtil.maxLengthRule(8),
        }]);
    const layoutConfig = useMemo(() => easyFormInst.defineLayoutConfig({
        matrix: [
            ["tableTitle"]
        ]
    }), []);
    const onSubmit = () => {
        return new Promise((resolve, reject) => {
            easyFormInst.$submit().then(async (values) => {
                if (values && values.tableTitle) {
                    if (values.tableTitle === title) {
                        message.warning('未做任何修改');
                        resolve(title);
                    }
                    const tableTitle = values.tableTitle;
                    const activeScopeService = lodash.get(props, 'data.scopeService', lodash.get(props, 'scopeService', scopeService));
                    const modifyTitle = lodash.get(props, 'data.modifyTitle', undefined) ||
                        lodash.get(activeScopeService, 'modifyTitle', undefined);
                    if (typeof modifyTitle !== 'function') {
                        message.warning('未配置修改标题接口');
                        resolve(title);
                        return;
                    }
                    props.$trigger.triggerLoading("open");
                    const result = await modifyTitle.call(activeScopeService, tableTitle);
                    if (result) {
                        resolve(tableTitle);
                    }
                    props.$trigger.triggerLoading("close");
                }
            });
        });
    };
    useImperativeHandle(props.forwardedRef, () => ({
        onConfirm: () => {
            return new Promise(async (resolve, reject) => {
                const title = await onSubmit();
                resolve(title);
            });
        },
        onCancel: () => {
            return new Promise((resolve, reject) => {
                resolve("onCancel");
            });
        },
    }));
    return _jsx(_Fragment, { children: easyFormInst.form(formConfig, layoutConfig) });
});
