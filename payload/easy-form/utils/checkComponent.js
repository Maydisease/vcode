import React from "react";
export const COMPONENT_TYPE = Object.freeze({
    FUNC: 1,
    CLASS: 2,
    JSX: 3,
    EMPTY: 4
});
export class CheckIsComponent {
    static isFunc(component) {
        return typeof component === 'function';
    }
    static isClass(component) {
        let result;
        try {
            result = React.isValidElement(component);
        }
        catch (err) {
            result = false;
        }
        return result;
    }
    static isJSXElement(component) {
        let result;
        try {
            result = !!component && component.$$typeof === Symbol.for('react.element');
        }
        catch (err) {
            result = false;
        }
        return result;
    }
    static check(component) {
        if (CheckIsComponent.isJSXElement(component)) {
            return COMPONENT_TYPE.JSX;
        }
        if (CheckIsComponent.isClass(component)) {
            return COMPONENT_TYPE.CLASS;
        }
        if (CheckIsComponent.isFunc(component)) {
            return COMPONENT_TYPE.FUNC;
        }
        return COMPONENT_TYPE.EMPTY;
    }
}
