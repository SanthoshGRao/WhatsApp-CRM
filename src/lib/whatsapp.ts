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
    // Get active WhatsApp config from database
    const config = await prisma.whatsAppConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return { success: false, error: "No active WhatsApp configuration found" };
    }

    // Format phone number - ensure it has country code
    let formattedPhone = phoneNumber.replace(/[\s\-\+]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "91" + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith("91")) {
      formattedPhone = "91" + formattedPhone;
    }

    const url = `${config.graphBaseUrl}/${config.phoneNumberId}/messages`;

    const body = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateOverride || config.templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: (templateOverride || config.templateName) === "rotary_payment_confirmation"
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
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.messages && data.messages.length > 0) {
      // Log success
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
      // Log failure
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
    // Log failure
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
