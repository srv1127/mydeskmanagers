import { formatDate, formatMonth, type Payment, type Settings, type Student } from "@/lib/library-store";

export function receiptNumber(settings: Settings, payment: Payment) {
  return `${settings.receiptPrefix}-${payment.id.slice(-6).toUpperCase()}`;
}

/** Opens a print-ready receipt in a new window and triggers the print dialog. */
export function printReceipt(payment: Payment, student: Student, settings: Settings) {
  const win = window.open("", "_blank", "width=620,height=800");
  if (!win) return false;
  win.document.write(`<!doctype html><html><head><title>Receipt ${receiptNumber(settings, payment)}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;padding:36px;color:#12203a;margin:0}
      .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1c62f2;padding-bottom:14px}
      h1{font-size:20px;margin:0}
      small{color:#5b6b86}
      .tag{background:#e8f0ff;color:#1c62f2;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700}
      table{width:100%;margin-top:26px;border-collapse:collapse}
      td{padding:11px 0;border-bottom:1px solid #e6ebf3;font-size:14px}
      .total td{font-weight:700;font-size:18px;border-bottom:none;padding-top:18px}
      .foot{margin-top:30px;font-size:12px;color:#5b6b86;line-height:1.6}
    </style></head><body>
    <div class="head">
      <div>
        <h1>${settings.libraryName}</h1>
        <small>Fee receipt · ${receiptNumber(settings, payment)}</small>
      </div>
      <span class="tag">PAID</span>
    </div>
    <table>
      <tr><td>Student</td><td align="right">${student.name}</td></tr>
      <tr><td>Mobile</td><td align="right">${student.mobile}</td></tr>
      <tr><td>Seat number</td><td align="right">${student.seatNumber ?? "—"}</td></tr>
      <tr><td>For month</td><td align="right">${formatMonth(payment.forMonth)}</td></tr>
      <tr><td>Payment date</td><td align="right">${formatDate(payment.date)}</td></tr>
      <tr><td>Method</td><td align="right">${payment.method.toUpperCase()}</td></tr>
      ${payment.note ? `<tr><td>Note</td><td align="right">${payment.note}</td></tr>` : ""}
      <tr class="total"><td>Amount paid</td><td align="right">₹${payment.amount.toLocaleString("en-IN")}</td></tr>
    </table>
    <p class="foot">Thank you for your payment.<br/>Issued by ${settings.adminName} · ${settings.adminEmail}</p>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
  return true;
}

/** Builds a WhatsApp deep link with a pre-filled overdue-fee reminder. */
export function whatsappReminderUrl(
  student: Student,
  dueAmount: number,
  settings: Settings,
  monthLabel: string,
) {
  const digits = student.mobile.replace(/\D/g, "");
  const phone = digits.length === 10 ? `91${digits}` : digits;
  const text = [
    `Hello ${student.name},`,
    ``,
    `This is a gentle reminder from ${settings.libraryName}.`,
    `Seat number: ${student.seatNumber ?? "not assigned"}`,
    `Pending fee for ${monthLabel}: ₹${dueAmount.toLocaleString("en-IN")}`,
    ``,
    `Kindly pay at the counter or via UPI to keep your seat reserved. Thank you!`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
