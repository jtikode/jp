export interface StatementLine {
  invoiceNo: string | null;
  invoiceDate: Date | null;
  amount: number;
  outstandingAmount: number;
}

// Each variation is the greeting line that goes above the bills and the
// request line that goes below them. One is picked at random every time the
// WhatsApp button is tapped, so the account doesn't send the same text to
// every party.
const OPENINGS: ReadonlyArray<readonly [string, string]> = [
  [
    "Hi, please find below the details of your pending outstanding balance.",
    "Kindly clear the payment at your earliest convenience. Thank you! 🙏",
  ],
  [
    "Hello, your account statement with unpaid dues is attached below.",
    "Please review the details and let us know if there are any discrepancies, or clear it at your earliest. 💳",
  ],
  [
    "Dear Retailer, kindly check your pending bill details given below.",
    "If everything is correct, please arrange to settle the amount at your earliest. 👍",
  ],
  [
    "Namaskar, aaplya account varil pending outstanding amount cha detail khali dila ahe.",
    "Please clear this outstanding payment at your earliest. Thank you! 🙏",
  ],
  [
    "Hello Sir, khali dilaya pramane tumcha pending dues detail dila ahe.",
    "Kindly check the amount and let us know if any discrepancy, otherwise please process payment at the earliest. ✨",
  ],
  [
    "Dear Partner, tumchya unpaid invoice cha report khali share kela ahe.",
    "Please review the statement and clear the balance amount at your earliest convenience. 📲",
  ],
  [
    "Hi, aaplyakde kaahi remaining payment baaki ahe, details khali ahet.",
    "Kindly cross-check the bill details and settle it at your earliest. Thank you! 🤝",
  ],
  [
    "नमस्कार, आपल्या खात्यावरील थकीत (Outstanding) रकमेचा तपशील खाली दिला आहे.",
    "कृपया ही रक्कम लवकरात लवकर जमा करून सहकार्य करावे, ही नम्र विनंती. 🙏",
  ],
  [
    "सस्नेह नमस्कार, आपल्याकडील उर्वरित देयक रक्कमेचा तपशील खालीलप्रमाणे आहे.",
    "कृपया बिल तपासून काही तफावत (discrepancy) असल्यास कळवावे, अन्यथा रक्कम लवकरात लवकर जमा करावी. धन्यवाद! 🧾",
  ],
  [
    "हॅलो, तुमच्या अकाऊंटमधील बाकी रक्कमेचे डिटेल्स खाली दिलेले आहेत.",
    "कृपया स्टेटमेंट तपासून घ्या आणि देयक लवकरात लवकर भरून सहकार्य करा. 😊",
  ],
];

const CLOSINGS: readonly string[] = [
  "Have a good day! 😊",
  "Wishing you a great day ahead! ✨",
  "Have a wonderful day ahead! 👍",
  "Thank you & have a good day! 🙏",
  "Dhananyavad & have a good day! 🙏",
  "Tumcha divas changla jaao! 😊",
  "Thank you, Have a great day ahead! 👍",
  "Dhanyavad, aapla divas shubh jaao! ✨",
  "धन्यवाद, आपला दिवस शुभ जावो! 🙏",
  "धन्यवाद & तुमचा दिवस आनंदात जावो! 😊",
  "धन्यवाद! तुमचा दिवस चांगला जाओ. ✨",
  "मनःपूर्वक धन्यवाद! 🤝",
];

function pick<T>(items: ReadonlyArray<T>, rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function inr(value: number): string {
  return `₹${Math.round(Math.abs(value)).toLocaleString("en-IN")}`;
}

function formatBillDate(d: Date | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Builds the WhatsApp statement: a random greeting, one line per pending bill
 * (bill date | bill no | amount | running total), the grand total, a random
 * request line and a random sign-off. Pass a seeded `rng` in tests.
 */
export function buildStatementMessage(entries: StatementLine[], rng: () => number = Math.random): string {
  const [greeting, request] = pick(OPENINGS, rng);
  const closing = pick(CLOSINGS, rng);

  const open = entries
    .filter((e) => e.outstandingAmount !== 0)
    .sort((a, b) => (a.invoiceDate?.getTime() ?? Infinity) - (b.invoiceDate?.getTime() ?? Infinity));

  let running = 0;
  const lines = open.map((e) => {
    running += e.outstandingAmount;
    const no = e.invoiceNo ?? "-";
    const amount = e.outstandingAmount < 0 ? `-${inr(e.outstandingAmount)} (credit)` : inr(e.outstandingAmount);
    const total = running < 0 ? `-${inr(running)}` : inr(running);
    return `${formatBillDate(e.invoiceDate)} | ${no} | ${amount} | Total ${total}`;
  });

  return [greeting, "", ...lines, "", `*Total Outstanding: ${running < 0 ? "-" : ""}${inr(running)}*`, "", request, "", closing].join(
    "\n",
  );
}
