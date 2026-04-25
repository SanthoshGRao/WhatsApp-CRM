import { prisma } from "./prisma";
interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
export async function sendWhatsAppTemplate(
  phoneNumber: string,
  customerName: string,
  companyName: string,
  registrationId: string,
  templateOverride?: string
): Promise<WhatsAppSendResult> {
  try {
    let config = await prisma.whatsAppConfig.findFirst({
      where: { isActive: true },
    });
    if (!config) {
      if (process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID) {
        config = {
          accessToken: process.env.META_ACCESS_TOKEN,
          phoneNumberId: process.env.META_PHONE_NUMBER_ID,
          graphBaseUrl: process.env.META_GRAPH_BASE_URL || "https://graph.facebook.com/v24.0",
          templateName: "welcome_registration",
        } as any;
      } else {
        const errorMsg = "No active WhatsApp configuration found in DB or ENV";
        try {
          await prisma.messageLog.create({
            data: {
              registrationId,
              type: "whatsapp",
              status: "failed",
              errorMessage: errorMsg,
            },
          });
        } catch (e) {}
        return { success: false, error: errorMsg };
      }
    }
    const activeConfig = config!;
    let formattedPhone = phoneNumber.replace(/[\s\-\+]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "91" + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith("91")) {
      formattedPhone = "91" + formattedPhone;
    }
    const url = `${activeConfig.graphBaseUrl}/${activeConfig.phoneNumberId}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateOverride || activeConfig.templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: (templateOverride || activeConfig.templateName) === "rotary_payment_confirmation"
              ? [ { type: "text", text: customerName } ]
              : [
                  { type: "text", text: customerName },
                  { type: "text", text: companyName },
                ],
          },
        ],
      },
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeConfig.accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (response.ok && data.messages && data.messages.length > 0) {
      await prisma.messageLog.create({
        data: {
          registrationId,
          type: "whatsapp",
          status: "sent",
          messageId: data.messages[0].id,
        },
      });
      return { success: true, messageId: data.messages[0].id };
    } else {
      const errorMsg = data.error?.message || JSON.stringify(data);
      await prisma.messageLog.create({
        data: {
          registrationId,
          type: "whatsapp",
          status: "failed",
          errorMessage: errorMsg,
        },
      });
      return { success: false, error: errorMsg };
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    try {
      await prisma.messageLog.create({
        data: {
          registrationId,
          type: "whatsapp",
          status: "failed",
          errorMessage: errorMsg,
        },
      });
    } catch {
      console.error("Failed to log WhatsApp error:", errorMsg);
    }
    return { success: false, error: errorMsg };
  }
}
