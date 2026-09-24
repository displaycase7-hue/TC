/* TChat Enhancements — GitHub Pages only
 *
 * Drop this script near the end of index.html, immediately before </body>.
 * It intentionally reuses the existing TChat globals:
 *   chat, myId, nameBox, onlineUsers
 *   groupActive, groupLocalStream, groupPeers, openGroupCall, ensureGroupPeer
 *   showDesktopNotification, showNotification
 *
 * No backend, database, worker, or external service is required.
 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const q = (sel, root = document) => root.querySelector(sel);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
  }

  function toast(title, text, kind = "info") {
    try {
      if (typeof showNotification === "function") {
        showNotification(title, text, kind);
        return;
      }
    } catch {}
    const stack = $("notificationStack");
    if (!stack) return;
    const item = document.createElement("div");
    item.className = "notificationToast";
    item.innerHTML = `<strong>${escapeHtml(title)}</strong><div>${escapeHtml(text)}</div>`;
    stack.appendChild(item);
    setTimeout(() => item.remove(), 4500);
  }

  function sendRoom(packet) {
    try {
      if (typeof chat?.send === "function") chat.send(packet);
      return true;
    } catch (error) {
      console.warn("TChat enhancement send failed:", error);
      toast("Connection problem", "That action could not be sent.", "warning");
      return false;
    }
  }

  /* ============================================================
     ALEX SMART ACTIONS
     Uses the existing local-AI UI/model so it is not duplicated.
  ============================================================ */
  function initAlexEnhancements() {
    const requestBox = $("localAIRequest");
    const hint = q("#localAIBox .localAIHint");
    const generate = $("localAIGenerate");
    const aiBox = $("localAIBox");
    if (!requestBox || !generate || !aiBox || !hint) return;

    if ($("alexQuickActions")) return;

    const wrap = document.createElement("div");
    wrap.id = "alexQuickActions";
    wrap.innerHTML = `
      <div class="alexQuickTitle">⚡ Smart actions</div>
      <div class="alexQuickRow">
        <button type="button" data-alex-action="reply">↩ Reply to latest</button>
        <button type="button" data-alex-action="friendly">😊 Friendlier</button>
        <button type="button" data-alex-action="shorter">✂️ Shorter</button>
        <button type="button" data-alex-action="clearer">✨ Clearer</button>
        <button type="button" data-alex-action="grammar">🧹 Fix grammar</button>
        <button type="button" data-alex-action="selection">🖱️ Use selected text</button>
      </div>
      <div id="alexQuickHint">These buttons prepare a request for the existing local Alex model.</div>
    `;
    hint.insertAdjacentElement("afterend", wrap);

    function latestMessage() {
      const nodes = [...document.querySelectorAll("#chat .message")];
      const node = nodes.at(-1);
      if (!node) return null;
      const name = q(".name", node)?.textContent?.trim() || "the person";
      const text = q(".text", node)?.textContent?.trim()
        || node.textContent?.trim() || "";
      return { name, text: text.slice(0, 2500) };
    }

    function setAlexPrompt(prompt) {
      requestBox.value = prompt;
      requestBox.focus();
      generate.click();
    }

    wrap.addEventListener("click", (event) => {
      const button = event.target.closest("[data-alex-action]");
      if (!button) return;
      const action = button.dataset.alexAction;

      if (action === "reply") {
        const latest = latestMessage();
        if (!latest) {
          toast("Alex", "There isn't a message to reply to yet.", "warning");
          return;
        }
        setAlexPrompt(
          `Write a natural reply to ${latest.name}'s latest message. ` +
          `Reply directly to what they said and do not invent facts.\n\n` +
          `Latest message from ${latest.name}:\n${latest.text}`
        );
        return;
      }

      if (action === "friendly") {
        const source = requestBox.value.trim();
        setAlexPrompt(
          source
            ? `Rewrite this as a warm, friendly chat message while keeping the exact meaning:\n${source}`
            : "Write a warm, friendly version of the message I am trying to send."
        );
        return;
      }

      if (action === "shorter") {
        const source = requestBox.value.trim();
        setAlexPrompt(
          source
            ? `Rewrite this as a shorter chat message without losing the important meaning:\n${source}`
            : "Write a concise version of the message I am trying to send."
        );
        return;
      }

      if (action === "clearer") {
        const source = requestBox.value.trim();
        setAlexPrompt(
          source
            ? `Rewrite this so it is clearer and easier to understand, while keeping the same meaning:\n${source}`
            : "Rewrite my intended message so it is clear and easy to understand."
        );
        return;
      }

      if (action === "grammar") {
        const source = requestBox.value.trim();
        setAlexPrompt(
          source
            ? `Correct the grammar and spelling in this chat message while keeping its meaning and natural tone:\n${source}`
            : "Fix the grammar and spelling of the message I am trying to send."
        );
        return;
      }

      if (action === "selection") {
        const selected = String(window.getSelection?.() || "").trim();
        if (!selected) {
          toast("Alex", "Select some text on the page first.", "warning");
          return;
        }
        setAlexPrompt(
          `Rewrite the following selected text as a natural chat message while preserving its meaning:\n${selected.slice(0, 3000)}`
        );
      }
    });
  }

  /* ============================================================
     LOCAL TOOLBOX
     Calculator + stopwatch + countdown + random picker.
  ============================================================ */
  function initEnhancedToolbox() {
    const toolbox = $("toolboxPanel");
    if (!toolbox || $("enhancedLocalTools")) return;

    const card = document.createElement("div");
    card.id = "enhancedLocalTools";
    card.className = "toolboxCard toolboxWide";
    card.innerHTML = `
      <h4>🧰 Enhanced local utilities</h4>
      <p>These run entirely in this browser and do not require a server.</p>

      <div class="etoolGrid">
        <div class="etoolMini">
          <div class="etoolLabel">🧮 Calculator</div>
          <div class="etoolCalcRow">
            <input id="etoolCalcInput" inputmode="decimal" placeholder="12 * (4 + 3)">
            <button id="etoolCalcGo" type="button">=</button>
          </div>
          <div id="etoolCalcResult" class="etoolResult">Ready</div>
        </div>

        <div class="etoolMini">
          <div class="etoolLabel">⏱ Stopwatch</div>
          <div id="etoolStopwatch" class="etoolBig">00:00.0</div>
          <div class="etoolBtns">
            <button id="etoolStopStart" type="button">Start</button>
            <button id="etoolStopReset" type="button" class="secondary">Reset</button>
          </div>
        </div>

        <div class="etoolMini">
          <div class="etoolLabel">⏳ Countdown</div>
          <div class="etoolCountRow">
            <input id="etoolMin" type="number" min="0" max="999" value="1" aria-label="Minutes">
            <span>:</span>
            <input id="etoolSec" type="number" min="0" max="59" value="00" aria-label="Seconds">
          </div>
          <div id="etoolCountdown" class="etoolBig">01:00</div>
          <div class="etoolBtns">
            <button id="etoolCountStart" type="button">Start</button>
            <button id="etoolCountReset" type="button" class="secondary">Reset</button>
          </div>
        </div>

        <div class="etoolMini">
          <div class="etoolLabel">🎯 Random picker</div>
          <input id="etoolPickerInput" placeholder="Alice, Bob, Charlie">
          <button id="etoolPickerGo" type="button">Pick one</button>
          <div id="etoolPickerResult" class="etoolResult">Enter choices separated by commas.</div>
        </div>
      </div>
    `;
    toolbox.appendChild(card);

    /* Safe arithmetic parser: numbers, + - * / %, parentheses, decimals. */
    function calculateExpression(raw) {
      const expr = String(raw).replace(/\s+/g, "");
      if (!expr || !/^[0-9.+\-*/%()]+$/.test(expr)) {
        throw new Error("Use only numbers, parentheses, and + − × ÷ %.");
      }

      const tokens = [];
      let i = 0;
      while (i < expr.length) {
        const c = expr[i];
        if (/[0-9.]/.test(c)) {
          let j = i + 1;
          while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
          const number = Number(expr.slice(i, j));
          if (!Number.isFinite(number)) throw new Error("Invalid number.");
          tokens.push(number);
          i = j;
          continue;
        }
        if ("+-*/%()".includes(c)) {
          tokens.push(c);
          i++;
          continue;
        }
        throw new Error("Invalid expression.");
      }

      const output = [];
      const ops = [];
      const precedence = { "+":1, "-":1, "*":2, "/":2, "%":2 };
      let expectValue = true;

      for (const token of tokens) {
        if (typeof token === "number") {
          output.push(token);
          expectValue = false;
          continue;
        }
        if (token === "(") {
          ops.push(token);
          expectValue = true;
          continue;
        }
        if (token === ")") {
          let found = false;
          while (ops.length) {
            const op = ops.pop();
            if (op === "(") { found = true; break; }
            output.push(op);
          }
          if (!found) throw new Error("Unmatched parenthesis.");
          expectValue = false;
          continue;
        }

        /* Treat unary +/− as 0 ± value for simple expressions. */
        if (expectValue && (token === "+" || token === "-")) output.push(0);
        else if (expectValue) throw new Error("Operator in the wrong place.");

        while (
          ops.length &&
          ops.at(-1) !== "(" &&
          precedence[ops.at(-1)] >= precedence[token]
        ) {
          output.push(ops.pop());
        }
        ops.push(token);
        expectValue = true;
      }

      if (expectValue && output.length) throw new Error("Expression ends with an operator.");
      while (ops.length) {
        const op = ops.pop();
        if (op === "(") throw new Error("Unmatched parenthesis.");
        output.push(op);
      }

      const stack = [];
      for (const token of output) {
        if (typeof token === "number") stack.push(token);
        else {
          const b = stack.pop();
          const a = stack.pop();
          if (a === undefined || b === undefined) throw new Error("Invalid expression.");
          let result;
          if (token === "+") result = a + b;
          if (token === "-") result = a - b;
          if (token === "*") result = a * b;
          if (token === "/") {
            if (b === 0) throw new Error("Cannot divide by zero.");
            result = a / b;
          }
          if (token === "%") {
            if (b === 0) throw new Error("Cannot divide by zero.");
            result = a % b;
          }
          if (!Number.isFinite(result)) throw new Error("Result is too large.");
          stack.push(result);
        }
      }
      if (stack.length !== 1) throw new Error("Invalid expression.");
      return stack[0];
    }

    $("etoolCalcGo").onclick = () => {
      const out = $("etoolCalcResult");
      try {
        const value = calculateExpression($("etoolCalcInput").value);
        out.textContent = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
      } catch (e) {
        out.textContent = e.message;
      }
    };
    $("etoolCalcInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("etoolCalcGo").click();
    });

    let swRunning = false;
    let swStarted = 0;
    let swElapsed = 0;
    let swTimer = null;
    function swText(ms) {
      const seconds = Math.floor(ms / 1000);
      const tenths = Math.floor((ms % 1000) / 100);
      const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
      const ss = String(seconds % 60).padStart(2, "0");
      return `${mm}:${ss}.${tenths}`;
    }
    function renderSW() {
      $("etoolStopwatch").textContent = swText(swElapsed + (swRunning ? performance.now() - swStarted : 0));
    }
    $("etoolStopStart").onclick = () => {
      if (!swRunning) {
        swRunning = true;
        swStarted = performance.now();
        $("etoolStopStart").textContent = "Pause";
        swTimer = setInterval(renderSW, 100);
      } else {
        swElapsed += performance.now() - swStarted;
        swRunning = false;
        clearInterval(swTimer);
        $("etoolStopStart").textContent = "Start";
        renderSW();
      }
    };
    $("etoolStopReset").onclick = () => {
      swRunning = false;
      clearInterval(swTimer);
      swElapsed = 0;
      $("etoolStopStart").textContent = "Start";
      renderSW();
    };

    let countRunning = false;
    let countRemaining = 60000;
    let countTimer = null;
    function readCountInputs() {
      const m = Math.max(0, Math.min(999, Number($("etoolMin").value) || 0));
      const s = Math.max(0, Math.min(59, Number($("etoolSec").value) || 0));
      return Math.round((m * 60 + s) * 1000);
    }
    function countText(ms) {
      const total = Math.max(0, Math.ceil(ms / 1000));
      return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    }
    function renderCount() {
      $("etoolCountdown").textContent = countText(countRemaining);
    }
    $("etoolCountStart").onclick = () => {
      if (!countRunning) {
        if (countRemaining <= 0) countRemaining = readCountInputs();
        countRunning = true;
        $("etoolCountStart").textContent = "Pause";
        let last = performance.now();
        countTimer = setInterval(() => {
          const now = performance.now();
          countRemaining -= now - last;
          last = now;
          if (countRemaining <= 0) {
            countRemaining = 0;
            countRunning = false;
            clearInterval(countTimer);
            $("etoolCountStart").textContent = "Start";
            toast("Countdown", "Time's up!", "success");
            try { navigator.vibrate?.([120, 80, 120]); } catch {}
          }
          renderCount();
        }, 100);
      } else {
        countRunning = false;
        clearInterval(countTimer);
        $("etoolCountStart").textContent = "Start";
      }
    };
    $("etoolCountReset").onclick = () => {
      countRunning = false;
      clearInterval(countTimer);
      countRemaining = readCountInputs();
      $("etoolCountStart").textContent = "Start";
      renderCount();
    };
    $("etoolMin").addEventListener("change", () => {
      if (!countRunning) {
        countRemaining = readCountInputs();
        renderCount();
      }
    });
    $("etoolSec").addEventListener("change", () => {
      if (!countRunning) {
        countRemaining = readCountInputs();
        renderCount();
      }
    });
    renderCount();

    $("etoolPickerGo").onclick = () => {
      const values = $("etoolPickerInput").value
        .split(",")
        .map(v => v.trim())
        .filter(Boolean);
      $("etoolPickerResult").textContent = values.length
        ? `🎉 ${values[Math.floor(Math.random() * values.length)]}`
        : "Enter choices separated by commas.";
    };
  }


  /* ============================================================
     FIXED GROUP CALL INVITES + CALL CHAT
  ============================================================ */
  const pendingGroupInvites = new Map();
  let activeGroupInvite = null;

  function roomSend(packet) {
    try {
      if (typeof chat?.send !== "function") throw new Error("Chat connection is not ready.");
      chat.send(packet);
      return true;
    } catch (error) {
      console.error("TChat room send failed:", error);
      toast("Connection problem", "That action could not be sent.", "warning");
      return false;
    }
  }

  function addGroupCallChatLine(name, text, mine=false) {
    const box = $("groupCallChatMessages");
    if (!box) return;
    const item = document.createElement("div");
    item.className = "groupCallChatMessage" + (mine ? " mine" : "");
    const n = document.createElement("div");
    n.className = "groupCallChatName";
    n.textContent = name || "Guest";
    const t = document.createElement("div");
    t.className = "groupCallChatText";
    t.textContent = text || "";
    item.append(n,t);
    box.appendChild(item);
    box.scrollTop = box.scrollHeight;
  }

  function setGroupChatOpen(open) {
    const panel = $("groupCallChatPanel");
    const button = $("groupCallChatToggle");
    if (!panel) return;
    panel.classList.toggle("open", open);
    if (button) button.textContent = open ? "💬 Close chat" : "💬 Call chat";
  }

  function initGroupCallChat() {
    if ($("groupCallChatToggle")) return;
    const controls = $("groupCallControls");
    const hangup = $("groupHangup");
    if (!controls || !hangup) return;

    const toggle = document.createElement("button");
    toggle.id = "groupCallChatToggle";
    toggle.type = "button";
    toggle.textContent = "💬 Call chat";
    toggle.onclick = () => setGroupChatOpen(!$("groupCallChatPanel")?.classList.contains("open"));
    controls.insertBefore(toggle, hangup);

    $("groupCallChatClose").onclick = () => setGroupChatOpen(false);
    $("groupCallChatForm").addEventListener("submit", e => {
      e.preventDefault();
      const input = $("groupCallChatInput");
      const text = input.value.trim();
      if (!text || !groupActive || !groupCallSessionId) return;
      const fromName = (nameBox?.value || "").trim() || "Guest";
      if (!roomSend({type:"groupCallChat",callId:groupCallSessionId,fromId:myId,fromName,text})) return;
      addGroupCallChatLine(fromName,text,true);
      input.value = "";
      input.focus();
    });
    $("groupCallChatInput").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        $("groupCallChatForm").requestSubmit();
      }
    });
  }

  function installGroupInviteDialog() {
    if ($("groupInviteDialog")) return;
    const modal = document.createElement("div");
    modal.id = "groupInviteDialog";
    modal.innerHTML = `
      <div id="groupInviteBox" role="dialog" aria-modal="true" aria-labelledby="groupInviteTitle">
        <div class="groupInviteIcon">📞</div>
        <h2 id="groupInviteTitle">Incoming group video call</h2>
        <p id="groupInviteText">Someone is inviting you to join a group video call.</p>
        <div id="groupInviteRoom"></div>
        <div id="groupInviteButtons">
          <button id="groupInviteAccept" type="button">✅ Accept</button>
          <button id="groupInviteDecline" type="button">☎ Hang Up</button>
        </div>
        <div class="groupInviteHint">Accepting will open your camera and microphone and join the existing call.</div>
      </div>`;
    document.body.appendChild(modal);
    $("groupInviteAccept").onclick = acceptGroupInvite;
    $("groupInviteDecline").onclick = () => finishGroupInvite("declined");
    modal.addEventListener("click", e => { if (e.target === modal) finishGroupInvite("declined"); });
  }

  function showGroupInvite(message) {
    activeGroupInvite = message;
    const modal = $("groupInviteDialog");
    $("groupInviteText").textContent = `${message.fromName || "Someone"} is inviting you to join their group video call.`;
    $("groupInviteRoom").textContent = message.room ? `Room: ${message.room}` : "";
    modal.style.display = "flex";

    try { startCallRinger(); } catch {}
    try { notifyUser("📞 Incoming group video call", `${message.fromName || "Someone"} wants you to join a group call.`, "call", true); } catch {}

    document.title = "📞 Incoming group call • TChat";
    window.clearTimeout(showGroupInvite.expiryTimer);
    showGroupInvite.expiryTimer = window.setTimeout(() => {
      if (activeGroupInvite?.inviteId === message.inviteId) {
        finishGroupInvite("expired");
        toast("Group call", "The invitation expired.", "warning");
      }
    }, 30000);
  }

  function finishGroupInvite(reason) {
    const invite = activeGroupInvite;
    activeGroupInvite = null;
    window.clearTimeout(showGroupInvite.expiryTimer);
    try { stopCallRinger(); } catch {}
    const modal = $("groupInviteDialog");
    if (modal) modal.style.display = "none";
    document.title = originalTitle || "TChat";

    if (invite && (reason === "declined" || reason === "expired")) {
      roomSend({type:"groupInviteDeclined",inviteId:invite.inviteId,fromId:myId,fromName:(nameBox?.value||"").trim()||"Guest",toId:invite.fromId,reason});
    }
  }

  async function acceptGroupInvite() {
    const invite = activeGroupInvite;
    if (!invite) return;
    try { stopCallRinger(); } catch {}
    const modal = $("groupInviteDialog");
    if (modal) modal.style.display = "none";
    activeGroupInvite = null;
    window.clearTimeout(showGroupInvite.expiryTimer);
    document.title = originalTitle || "TChat";

    const participants = Array.isArray(invite.participantIds) ? invite.participantIds : [invite.fromId];
    let opened = false;
    try {
      opened = await openGroupCall({
        invited: true,
        callId: invite.callId,
        participantIds: participants
      });
    } catch (error) {
      console.error("Invited group call could not open:", error);
    }

    const fromName = (nameBox?.value || "").trim() || "Guest";
    if (!opened) {
      roomSend({type:"groupInviteDeclined",inviteId:invite.inviteId,fromId:myId,fromName,toId:invite.fromId,reason:"media-unavailable"});
      return;
    }
    roomSend({type:"groupInviteAccepted",inviteId:invite.inviteId,fromId:myId,fromName,toId:invite.fromId,callId:invite.callId});
    toast("📞 Joining group call", `Joining ${invite.fromName || "the caller"}…`, "success");
  }

  function availableInviteUsers() {
    const users = [...(onlineUsers instanceof Map ? onlineUsers.values() : [])];
    return users
      .filter(u => u && u.id && u.id !== myId && !groupPeers?.has?.(u.id))
      .sort((a,b) => String(a.name || "Guest").localeCompare(String(b.name || "Guest")));
  }

  function openGroupInvitePicker() {
    const users = availableInviteUsers();
    if (!users.length) {
      toast("Group call", "There is nobody else available to invite right now.", "warning");
      return;
    }
    $("groupInvitePicker")?.remove();
    const modal = document.createElement("div");
    modal.id = "groupInvitePicker";
    modal.innerHTML = `
      <div id="groupInvitePickerBox" role="dialog" aria-modal="true" aria-labelledby="groupPickerTitle">
        <div class="groupPickerHeader">
          <div><h2 id="groupPickerTitle">👤 Invite someone</h2><p>Choose the nickname you want to ring.</p></div>
          <button id="groupPickerClose" class="groupPickerClose" type="button">✕</button>
        </div>
        <input id="groupPickerSearch" type="search" placeholder="Search nicknames…" autocomplete="off">
        <div id="groupPickerList"></div>
      </div>`;
    document.body.appendChild(modal);
    const list = $("groupPickerList");
    const search = $("groupPickerSearch");

    const render = () => {
      list.innerHTML = "";
      const needle = search.value.trim().toLowerCase();
      const filtered = users.filter(u => !needle || String(u.name || "").toLowerCase().includes(needle));
      if (!filtered.length) {
        list.innerHTML = `<div class="groupPickerEmpty">No matching nicknames are online.</div>`;
        return;
      }
      for (const user of filtered) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "groupPickerUser";
        b.innerHTML = `<span class="groupPickerDot">●</span><span class="groupPickerName"></span><span class="groupPickerArrow">→</span>`;
        b.querySelector(".groupPickerName").textContent = user.name || "Guest";
        b.onclick = () => { modal.remove(); sendGroupInvite(user); };
        list.appendChild(b);
      }
    };
    $("groupPickerClose").onclick = () => modal.remove();
    modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    search.addEventListener("input", render);
    render();
    search.focus();
  }

  function sendGroupInvite(user) {
    if (!groupActive || !groupCallSessionId) {
      toast("Group call", "You must be in a group call to invite someone.", "warning");
      return;
    }
    const inviteId = `ginvite-${crypto.randomUUID()}`;
    const fromName = (nameBox?.value || "").trim() || "Guest";
    const participantIds = [myId, ...groupPeers.keys()];
    const participantNames = {};
    participantNames[myId] = fromName;
    for (const id of groupPeers.keys()) {
      participantNames[id] = groupPeers.get(id)?.name || onlineUsers.get(id)?.name || "Guest";
    }
    pendingGroupInvites.set(inviteId, {inviteId,toId:user.id,toName:user.name,createdAt:Date.now()});
    if (!roomSend({
      type:"groupInvite", inviteId, fromId:myId, fromName,
      toId:user.id, toName:user.name, room:typeof room !== "undefined" ? room : "",
      callId:groupCallSessionId, participantIds, participantNames
    })) return;

    toast("📞 Group call invitation sent", `Ringing ${user.name || "that user"}…`, "success");
    window.setTimeout(() => {
      const pending = pendingGroupInvites.get(inviteId);
      if (!pending) return;
      pendingGroupInvites.delete(inviteId);
      toast("Group call", `${pending.toName || "The user"} did not accept the invitation.`, "warning");
    }, 30000);
  }

  function initGroupInviteAndChat() {
    installGroupInviteDialog();
    initGroupCallChat();

    const controls = $("groupCallControls");
    if (controls && !$("groupInviteButton")) {
      const button = document.createElement("button");
      button.id = "groupInviteButton";
      button.type = "button";
      button.textContent = "👤 Invite user";
      button.title = "Ring a specific nickname into this group call";
      button.onclick = openGroupInvitePicker;
      controls.insertBefore(button, $("groupHangup"));
    }

    if (typeof chat?.on !== "function") return;
    if (window.__tchatCriticalGroupHandlerInstalled) return;
    window.__tchatCriticalGroupHandlerInstalled = true;

    chat.on("message", async ({message}) => {
      if (!message || !message.type) return;

      // IMPORTANT: invite messages are handled even when groupActive is false.
      if (message.type === "groupInvite" && message.toId === myId) {
        if (groupActive) {
          roomSend({type:"groupInviteDeclined",inviteId:message.inviteId,fromId:myId,fromName:(nameBox?.value||"").trim()||"Guest",toId:message.fromId,reason:"already-in-group-call"});
          return;
        }
        showGroupInvite(message);
        return;
      }

      if (message.type === "groupInviteAccepted" && message.toId === myId) {
        const pending = pendingGroupInvites.get(message.inviteId);
        if (!pending) return;
        pendingGroupInvites.delete(message.inviteId);
        toast("📞 Group call", `${message.fromName || pending.toName || "The user"} accepted.`, "success");
        return;
      }

      if (message.type === "groupInviteDeclined" && message.toId === myId) {
        const pending = pendingGroupInvites.get(message.inviteId);
        if (!pending) return;
        pendingGroupInvites.delete(message.inviteId);
        toast("Group call", `${message.fromName || pending.toName || "The user"} declined the invitation.`, "info");
        return;
      }

      if (message.type === "groupCallChat" && groupActive && message.callId === groupCallSessionId && message.fromId !== myId) {
        addGroupCallChatLine(message.fromName || "Guest", message.text || "", false);
        return;
      }
    });
  }

  function bootCriticalFixes() {
    initAlexEnhancements();
    initEnhancedToolbox();
    initGroupInviteAndChat();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootCriticalFixes, {once:true});
  else bootCriticalFixes();
})();
