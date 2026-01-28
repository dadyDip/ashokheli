import axios from "axios";

const PROVIDERS_API = "https://igamingapis.com/provider/";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brand_id');
    
    if (brandId) {
      // Fetch games for specific brand
      const response = await axios.get(
        `https://igamingapis.com/provider/brands.php?brand_id=${brandId}`
      );
      return Response.json(response.data);
    } else {
      // Fetch all providers
      const response = await axios.get(PROVIDERS_API);
      return Response.json(response.data);
    }
  } catch (error) {
    console.error("Error fetching games:", error);
    return Response.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}