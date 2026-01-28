import GamesGrid from "./components/GamesGrid";

export default async function ProviderGamesPage({ params }) {
  const { brandId } = await params;
  
  let games = [];
  let brandName = brandId.toString().toUpperCase();
  
  // For local games
  if (brandId === 'crash' || brandId === 'dice') {
    games = [
      { 
        id: brandId, 
        name: `${brandId.charAt(0).toUpperCase() + brandId.slice(1)} Game`, 
        image: `/games/${brandId}.png`,
        gameCode: brandId,
        category: 'Local Game'
      }
    ];
  } 
  // For API-based games (JILI, PG, etc.)
  else {
    try {
      console.log(`Fetching games for brand_id: ${brandId}`);
      
      // Fetch from iGamingAPIs
      const apiUrl = `https://igamingapis.com/provider/brands.php?brand_id=${brandId}`;
      console.log(`Fetching from: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`API Response for brand ${brandId}:`, data.status);
      
      if (data.status && Array.isArray(data.games)) {
        games = data.games;
        console.log(`Successfully fetched ${games.length} games for brand ${brandId}`);
      } else {
        console.error('Unexpected API response:', data);
        games = [];
      }
      
    } catch (error) {
      console.error(`Error fetching games for brand ${brandId}:`, error);
      
      // Fallback: Empty array
      games = [];
    }
  }
  
  return <GamesGrid brandId={brandId} games={games} />;
}