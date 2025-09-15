import { json } from "@sveltejs/kit";
async function POST({ request, platform }) {
  try {
    console.log("Share API called");
    const body = await request.json();
    console.log("Request body:", body);
    const { shareId, shareData } = body;
    if (!shareId || !shareData) {
      console.error("Missing shareId or shareData:", { shareId, shareData });
      return json({ error: "Missing shareId or shareData" }, { status: 400 });
    }
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(shareId)) {
      console.error("Invalid shareId format:", shareId);
      return json({ error: "Invalid shareId format" }, { status: 400 });
    }
    const shareKey = `share-${shareData.date}-${shareId}`;
    console.log("Storing share with key:", shareKey);
    console.log("Share data to store:", shareData);
    if (platform?.env?.PUZZLES) {
      await platform.env.PUZZLES.put(shareKey, JSON.stringify(shareData), {
        expirationTtl: 30 * 24 * 60 * 60
        // 30 days
      });
    }
    console.log("Share stored successfully");
    return json({ success: true, shareKey });
  } catch (error) {
    console.error("Error handling share API:", error);
    return json({ error: error.message }, { status: 500 });
  }
}
async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
export {
  OPTIONS,
  POST
};
