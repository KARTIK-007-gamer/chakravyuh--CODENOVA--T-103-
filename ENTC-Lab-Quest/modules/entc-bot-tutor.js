document.addEventListener("entc:app-ready", () => {
  const content = document.querySelector("#moduleContent");
  content.innerHTML = `
    <header class="tutor-hero">
      <div>
        <p class="tutor-kicker">YOUR FRIENDLY STUDY PARTNER</p>
        <h1>Meet ENTC-Bot</h1>
        <p class="muted">Ask a question, choose a topic, and learn one clear idea at a time.</p>
      </div>
      <div class="bot-orbit" aria-hidden="true"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="bot-face"><i></i><i></i><b></b></span><span class="orbit-star">✦</span></div>
    </header>
    <div id="moduleMessage" class="tutor-message" role="status"></div>
    <div class="tutor-layout">
      <section class="card tutor-chat-card">
        <div class="chat-heading"><div class="chat-avatar">✦</div><div><h2>Study chat</h2><p><span class="online-dot"></span> Here to help you learn</p></div><button id="clearChat" type="button" class="clear-chat">Clear chat</button></div>
        <div id="conversation" class="conversation" aria-live="polite" aria-label="Tutor conversation"></div>
        <form id="chatForm" class="chat-controls"><input id="chatInput" maxlength="500" required autocomplete="off" placeholder="Ask about gates, signals, Arduino…" aria-label="Your question"><button id="sendChat" class="primary" type="submit">Send <span>↑</span></button></form>
        <p class="privacy-note">Demo tutor · Messages stay in this browser session.</p>
      </section>
      <aside class="card tutor-side-card">
        <div class="side-heading"><span class="tutor-kicker">PICK A TOPIC</span><span class="sparkle">✧</span></div>
        <h2>What are you exploring?</h2>
        <p class="side-intro">Tap a topic to start a guided conversation.</p>
        <div class="topic-list">
          <button type="button" class="topic-card" data-prompt="Give me a hint for XOR without telling me the answer."><span class="topic-icon topic-logic">⌘</span><span><strong>Logic gates</strong><small>AND, OR, XOR &amp; more</small></span><span class="topic-arrow">→</span></button>
          <button type="button" class="topic-card" data-prompt="Explain amplitude modulation in a simple way."><span class="topic-icon topic-signal">〰</span><span><strong>Signals &amp; AM</strong><small>Waves, frequency, modulation</small></span><span class="topic-arrow">→</span></button>
          <button type="button" class="topic-card" data-prompt="Help me understand Arduino INPUT_PULLUP."><span class="topic-icon topic-arduino">⌁</span><span><strong>Arduino</strong><small>Pins, buttons &amp; code</small></span><span class="topic-arrow">→</span></button>
          <button type="button" class="topic-card" data-prompt="My LED is not turning on. Give me a debugging checklist."><span class="topic-icon topic-circuit">⚡</span><span><strong>Circuit debugging</strong><small>Find the fault, step by step</small></span><span class="topic-arrow">→</span></button>
        </div>
        <div class="tutor-tip"><span>✦</span><p><strong>Learning tip</strong><br>Ask for a hint first. Try it yourself, then ask for an explanation.</p></div>
      </aside>
    </div>
    <p class="tutor-disclaimer">ENTC-Bot is a rule-based learning demo, not a live AI service.</p>`;

  const conversation = document.querySelector("#conversation");
  const input = document.querySelector("#chatInput");
  const sendButton = document.querySelector("#sendChat");
  const prompts = {
    xor: {
      title: "Let's reason it out",
      reply: "Try comparing the inputs in pairs: (0,0), (0,1), (1,0), and (1,1). Which pairs are different? XOR becomes HIGH when the two inputs differ.",
      followUp: "Want to test those pairs in the Logic Lab?"
    },
    logic: {
      title: "A quick logic-gate guide",
      reply: "Think of a gate as a tiny decision rule: AND needs both inputs HIGH, OR needs at least one HIGH, and NOT flips one input. XOR is HIGH only when its two inputs are different.",
      followUp: "Which gate would you like to explore first?"
    },
    modulation: {
      title: "Picture a message riding a wave",
      reply: "In amplitude modulation (AM), a slower message wave changes the height of a faster carrier wave. The carrier keeps roughly the same frequency; its outer envelope carries the message.",
      followUp: "Try the AM Radio preset in Signal Playground and move the modulation-depth slider."
    },
    signal: {
      title: "Three useful signal clues",
      reply: "Amplitude is the wave's height, frequency is its cycles per second, and phase tells you where the wave is in its cycle. In AM, the message changes amplitude.",
      followUp: "Which of those would you like to see on the waveform?"
    },
    arduino: {
      title: "Arduino pin setup",
      reply: "Use pinMode(pin, OUTPUT) when the board needs to drive something, like an LED. Use pinMode(pin, INPUT) or INPUT_PULLUP when it needs to read a switch or sensor.",
      followUp: "Remember: with INPUT_PULLUP, an open button reads HIGH and a pressed button connected to ground reads LOW."
    },
    pullup: {
      title: "INPUT_PULLUP, simply",
      reply: "INPUT_PULLUP switches on a resistor inside the Arduino to keep an unpressed input steady at HIGH. Pressing a button wired to ground pulls the reading LOW, so the logic can feel reversed.",
      followUp: "Try predicting the reading before and after the button is pressed."
    },
    led: {
      title: "Let's debug one step at a time",
      reply: "Check these in order: 1) LED polarity, 2) a current-limiting resistor, 3) a shared ground, 4) the pin number in both wiring and code, and 5) pinMode set to OUTPUT.",
      followUp: "Start with polarity: the longer LED leg is usually the anode (+)."
    },
    circuit: {
      title: "A circuit-debugging checklist",
      reply: "Follow the path from power to ground. Check the supply, component direction, resistor, wire connections, and the code's pin number. Change one thing at a time so you know what fixed it.",
      followUp: "Tell me what you've checked so far, and we can narrow it down."
    },
    frequency: {
      title: "Frequency is the pace",
      reply: "Frequency tells you how many full cycles happen in one second. It is measured in hertz (Hz): 1 Hz means one cycle each second.",
      followUp: "Increase frequency in Signal Playground to compare the waves."
    }
  };
  const defaultReply = {
    title: "Let's break that down",
    reply: "Start by identifying the input, the rule or component acting on it, and the output you expect. Then test one small case at a time.",
    followUp: "I can help with logic gates, signals and AM, Arduino, or circuit debugging. Which area is closest to your question?"
  };
  let isReplying = false;
  let typingTimer;

  function makeBubble(className, text) {
    const bubble = document.createElement("article");
    bubble.className = `bubble ${className}`;
    if (className === "bot") {
      const avatar = document.createElement("span");
      avatar.className = "bot-message-avatar";
      avatar.textContent = "✦";
      const body = document.createElement("div");
      body.className = "bubble-content";
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      body.append(paragraph);
      bubble.append(avatar, body);
    } else {
      bubble.textContent = text;
    }
    return bubble;
  }

  function replyTo(message) {
    const text = message.toLowerCase();
    if (text.includes("xor")) return prompts.xor;
    if (text.includes("modulation") || text.includes("am ")) return prompts.modulation;
    if (text.includes("pullup") || text.includes("pull-up")) return prompts.pullup;
    if (text.includes("arduino") || text.includes("pinmode")) return prompts.arduino;
    if (text.includes("led") || text.includes("debug")) return prompts.led;
    if (text.includes("circuit")) return prompts.circuit;
    if (text.includes("frequency") || text.includes("hertz")) return prompts.frequency;
    if (text.includes("signal") || text.includes("wave") || text.includes("amplitude")) return prompts.signal;
    if (text.includes("logic") || text.includes("gate") || text.includes("truth table")) return prompts.logic;
    return defaultReply;
  }

  function addBotReply(reply) {
    const bubble = makeBubble("bot", "");
    const body = bubble.querySelector(".bubble-content");
    body.replaceChildren();
    const title = document.createElement("strong");
    title.className = "bot-reply-title";
    title.textContent = reply.title;
    const paragraph = document.createElement("p");
    paragraph.textContent = reply.reply;
    const followUp = document.createElement("p");
    followUp.className = "bot-follow-up";
    followUp.textContent = reply.followUp;
    body.append(title, paragraph, followUp);
    conversation.append(bubble);
    conversation.scrollTop = conversation.scrollHeight;
  }

  function sendMessage(messageText) {
    const message = (messageText || input.value).trim();
    if (!message || isReplying) return;
    window.clearTimeout(typingTimer);
    isReplying = true;
    input.value = "";
    document.querySelector("#moduleMessage").className = "tutor-message";
    const userBubble = makeBubble("user", message);
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.setAttribute("aria-label", "ENTC-Bot is replying");
    typing.innerHTML = "<i></i><i></i><i></i><span>Thinking</span>";
    conversation.append(userBubble, typing);
    conversation.scrollTop = conversation.scrollHeight;
    sendButton.disabled = true;
    document.querySelectorAll("[data-prompt]").forEach(button => { button.disabled = true; });
    typingTimer = window.setTimeout(async () => {
      typing.remove();
      addBotReply(replyTo(message));
      isReplying = false;
      sendButton.disabled = false;
      document.querySelectorAll("[data-prompt]").forEach(button => { button.disabled = false; });
      input.focus();
      try {
        const { db, session } = window.ENTCSession;
        const { data: currentProgress, error } = await db.from("module_progress")
          .select("xp")
          .eq("user_id", session.user.id)
          .eq("module_key", "tutor")
          .maybeSingle();
        if (error) throw error;
        const existingXp = currentProgress ? currentProgress.xp : 0;
        await saveModuleProgress("tutor", existingXp + 5, false);
      } catch (error) {
        showError(error);
      }
    }, 550);
  }

  conversation.append(makeBubble("bot", "Hi! I'm ENTC-Bot. Pick a topic to begin, or ask me a question. I'll guide you with hints and simple explanations."));
  document.querySelector("#chatForm").addEventListener("submit", event => {
    event.preventDefault();
    sendMessage();
  });
  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => sendMessage(button.dataset.prompt));
  });
  document.querySelector("#clearChat").addEventListener("click", () => {
    window.clearTimeout(typingTimer);
    isReplying = false;
    sendButton.disabled = false;
    document.querySelectorAll("[data-prompt]").forEach(button => { button.disabled = false; });
    conversation.replaceChildren(makeBubble("bot", "Chat cleared. What would you like to explore next?"));
    input.focus();
  });
  input.addEventListener("input", () => {
    sendButton.disabled = !input.value.trim() || isReplying;
  });
  sendButton.disabled = true;
});
