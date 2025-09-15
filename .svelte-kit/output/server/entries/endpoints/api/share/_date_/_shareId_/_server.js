import { json, error } from "@sveltejs/kit";
async function GET({ params, platform }) {
  try {
    const { date, shareId } = params;
    console.log("Share API called with params:", { date, shareId });
    console.log("Platform available:", !!platform);
    console.log("Platform env available:", !!platform?.env);
    console.log("PUZZLES binding available:", !!platform?.env?.PUZZLES);
    if (!platform?.env?.PUZZLES) {
      console.log("KV storage not available - returning mock data for development");
      return json({
        shareData: {
          date,
          time: "01:23.456",
          hints: 1,
          isRevealed: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    }
    const shareKey = `share-${date}-${shareId}`;
    console.log("Looking for share key:", shareKey);
    const shareData = await platform.env.PUZZLES.get(shareKey, "json");
    console.log("Share data found:", shareData);
    if (!shareData) {
      console.error("Share not found for key:", shareKey);
      throw error(404, "Share not found");
    }
    console.log("Returning share data");
    return json({
      shareData
    });
  } catch (err) {
    console.error("Error handling share API:", err);
    if (err.status) {
      throw err;
    }
    throw error(500, "Error loading share");
  }
}
export {
  GET
};
