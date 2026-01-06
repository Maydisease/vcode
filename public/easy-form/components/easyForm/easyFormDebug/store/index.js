import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
const useFormDebugStore = create(persist((set) => ({
    logs: {},
    update: (formId, eventTag, parentEventTag) => set(state => {
        if (!state.logs[formId]) {
            state.logs[formId] = [];
        }
        else {
            const logs = state.logs[formId];
            if (logs && logs.length) {
                const findItemIndex = logs.findIndex((item) => item.eventTag === eventTag);
                if (findItemIndex > -1) {
                    state.logs[formId][findItemIndex].eventCount += state.logs[formId][findItemIndex].eventCount;
                    state.logs[formId][findItemIndex].eventTime = new Date().getTime();
                }
                else {
                    state.logs[formId].push({
                        eventTime: new Date().getTime(),
                        eventTag: eventTag,
                        eventCount: 1,
                        parentEventTag: parentEventTag
                    });
                }
            }
            else {
                state.logs[formId].push({
                    eventTime: new Date().getTime(),
                    eventTag: eventTag,
                    eventCount: 1,
                    parentEventTag: parentEventTag
                });
            }
        }
        return state;
    }),
}), {
    name: "FORM_WATCH_LOGS",
    storage: createJSONStorage(() => sessionStorage)
}));
export default useFormDebugStore;
