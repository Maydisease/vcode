const SortableHOC = window.SortableHOC;
if (!SortableHOC) {
  throw new Error("react-sortable-hoc UMD not loaded");
}
export default SortableHOC;
export const SortableContainer = SortableHOC.SortableContainer;
export const sortableContainer = SortableHOC.sortableContainer;
export const SortableElement = SortableHOC.SortableElement;
export const sortableElement = SortableHOC.sortableElement;
export const SortableHandle = SortableHOC.SortableHandle;
export const sortableHandle = SortableHOC.sortableHandle;
export const arrayMove = SortableHOC.arrayMove;