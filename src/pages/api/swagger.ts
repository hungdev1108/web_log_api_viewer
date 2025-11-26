import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(
      "https://demo-api.v-hoadon.com/swagger/v1/swagger.json"
      // "http://192.168.1.30:15000/swagger/v1/swagger.json"
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();

    // Set CORS headers để client có thể fetch từ API route này
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Content-Type", "application/json");

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching swagger JSON:", error);
    return res.status(500).json({
      error: "Failed to fetch swagger JSON",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
