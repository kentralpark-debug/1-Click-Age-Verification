import { Page, Layout, Card, Text, BlockStack, InlineStack, TextField, Button, Divider } from "@shopify/polaris";
import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

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
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    ...setting,
    isActive: String(setting.isActive)
  });

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
              <Text as="h2" variant="headingMd">Design & Colors (HEX format)</Text>
              <InlineStack gap="400">
                <TextField label="Background Color" value={formState.backgroundColor} onChange={(v) => handleChange(v, "backgroundColor")} autoComplete="off" />
                <TextField label="Text Color" value={formState.textColor} onChange={(v) => handleChange(v, "textColor")} autoComplete="off" />
                <TextField label="Button Color" value={formState.buttonColor} onChange={(v) => handleChange(v, "buttonColor")} autoComplete="off" />
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