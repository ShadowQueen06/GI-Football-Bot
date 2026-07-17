const imageCache = new Map();

function cleanName(name) {
  return String(name ?? '').trim();
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function chooseBestPage(pages, playerName) {
  const normalizedName = normalizeText(playerName);

  const pagesWithImages = pages.filter(page => page.thumbnail?.source);

  if (!pagesWithImages.length) return null;

  const exactMatch = pagesWithImages.find(page => {
    const title = normalizeText(page.title);

    return (
      title === normalizedName ||
      title.includes(normalizedName) ||
      normalizedName.includes(title)
    );
  });

  return exactMatch || pagesWithImages[0];
}

async function searchWikipediaImage(playerName) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${playerName} footballer`,
    gsrnamespace: '0',
    gsrlimit: '5',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '1000',
    redirects: '1'
  });

  const response = await fetch(
    `https://en.wikipedia.org/w/api.php?${params.toString()}`,
    {
      headers: {
        'User-Agent': 'GI-Football-Bot/1.0',
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const pages = Object.values(data.query?.pages || {});
  const bestPage = chooseBestPage(pages, playerName);

  return bestPage?.thumbnail?.source || null;
}

module.exports = async function getPlayerImage(player) {
  if (player?.imageUrl) {
    return player.imageUrl;
  }

  const playerName = cleanName(player?.name);

  if (!playerName) return null;

  if (imageCache.has(playerName)) {
    return imageCache.get(playerName);
  }

  try {
    const imageUrl = await searchWikipediaImage(playerName);

    imageCache.set(playerName, imageUrl);

    return imageUrl;
  } catch {
    imageCache.set(playerName, null);

    return null;
  }
};
