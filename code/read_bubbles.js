// SPDX-License-Identifier: Apache-2.0
// note (luojiaxuan): prints {window title: [[text, height], ...] | null} for the chat bubbles currently loaded in each named WeChat window; null means the window cannot be read right now.
function run(argv) {
  const proc = Application("System Events").processes.byName("WeChat");
  const out = {};
  for (const title of argv) {
    out[title] = readWindow(proc, title);
  }
  return JSON.stringify(out);
}

// note (luojiaxuan): error numbers that mean the window cannot be read right now: -1728 a minimized window viewed from another Space is listed but its contents are not reachable; -1719 right after wake from sleep WeChat rebuilds its windows for a minute or more without their split view; -1712 WeChat is busy and does not answer for minutes. relay.py treats an unreadable window like a missing one.
const UNREADABLE = new Set([-1728, -1719, -1712]);

function readWindow(proc, title) {
  let ids, texts, sizes;
  try {
    const wins = proc.windows.whose({ name: title })();
    if (wins.length === 0) {
      return null;
    }
    const cells = wins[0].splitterGroups[0].lists[0].uiElements;
    ids = cells.attributes.byName("AXIdentifier").value();
    texts = cells.attributes.byName("AXTitle").value();
    sizes = cells.size();
  } catch (e) {
    if (UNREADABLE.has(e.errorNumber)) {
      return null;
    }
    throw e;
  }
  return ids
    .map((id, i) => [id, texts[i] || "", sizes[i][1]])
    .filter((c) => c[0] === "chat_bubble_item_view")
    .map((c) => [c[1], c[2]]);
}
