// AdvTerm — bridge between App.tsx terminal instances and sidebar components
// Author: chengmania KC3SMW
// App.tsx writes these functions; Sidebar reads them.

export const termBridge: {
  copyLastBlock: (() => string) | null;
  copyVisible: (() => string) | null;
  pasteText: ((text: string) => void) | null;
} = {
  copyLastBlock: null,
  copyVisible: null,
  pasteText: null,
};
