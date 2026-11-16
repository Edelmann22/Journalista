/**
 * Mode · room chat
 * ================
 *
 * A small chat for everyone in a room: in the lobby and on the scoreboard
 * between rounds. During a round the latest message shows for a few seconds
 * under the live bars, so nobody has to stop answering to read it.
 *
 * Works the same in friend rooms and quick matches. In a quick match the
 * opponent reads the chat and may answer, or may not (see js/modes/bot.js).
 *
 * Messages (field t):
 *   chat  { text }  a line of chat, at most CHAT_LEN characters
 *   ctyp            "is typing…" in the chat box, sent at most every 1.5 s
 */

/** Most messages kept per room. */
const CHAT_MAX = 40;

/** Longest message allowed. */
const CHAT_LEN = 80;

/** How long "is typing…" stays without a fresh signal. */
const CHAT_TYPING_MS = 3000;

/** How long a message stays visible under the live bars during a round. */
const CHAT_PEEK_MS = 8000;

/** The two chat boxes: R in the room lobby, B on the scoreboard. */
const CHAT_BOXES = ["R", "B"];

/** When this tab last sent a chat typing signal. */
let lastChatTyp = 0;

/** Timer that clears the in-round message preview. */
let chatPeekTimer = 0;

/**
 * Add a message to the room's chat and redraw it.
 *
 * @param {string} from  sender id
 * @param {string} text
 */
function chatAdd(from, text) {
  if (!mp) return;
  text = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CHAT_LEN);
  if (!text) return;
  const me = from === myId;
  mp.chat = mp.chat || [];
  mp.chat.push({ from, name: me ? "You" : nameOf(from), look: lookOf(from), text });
  if (mp.chat.length > CHAT_MAX) mp.chat.shift();
  if (mp.chatTyping) delete mp.chatTyping[from];
  renderChat();
  if (!me && view === "mp") {
    $("mpChat").textContent = nameOf(from) + ": " + text;
    $("mpChat").hidden = false;
    replay($("mpChat"), "say-in");
    clearTimeout(chatPeekTimer);
    chatPeekTimer = setTimeout(() => ($("mpChat").hidden = true), CHAT_PEEK_MS);
  }
}

/** Redraw both chat boxes and the "is typing…" line. */
function renderChat() {
  const list = (mp && mp.chat) || [];
  const typing = mp
    ? Object.entries(mp.chatTyping || {})
        .filter(([, until]) => until > Date.now())
        .map(([id]) => nameOf(id))
    : [];
  CHAT_BOXES.forEach((k) => {
    const log = $("chatLog" + k);
    log.innerHTML = "";
    if (!list.length) log.appendChild(el("p", "small chat-empty", "No messages yet. Say hello."));
    list.forEach((c) => {
      const row = el("div", "chat-line" + (c.from === myId ? " me" : ""));
      row.append(
        avatar(c.look, "idle", "av-xs"),
        el("b", null, c.name + ":"),
        el("span", null, c.text),
      );
      log.appendChild(row);
    });
    log.scrollTop = log.scrollHeight;
    $("chatTyp" + k).textContent = typing.length
      ? typing.join(", ") + (typing.length > 1 ? " are" : " is") + " typing…"
      : "";
  });
}

/** Send what is in one of the chat inputs. */
function chatSend(k) {
  const inp = $("chatIn" + k),
    text = inp.value.trim().slice(0, CHAT_LEN);
  if (!mp || !text) return;
  send({ t: "chat", text });
  chatAdd(myId, text);
  inp.value = "";
}

CHAT_BOXES.forEach((k) => {
  wire("chatForm" + k, "chatIn" + k, () => chatSend(k));
  $("chatIn" + k).addEventListener("input", () => {
    const now = Date.now();
    if (!mp || now - lastChatTyp < 1500) return;
    lastChatTyp = now;
    send({ t: "ctyp" });
  });
});

/**
 * Handle chat messages from the room. Returns true if the message was a chat message.
 *
 * @param {object} m
 */
function chatOnMessage(m) {
  if (m.t === "chat") {
    chatAdd(m.from, m.text);
    return true;
  }
  if (m.t === "ctyp") {
    mp.chatTyping = mp.chatTyping || {};
    mp.chatTyping[m.from] = Date.now() + CHAT_TYPING_MS;
    renderChat();
    setTimeout(renderChat, CHAT_TYPING_MS + 100);
    return true;
  }
  return false;
}
