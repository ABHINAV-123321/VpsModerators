import { NextResponse } from "next/server";

type SubmissionPayload = {
  moderatorName: string;
  task: string;
  timestamp: string;
  attachedFile: string;
  message: string;
};

const recipients = [
  "abhinav@vpsmun.org",
  "shreya@vpsmun.org",
];

export async function POST(request: Request) {
  const payload: SubmissionPayload = await request.json();
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Resend API key is not configured. Submission stored locally and notification was not sent.",
      },
      { status: 200 }
    );
  }

  const html = `
    <h1>VPS OPS CENTER Submission</h1>
    <p><strong>Moderator:</strong> ${payload.moderatorName}</p>
    <p><strong>Task:</strong> ${payload.task}</p>
    <p><strong>Timestamp:</strong> ${new Date(payload.timestamp).toLocaleString()}</p>
    <p><strong>Attached file:</strong> ${payload.attachedFile}</p>
    <p><strong>Details:</strong></p>
    <p>${payload.message}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "VPS OPS CENTER <no-reply@vpsopscenter.app>",
      to: recipients,
      subject: `Moderator submission: ${payload.task}`,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      {
        success: false,
        message: `Email send failed: ${errorText}`,
      },
      { status: response.status }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Submission notification dispatched through Resend.",
  });
}
