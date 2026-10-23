const rules = [
  {
    category: "索要验证码或密码",
    keywords: [
      "验证码",
      "短信验证码",
      "支付密码",
      "银行卡密码",
      "登录密码",
      "密码告诉我",
      "把验证码发给我"
    ],
    score: 4,
    explanation: "对方试图获取验证码、密码等敏感信息。"
  },
  {
    category: "要求转账或汇款",
    keywords: [
      "转账",
      "汇款",
      "打款",
      "转到安全账户",
      "安全账户",
      "立即付款",
      "缴纳保证金",
      "交保证金"
    ],
    score: 4,
    explanation: "对方要求你进行转账、汇款或付款操作。"
  },
  {
    category: "要求安装软件或共享屏幕",
    keywords: [
      "安装软件",
      "下载软件",
      "屏幕共享",
      "共享屏幕",
      "远程控制",
      "远程操作",
      "打开会议软件"
    ],
    score: 4,
    explanation: "对方要求远程控制设备或查看屏幕，可能导致隐私和资金风险。"
  },
  {
    category: "冒充官方身份",
    keywords: [
      "公安",
      "警察",
      "法院",
      "检察院",
      "银行客服",
      "平台客服",
      "客服人员",
      "工作人员",
      "官方客服"
    ],
    score: 2,
    explanation: "对方声称自己来自公安、法院、银行或平台等机构。"
  },
  {
    category: "制造紧迫感",
    keywords: [
      "马上处理",
      "立即处理",
      "否则冻结",
      "账户冻结",
      "不能拖",
      "最后通知",
      "立刻操作",
      "马上转"
    ],
    score: 2,
    explanation: "对方通过冻结账户、最后通知等说法制造紧张感。"
  },
  {
    category: "要求保密",
    keywords: [
      "不要告诉家人",
      "不要告诉别人",
      "不能告诉任何人",
      "保密",
      "不要报警",
      "不要挂电话"
    ],
    score: 2,
    explanation: "对方要求你隐瞒通话内容，阻止你向他人求证。"
  }
];

const transcriptElement = document.querySelector("#transcript");
const charCountElement = document.querySelector("#charCount");
const analyzeButton = document.querySelector("#analyzeButton");
const resetButton = document.querySelector("#resetButton");
const emptyState = document.querySelector("#emptyState");
const resultSection = document.querySelector("#resultSection");
const riskCard = document.querySelector("#riskCard");
const riskTitle = document.querySelector("#riskTitle");
const riskScore = document.querySelector("#riskScore");
const scoreBar = document.querySelector("#scoreBar");
const riskSummary = document.querySelector("#riskSummary");
const highlightedText = document.querySelector("#highlightedText");
const reasonsElement = document.querySelector("#reasons");
const adviceElement = document.querySelector("#advice");

transcriptElement.addEventListener("input", () => {
  charCountElement.textContent = `${transcriptElement.value.length} / 5000`;
});

analyzeButton.addEventListener("click", analyzeText);
resetButton.addEventListener("click", resetApp);

function analyzeText() {
  const text = transcriptElement.value.trim();

  if (!text) {
    transcriptElement.focus();
    transcriptElement.setCustomValidity("请先粘贴通话内容");
    transcriptElement.reportValidity();
    return;
  }

  transcriptElement.setCustomValidity("");

  const matchedRules = [];
  const matchedKeywords = [];

  for (const rule of rules) {
    const matches = rule.keywords.filter((keyword) => text.includes(keyword));

    if (matches.length > 0) {
      matchedRules.push({
        ...rule,
        matches
      });

      matchedKeywords.push(...matches);
    }
  }

  let score = matchedRules.reduce((total, rule) => total + rule.score, 0);

  const hasImpersonation = matchedRules.some(
    (rule) => rule.category === "冒充官方身份"
  );

  const hasDangerousAction = matchedRules.some((rule) =>
    ["索要验证码或密码", "要求转账或汇款", "要求安装软件或共享屏幕"].includes(
      rule.category
    )
  );

  if (hasImpersonation && hasDangerousAction) {
    score += 3;
  }

  const result = getRiskResult(score);

  renderResult(text, score, matchedRules, matchedKeywords, result);
}

function getRiskResult(score) {
  if (score >= 8) {
    return {
      title: "高度可疑",
      summary: "文本中出现了多项高风险话术，请立即停止相关操作。",
      advice:
        "请立即停止转账、付款和提供验证码。挂断电话后，通过官方网站或银行卡背面的官方电话独立核实。必要时联系家人、银行或拨打 96110 咨询。",
      className: "high"
    };
  }

  if (score >= 4) {
    return {
      title: "需要警惕",
      summary: "文本中发现了值得进一步核实的风险线索。",
      advice:
        "先不要付款或提供个人信息。不要点击对方发送的链接，也不要安装对方要求的软件。挂断电话后，通过官方渠道独立核实。",
      className: "medium"
    };
  }

  return {
    title: "暂未发现明显风险",
    summary: "当前文本中没有发现明显的高风险话术。",
    advice:
      "分析结果不能证明对方一定安全。请继续保护好密码、验证码和个人信息，不要仅根据来电显示判断对方身份。",
    className: "low"
  };
}

function renderResult(text, score, matchedRules, matchedKeywords, result) {
  const maxScore = 25;
  const scorePercent = Math.min((score / maxScore) * 100, 100);

  riskCard.className = `risk-card ${result.className}`;
  riskTitle.textContent = result.title;
  riskScore.textContent = score;
  scoreBar.style.width = `${scorePercent}%`;
  riskSummary.textContent = result.summary;
  adviceElement.textContent = result.advice;

  highlightedText.innerHTML = highlightText(text, matchedKeywords);

  if (matchedRules.length === 0) {
    reasonsElement.innerHTML = `
      <div class="reason">
        <strong>暂未发现明显风险话术</strong>
        当前文本没有匹配到预设的典型风险表达，请结合实际情况继续核实。
      </div>
    `;
  } else {
    reasonsElement.innerHTML = matchedRules
      .map(
        (rule) => `
          <div class="reason">
            <strong>${escapeHtml(rule.category)}</strong>
            ${escapeHtml(rule.explanation)}
            <br>
            <small>发现可疑词语：${escapeHtml(rule.matches.join("、"))}</small>
          </div>
        `
      )
      .join("");
  }

  emptyState.hidden = true;
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function highlightText(text, keywords) {
  const uniqueKeywords = [...new Set(keywords)].sort(
    (a, b) => b.length - a.length
  );

  if (uniqueKeywords.length === 0) {
    return escapeHtml(text);
  }

  const keywordPattern = uniqueKeywords.map(escapeRegExp).join("|");
  const regex = new RegExp(`(${keywordPattern})`, "g");

  return escapeHtml(text).replace(
    regex,
    '<mark class="highlight">$1</mark>'
  );
}

function resetApp() {
  transcriptElement.value = "";
  charCountElement.textContent = "0 / 5000";
  resultSection.hidden = true;
  emptyState.hidden = false;
  transcriptElement.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}