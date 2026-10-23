(() => {
  const transcript = document.querySelector("#transcript");
  const startButton = document.querySelector("#startVoiceButton");
  const stopButton = document.querySelector("#stopVoiceButton");
  const status = document.querySelector("#voiceStatus");

  if (!transcript || !startButton || !stopButton || !status) {
    console.error("语音输入初始化失败，请检查语音控件的 HTML。");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    startButton.disabled = true;
    stopButton.disabled = true;
    status.textContent =
      "当前浏览器不支持此语音识别接口，请尝试最新版 Chrome 或 Edge，也可以继续粘贴文字。";
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "zh-CN";
  recognition.continuous = true;
  recognition.interimResults = true;

  const analyzeButton = document.querySelector("#analyzeButton");
  const resetButton = document.querySelector("#resetButton");

  let active = false;
  let sessionError = false;
  let reachedLimit = false;
  let baseText = "";
  let savedControls = [];

  // 录音期间暂停编辑和分析，避免识别结果与手动操作冲突。
  function lockControls() {
    savedControls = [analyzeButton, resetButton]
      .filter(Boolean)
      .map(element => ({
        element,
        disabled: element.disabled
      }));

    savedControls.forEach(({ element }) => {
      element.disabled = true;
    });

    transcript.readOnly = true;
  }

  function unlockControls() {
    savedControls.forEach(({ element, disabled }) => {
      element.disabled = disabled;
    });

    transcript.readOnly = false;
  }

  function finishSession() {
    active = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    unlockControls();
  }

  startButton.addEventListener("click", () => {
    if (active) return;

    const maxLength =
      transcript.maxLength > 0 ? transcript.maxLength : 5000;

    if (transcript.value.length >= maxLength) {
      status.textContent = "输入框已满，请删减文字后再进行语音输入。";
      return;
    }

    baseText = transcript.value;
    sessionError = false;
    reachedLimit = false;
    active = true;

    startButton.disabled = true;
    stopButton.disabled = false;
    lockControls();

    status.textContent = "正在启动，请允许浏览器使用麦克风……";

    try {
      recognition.start();
    } catch (error) {
      sessionError = true;
      finishSession();
      status.textContent = "无法启动语音输入，请稍后重试。";
      console.error(error);
    }
  });

  stopButton.addEventListener("click", () => {
    if (!active) return;

    stopButton.disabled = true;
    status.textContent = "正在结束识别，请稍候……";

    // stop 会尝试返回已采集语音的最终结果。
    recognition.stop();
  });

  recognition.onstart = () => {
    status.textContent = "正在聆听，请说普通话。";
  };

  recognition.onresult = event => {
    let finalText = "";
    let interimText = "";

    // 每次从当前会话的完整结果重建，避免重复追加。
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];

      if (result.isFinal) {
        finalText += result[0].transcript;
      } else {
        interimText += result[0].transcript;
      }
    }

    const separator =
      baseText && !baseText.endsWith("\n") && finalText ? "\n" : "";

    const combinedText = baseText + separator + finalText;

    const maxLength =
      transcript.maxLength > 0 ? transcript.maxLength : 5000;

    transcript.value = combinedText.slice(0, maxLength);

    // 触发现有 app.js 中的字数更新逻辑。
    transcript.dispatchEvent(
      new Event("input", { bubbles: true })
    );

    if (combinedText.length >= maxLength) {
      if (!reachedLimit) {
        reachedLimit = true;
        stopButton.disabled = true;
        recognition.stop();
      }

      status.textContent = "已达到文字上限，正在停止语音输入。";
      return;
    }

    status.textContent = interimText
      ? `正在识别：${interimText}`
      : "已写入识别文字，请继续说话。";
  };

  recognition.onerror = event => {
    sessionError = true;
    stopButton.disabled = true;

    const messages = {
      "not-allowed":
        "麦克风或语音识别权限被拒绝，请检查浏览器站点权限。",
      "service-not-allowed":
        "当前环境不允许使用语音识别服务。",
      "audio-capture":
        "无法使用麦克风，请检查设备连接和系统权限。",
      "no-speech":
        "没有检测到语音，请重新点击开始并靠近麦克风说话。",
      "network":
        "语音识别服务连接失败，请检查网络；也可能是服务在当前网络环境中不可用。",
      "language-not-supported":
        "当前识别服务不支持所设置的中文语言。",
      "aborted":
        "语音输入已取消。"
    };

    status.textContent =
      messages[event.error] || `语音识别失败：${event.error}`;
  };

  recognition.onend = () => {
    finishSession();

    if (sessionError) return;

    status.textContent = reachedLimit
      ? "已达到文字上限。请检查文字后点击“开始分析”。"
      : "语音输入已结束。请检查识别文字，再点击“开始分析”。";
  };
})();