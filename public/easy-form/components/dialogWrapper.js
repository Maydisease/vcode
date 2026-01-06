import { jsx as _jsx } from "react/jsx-runtime";
import React, { forwardRef } from "react";
export function dialogWrapper(Component) {
    const ForwardedComponent = (props, ref) => {
        return (_jsx(Component, { ...props, forwardedRef: ref }));
    };
    return forwardRef(ForwardedComponent);
}
