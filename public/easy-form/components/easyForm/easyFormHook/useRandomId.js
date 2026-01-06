import { useMemo } from "react";
import { getRandomIdUtil } from "@utils/getRandom.util.js";
const useRandomId = () => {
    const formId = useMemo(() => {
        return getRandomIdUtil();
    }, []);
    return {
        formId
    };
};
export { useRandomId };
