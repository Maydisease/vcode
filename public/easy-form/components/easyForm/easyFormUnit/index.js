import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo } from "react";
import { Form, Tooltip, } from "antd";

import { CheckIsComponent, COMPONENT_TYPE } from "@utils/checkComponent.js";
import lodash from "lodash";
import classNames from "classnames";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
import { InfoCircleFilled } from '@ant-design/icons';
const EasyFormUnit = ({ serviceInst, formId, config, span, form, maxLabelWidth, layout }) => {
    useEffect(() => {
        useFormDebugStore.getState().update(formId, `EasyFormUnit:${config.name}`, "InitLayout");
    }, []);
    const Widget = config.__component;
    let labelVertical = lodash.get(layout, 'labelVertical', false);
    const getStyles = () => {
        let widthStyle = {};
        if (!labelVertical && maxLabelWidth && maxLabelWidth > -1) {
            widthStyle.width = config.label ? `${maxLabelWidth + 10}px` : 0;
        }
        return {
            ...widthStyle
        };
    };
    useEffect(() => {
        form.setFields([{ name: config.name, errors: undefined }]);
    }, [config.disabled]);
    const getRequireState = (name) => {
        var _a;
        let isRequired = false;
        if (config.required) {
            isRequired = true;
        }
        (_a = config.rules) === null || _a === void 0 ? void 0 : _a.some((rule) => {
            const required = rule.required;
            if (required) {
                isRequired = true;
                return true;
            }
            else {
                return false;
            }
        });
        if (config.disabled) {
            isRequired = false;
        }
        return isRequired;
    };
    const getSlotComponent = () => {
        if (Widget && config.__isSlot && config.type === 'slot') {
            if (React.isValidElement(Widget)) {
                return Widget;
            }
        }
        return void 0;
    };
    const labelDesc = () => {
        if (config.labelDesc && labelVertical) {
            const render = (tpl) => {
                return _jsx("span", { className: 'label-desc', role: `widget-name-${config.name}-labelDesc`, children: tpl });
            };
            // 字符类型 [isMini、content]
            if (typeof config.labelDesc === "string") {
                return render(config.labelDesc);
            }
            // 对象类型 [isMini、content]
            else if (typeof config.labelDesc === "object") {
                const content = config.labelDesc.content;
                if (config.labelDesc.isMini && content) {
                    return render(_jsx(Tooltip, { title: content, children: _jsx(InfoCircleFilled, { style: { color: '#0B7FFF' } }) }));
                }
                else {
                    return render(content);
                }
            }
            else {
                return _jsx(_Fragment, {});
            }
        }
    };
    let labelAction = config.labelAction && labelVertical ? (_jsx("span", { className: 'label-action', role: `widget-name-${config.name}-labelAction`, children: config.labelAction })) : void 0;
    let labelSpacer = labelVertical ? _jsx("span", { className: 'spacer' }) : void 0;
    let tooltip = () => {
        let content = lodash.get(config, 'tooltip', null);
        if (CheckIsComponent.check(config.tooltip) === COMPONENT_TYPE.JSX) {
            content = config.tooltip;
        }
        else if (typeof config.tooltip === 'object') {
            console.log('is object');
            const isMini = lodash.get(config.tooltip, 'isMini', false);
            if (!isMini) {
                content = lodash.get(config.tooltip, 'content', '');
            }
            else {
                content = _jsx(_Fragment, { children: "asdasd" });
            }
        }
        else {
            content = config.tooltip;
        }
        return content;
    };
    const FormWidgetWrap = useMemo(() => (props) => {
        return (_jsxs("div", { style: { display: 'flex' }, className: 'control-group', children: [props.config.prefix ? (_jsx("div", { role: `widget-name-${config.name}-prefix`, className: 'prefix', children: props.config.prefix })) : void 0, _jsx("div", { role: `widget-name-${props.config.name}`, className: classNames('control-main', {
                        'width-full': !["switch", "checkbox", "radio"].includes(props.config.type)
                    }), children: Widget ? Widget(props) : void 0 }), props.config.suffix ? (_jsx("div", { role: `widget-name-${config.name}-suffix`, className: 'suffix', children: props.config.suffix })) : void 0] }));
    }, []);
    const formItemStyles = () => {
        let gridItemStyle = lodash.get(layout, 'matrixMode', undefined) === "grid" ? {
            "gridColumn": "span " + span,
            "display": config.hide ? "none" : ""
        } : {};
        return {
            ...gridItemStyle
        };
    };
    const styleClassNames = {
        formItem: lodash.get(config, 'classNames.formItem', undefined),
    };
    return (_jsxs("div", { className: classNames("easy-form-item", {
            "label-vertical": labelVertical,
        }, styleClassNames.formItem), style: formItemStyles(), children: [(Widget && !config.__isSlot) ?
                _jsx(Form.Item, { colon: false, extra: tooltip(), label: _jsxs("div", { className: classNames("easy-form-item-label", {
                            required: getRequireState(config.name),
                            'label-vertical': labelVertical
                        }), style: getStyles(), children: [_jsx("span", { role: `widget-name-${config.name}-label`, className: 'label-text', children: config.label }), labelDesc(), labelSpacer, labelAction] }), name: config.name, rules: config.disabled ? [] : config.rules, children: _jsx(FormWidgetWrap, { serviceInst: serviceInst, formId: formId, config: config, form: form }) }) : void 0, getSlotComponent()] }));
};
export { EasyFormUnit };
