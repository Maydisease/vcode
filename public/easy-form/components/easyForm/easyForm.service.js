import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { WIDGET } from "./easyFormUnit/config.js";
import { EasyForm } from "./index.js";
import lodash from 'lodash';
import EventEmitter from "eventemitter3";
import { WidgetDateRange } from "./easyFormWidget/WidgetDateRange.js";
import { WidgetDate } from "./easyFormWidget/WidgetDate.js";
import { WidgetTime } from "./easyFormWidget/WidgetTime.js";
import { WidgetTimeRange } from "@components/easyForm/easyFormWidget/WidgetTimeRange.js";
import { getRandomIdUtil } from "@utils/getRandom.util.js";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
class EasyFormService {
    /**
     * @hidden
     */
    constructor(options) {
        this.config = [];
        this.extensionWidgets = [];
        /**
         * @hidden
         */
        this.formId = "";
        /**
         * @hidden
         */
        this.easyFormRef = null;
        /**
         * @hidden
         */
        this.formValidateFailEvent = new EventEmitter();
        /**
         * 组件入口  {@link FormProps | `FormProps`}.
         *
         * @param FormProps
         * @param FormProps.config - 表单的配置项
         * @param FormProps.layout - 表单的布局
         * @returns React.Component
         */
        this.Form = ({ config, layout, formId }) => {
            this.easyFormRef = useRef(null);
            config = this.fillDefaultConfig(config);
            config = this.setSlotConfig(config);
            this.config = config;
            useEffect(() => {
                useFormDebugStore.getState().update(this.formId, "Form", "DefineConfig");
            }, []);
            return _jsx(EasyForm, { formId: formId || this.formId, layout: layout, ref: this.easyFormRef, serviceInst: this, config: config });
        };
        /**
         * @hidden
         */
        this.form = (config, layout) => {
            config = this.fillDefaultConfig(config);
            config = this.setSlotConfig(config);
            this.config = config;
            this.easyFormRef = useRef(null);
            return _jsx(EasyForm, { formId: this.formId, layout: layout, ref: this.easyFormRef, serviceInst: this, config: config });
        };
        if (!this.formId) {
            this.formId = getRandomIdUtil();
        }
        this.extensionWidgets = lodash.get(options, 'loadExtensionWidgets', []);
        useFormDebugStore.getState().update(this.formId, null, null);
    }
    setSlotConfig(config) {
        return config.map((widgetConfig) => {
            if (widgetConfig.type === "slot") {
                if (React.isValidElement(widgetConfig.component)) {
                    widgetConfig.__component = widgetConfig.component;
                }
                else if (typeof widgetConfig.component === 'function') {
                    widgetConfig.__component = widgetConfig.component(widgetConfig);
                }
            }
            else {
                if (WIDGET[widgetConfig.type]) {
                    widgetConfig.__component = WIDGET[widgetConfig.type];
                }
                const findCustomWidget = this.extensionWidgets.find((item) => item.type === widgetConfig.type);
                if (findCustomWidget) {
                    const component = lodash.get(findCustomWidget, "widget.component", undefined);
                    if (component) {
                        widgetConfig.__component = component.bind(findCustomWidget.widget);
                    }
                }
            }
            return widgetConfig;
        });
    }
    /*  example:
        要更新data, 不清理value时， $update("username", null, [1,2,3]);
        要更新data, 要清理value时， $update("username", undefined, [1,2,3]);
        不更新data, 要清理value时， $update("username", undefined);
        不更新data, 要更新value时， $update("username", newValue);
     */
    $update(name, value, data) {
        this.config.map((unitConfig) => {
            if (unitConfig.name === name) {
                if ((unitConfig.type === "text" ||
                    unitConfig.type === "select" ||
                    unitConfig.type === "checkbox" ||
                    unitConfig.type === "radio" ||
                    unitConfig.type === "treeSelect" ||
                    unitConfig.type === "cascader") && data) {
                    unitConfig.data = data;
                }
                if (value !== null) {
                    if (this.easyFormRef.current) {
                        this.easyFormRef.current.updateFieldValue(name, value);
                    }
                }
            }
            return unitConfig;
        });
        if (this.easyFormRef.current) {
            this.easyFormRef.current.updateFormConfig(this.config);
        }
    }
    $disable(names, hide = false) {
        if (typeof names === "string") {
            names = [names];
        }
        this.config.forEach((unitConfig) => {
            if (names.includes(unitConfig.name)) {
                unitConfig.disabled = true;
                hide && (unitConfig.hide = true);
            }
        });
        if (this.easyFormRef.current) {
            this.setSlotConfig(this.config);
            this.easyFormRef.current.updateFormConfig(this.config);
        }
    }
    $hide(names) {
        if (typeof names === "string") {
            names = [names];
        }
        this.config.forEach((unitConfig) => {
            if (names.includes(unitConfig.name)) {
                unitConfig.hide = true;
            }
        });
        if (this.easyFormRef.current) {
            this.easyFormRef.current.updateFormConfig(this.config);
        }
    }
    $show(names) {
        if (typeof names === "string") {
            names = [names];
        }
        this.config.forEach((unitConfig) => {
            if (names.includes(unitConfig.name)) {
                unitConfig.hide = false;
                console.log(1112992922, unitConfig.name);
            }
        });
        if (this.easyFormRef.current) {
            this.easyFormRef.current.updateFormConfig(this.config);
        }
    }
    /**
     * 将被禁止的控件状态改为启用 `inst.$enable("username")`
     *
     * @remarks
     * This method is part of the {@link core-library#Statistics | Statistics subsystem}.
     *
     * @param names - 传递控件的name，允许数组形式的多个name
     * @returns void
     *
     * @release
     */
    $enable(names) {
        if (typeof names === "string") {
            names = [names];
        }
        this.config.forEach((unitConfig) => {
            if (names.includes(unitConfig.name)) {
                unitConfig.disabled = false;
                unitConfig.hide = false;
            }
        });
        if (this.easyFormRef.current) {
            this.easyFormRef.current.updateFormConfig(this.config);
        }
    }
    $submit(options) {
        if (!options) {
            options = {};
        }
        if (!lodash.has(options, 'returnRaw')) {
            options.returnRaw = false;
        }
        if (!lodash.has(options, 'removePrivateProp')) {
            options.removePrivateProp = true;
        }
        return new Promise((resolve, reject) => {
            this.easyFormRef.current.submit().then((values) => {
                // 验证失败
                if (values === null) {
                    this.formValidateFailEvent.emit("EASY_FORM_VALIDATE_FAIL");
                    return;
                }
                resolve(this.filterValues(values, options));
            });
        });
    }
    $reset(forceCleanValue) {
        // 暂时不启用引用计数清除
        // ****************************************************************************
        // this.config = this.config.map((unitConfig) => {
        //     if ((unitConfig.__refCount || 0) > 0 && unitConfig.type === "select") {
        //         unitConfig.data = [];
        //     }
        //     return unitConfig;
        // });
        //
        // if (this.easyFormRef.current) {
        //     this.easyFormRef.current.update(this.config);
        // }
        // ****************************************************************************
        return this.easyFormRef.current.reset(forceCleanValue);
    }
    filterDisableValue(values, name, returnRaw) {
        const findUnit = this.config.find((unit) => unit.name === name);
        if ((findUnit === null || findUnit === void 0 ? void 0 : findUnit.disabled) && !returnRaw) {
            // 移除转换后的字段类型
            if (lodash.isArray(findUnit.transformResult)) {
                const [aliasA, aliasB] = findUnit.transformResult;
                lodash.has(values, aliasA) && delete values[aliasA];
                lodash.has(values, aliasB) && delete values[aliasB];
            }
            delete values[name];
        }
        return values;
    }
    filterEmptyValue(values, name, returnRaw) {
        const findUnit = this.config.find((unit) => unit.name === name);
        if (findUnit && [undefined].includes(values[name]) && !returnRaw) {
            delete values[name];
        }
        return values;
    }
    filterPrivateValues(values, removePrivateProp) {
        for (let name in values) {
            if (name.indexOf('__$') === 0 && removePrivateProp) {
                delete values[name];
            }
        }
        return values;
    }
    filterValues(values, options) {
        for (let name in values) {
            this.transformValues(values, name);
            this.filterDisableValue(values, name, options.returnRaw);
            this.filterEmptyValue(values, name, options.returnRaw);
        }
        this.filterPrivateValues(values, options.removePrivateProp);
        return values;
    }
    transformValues(values, name) {
        const findUnit = this.config.find((item) => item.name === name);
        if (findUnit) {
            findUnit.type === "dateRange" && WidgetDateRange.resultTransform(name, findUnit, values);
            findUnit.type === "date" && WidgetDate.resultTransform(name, findUnit, values);
            findUnit.type === "time" && WidgetTime.resultTransform(name, findUnit, values);
            findUnit.type === "timeRange" && WidgetTimeRange.resultTransform(name, findUnit, values);
        }
    }
    $getFormValues() {
        return this.easyFormRef.current.getFormValues();
    }
    fillRequiredRules(config) {
        var _a;
        if (!lodash.has(config, 'required')) {
            config.required = false;
        }
        if (config.required) {
            const rule = (_a = config.rules) === null || _a === void 0 ? void 0 : _a.find((rule) => rule.required);
            if (!rule) {
                const inputTypes = ['number', 'text', 'textArea'];
                const tipPrefix = inputTypes.includes(config.type) ? "请输入" : "请选择";
                !Array.isArray(config.rules) && (config.rules = []);
                config.rules.push({ required: true, message: `${tipPrefix}${config.label}` });
            }
        }
    }
    fillValue(config) {
        if (!lodash.has(config, 'value') && config.type === "switch") {
            config.value = false;
        }
    }
    fillHide(config) {
        if (!lodash.has(config, 'hide')) {
            config.hide = false;
        }
    }
    fillSlotFlag(config) {
        if (config.type === "slot") {
            config.__isSlot = true;
        }
        else {
            config.__isSlot = false;
        }
    }
    fillPlaceholder(config) {
        if (!config.placeholder) {
            const inputTypes = ['number', 'text', 'textArea', 'password'];
            const dateTypes = ['date', 'dateRange', 'time', 'cascader'];
            let baseText = "";
            if (inputTypes.includes(config.type)) {
                baseText = "请填写";
            }
            else if (!dateTypes.includes(config.type)) {
                baseText = "请选择";
            }
            config.placeholder = `${baseText}${config.label}`;
        }
    }
    fillDisabled(config) {
        if (!lodash.has(config, 'disabled')) {
            config.disabled = false;
        }
    }
    fillDefaultConfig(formConfig) {
        for (let config of formConfig) {
            this.fillRequiredRules(config);
            this.fillHide(config);
            this.fillPlaceholder(config);
            this.fillSlotFlag(config);
            this.fillValue(config);
            this.fillDisabled(config);
        }
        return formConfig;
    }
    // 暂时遗弃，暂未实现
    // transformMapToArray(formConfigMap: FormConfigMap): FormConfig {
    //     const config: FormConfig = [];
    //     for (let name in formConfigMap) {
    //         const mapPayload = formConfigMap[name] as any;
    //         config.push({
    //             ...mapPayload,
    //             name
    //         });
    //     }
    //     return config;
    // }
    defineLayoutConfig(options) {
        return options;
    }
    defineConfig(config) {
        useFormDebugStore.getState().update(this.formId, "DefineConfig", null);
        return config;
    }
    /**
     * @hidden
     */
    getConfig() {
        return this.config;
    }
    /**
     * @getConfigByName
     */
    getConfigByName(name) {
        const findConfig = this.config.find((config) => {
            if (config.name === name) {
                return config;
            }
        });
        return findConfig || null;
    }
}
/**
 * @internal
 */
EasyFormService.cacheStore = {};
/**
 * @hidden
 */
EasyFormService.getCache = (formId, fieldName) => {
    return lodash.get(EasyFormService, `cacheStore[${formId}][__$${fieldName}_async_data]`, undefined);
};
/**
 * @hidden
 */
EasyFormService.updateCache = (formId, fieldName, data) => {
    if (!EasyFormService.cacheStore[formId]) {
        EasyFormService.cacheStore[formId] = {};
    }
    EasyFormService.cacheStore[formId][`__$${fieldName}_async_data`] = data;
};
export { EasyFormService };
