import { Page, Layout, Card, Text, BlockStack, InlineStack, TextField, Button, Divider } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#4b5563",
  "#9ca3af",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#16a34a",
  "#059669",
  "#0284c7",
  "#2563eb",
  "#4f46e5"
];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  let setting = await prisma.appSetting.findUnique({ where: { shop: session.shop } });
  if (!setting) {
    setting = await prisma.appSetting.create({
      data: { shop: session.shop }
    });
  }
  return json({ setting });
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const isActive = formData.get("isActive") === "true";
  
  const data = {
    isActive,
    heading: formData.get("heading") || "",
    subtext: formData.get("subtext") || "",
    yesText: formData.get("yesText") || "",
    noText: formData.get("noText") || "",
    backgroundColor: formData.get("backgroundColor") || "",
    textColor: formData.get("textColor") || "",
    buttonColor: formData.get("buttonColor") || "",
    redirectUrl: formData.get("redirectUrl") || "",
  };

  await prisma.appSetting.upsert({
    where: { shop: session.shop },
    update: data,
    create: { shop: session.shop, ...data }
  });

  const shopRes = await admin.graphql(`{ shop { id } }`);
  const shopData = await shopRes.json();
  const shopId = shopData.data.shop.id;

  await admin.graphql(`
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { field message }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            namespace: "age_verification",
            key: "settings",
            type: "json",
            value: JSON.stringify(data),
            ownerId: shopId
          }
        ]
      }
    }
  );

  return json({ success: true });
};

export default function Index() {
  const { setting } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    ...setting,
    isActive: String(setting.isActive)
  });

  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show("Settings saved");
    }
  }, [actionData]);

  const handleChange = (value, name) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    submit(formState, { method: "post" });
  };

  const isActiveBool = formState.isActive === "true";

  return (
    <Page
      title="Age Verification Settings"
      primaryAction={{ content: "Save", onAction: handleSave, loading: isSaving }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">General Settings</Text>
              <Button
                onClick={() => handleChange(isActiveBool ? "false" : "true", "isActive")}
                tone={isActiveBool ? "success" : "critical"}
              >
                {isActiveBool ? "App is ENABLED (Click to Disable)" : "App is DISABLED (Click to Enable)"}
              </Button>
              
              <Divider />
              <Text as="h2" variant="headingMd">Popup Content</Text>
              <TextField label="Heading" value={formState.heading} onChange={(v) => handleChange(v, "heading")} autoComplete="off" />
              <TextField label="Subtext" value={formState.subtext} onChange={(v) => handleChange(v, "subtext")} autoComplete="off" />
              <TextField label="YES Button Text" value={formState.yesText} onChange={(v) => handleChange(v, "yesText")} autoComplete="off" />
              <TextField label="NO Button Text" value={formState.noText} onChange={(v) => handleChange(v, "noText")} autoComplete="off" />
              
              <Divider />
              <Text as="h2" variant="headingMd">Design & Colors</Text>
              <InlineStack gap="400">
                <BlockStack gap="200">
                  <TextField type="color" label="Background Color" value={formState.backgroundColor} onChange={(v) => handleChange(v, "backgroundColor")} autoComplete="off" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "160px" }}>
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleChange(color, "backgroundColor")}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: color,
                          border: formState.backgroundColor === color ? "2px solid #000" : "1px solid #d1d5db",
                          cursor: "pointer",
                          padding: 0,
                          boxSizing: "border-box"
                        }}
                      />
                    ))}
                  </div>
                </BlockStack>
                <BlockStack gap="200">
                  <TextField type="color" label="Text Color" value={formState.textColor} onChange={(v) => handleChange(v, "textColor")} autoComplete="off" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "160px" }}>
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleChange(color, "textColor")}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: color,
                          border: formState.textColor === color ? "2px solid #000" : "1px solid #d1d5db",
                          cursor: "pointer",
                          padding: 0,
                          boxSizing: "border-box"
                        }}
                      />
                    ))}
                  </div>
                </BlockStack>
                <BlockStack gap="200">
                  <TextField type="color" label="Button Color" value={formState.buttonColor} onChange={(v) => handleChange(v, "buttonColor")} autoComplete="off" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "160px" }}>
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleChange(color, "buttonColor")}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: color,
                          border: formState.buttonColor === color ? "2px solid #000" : "1px solid #d1d5db",
                          cursor: "pointer",
                          padding: 0,
                          boxSizing: "border-box"
                        }}
                      />
                    ))}
                  </div>
                </BlockStack>
              </InlineStack>

              <Divider />
              <Text as="h2" variant="headingMd">Redirect (If NO is clicked)</Text>
              <TextField label="Redirect URL" value={formState.redirectUrl} onChange={(v) => handleChange(v, "redirectUrl")} autoComplete="off" type="url" />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
