import React from 'react';
const { useSyncExternalStore, useRef } = React;
const useSyncExternalStoreWithSelector = (subscribe, getSnapshot, getServerSnapshot, selector, isEqual) => {
  const select = selector || ((value) => value);
  const getSelected = () => select(getSnapshot());
  const getServerSelected = getServerSnapshot ? () => select(getServerSnapshot()) : undefined;
  const selected = useSyncExternalStore(subscribe, getSelected, getServerSelected);
  const prevRef = useRef(selected);
  if (isEqual && prevRef.current !== undefined && isEqual(prevRef.current, selected)) {
    return prevRef.current;
  }
  prevRef.current = selected;
  return selected;
};
export { useSyncExternalStoreWithSelector };
export default { useSyncExternalStoreWithSelector };