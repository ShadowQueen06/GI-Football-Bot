const sharp = require('sharp');
const getPlayerImage = require('./playerImage');

const styles = {
  Common: ['#2f3542', '#57606f', '#dfe4ea'],
  Rare: ['#0b4f9c', '#2e86de', '#d6eaff'],
  Epic: ['#5f27cd', '#8e44ad', '#f3d9ff'],
  Legendary: ['#b8860b', '#f1c40f', '#fff3b0'],
  Icon: ['#111827', '#f8fafc', '#facc15']
};

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getInitials(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() || '')
    .join('');
}

async function fetchImage(url) {
  if (!url) return null;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GI-Football-Bot/1.0',
        Accept: 'image/*'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type');

    if (contentType && !contentType.startsWith('image/')) {
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

module.exports = async function createCard(player) {
  const [primary, secondary, accent] =
    styles[player.rarity] || styles.Common;

  const imageUrl = await getPlayerImage(player);
  const photo = await fetchImage(imageUrl);

  const backgroundSvg = `
    <svg width="720" height="1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>

      <rect
        width="720"
        height="1000"
        rx="54"
        fill="url(#background)"
      />

      <rect
        x="20"
        y="20"
        width="680"
        height="960"
        rx="42"
        fill="none"
        stroke="${accent}"
        stroke-width="8"
      />

      <rect
        x="85"
        y="185"
        width="550"
        height="500"
        rx="42"
        fill="#00000055"
      />
    </svg>
  `;

  const detailsSvg = `
    <svg width="720" height="1000" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="110"
        cy="110"
        r="72"
        fill="#00000099"
        stroke="${accent}"
        stroke-width="4"
      />

      <text
        x="110"
        y="128"
        text-anchor="middle"
        font-size="58"
        font-weight="900"
        fill="white"
        font-family="Arial"
      >
        ${escapeXml(player.rating)}
      </text>

      <rect
        x="532"
        y="54"
        width="132"
        height="72"
        rx="24"
        fill="#00000099"
      />

      <text
        x="598"
        y="103"
        text-anchor="middle"
        font-size="34"
        font-weight="800"
        fill="white"
        font-family="Arial"
      >
        ${escapeXml(player.position)}
      </text>

      ${
        photo
          ? ''
          : `
            <circle
              cx="360"
              cy="425"
              r="150"
              fill="#ffffff22"
              stroke="${accent}"
              stroke-width="5"
            />

            <text
              x="360"
              y="465"
              text-anchor="middle"
              font-size="130"
              font-weight="900"
              fill="${accent}"
              font-family="Arial"
            >
              ${escapeXml(getInitials(player.name))}
            </text>
          `
      }

      <rect
        x="85"
        y="185"
        width="550"
        height="500"
        rx="42"
        fill="none"
        stroke="${accent}"
        stroke-width="5"
      />

      <text
        x="360"
        y="760"
        text-anchor="middle"
        font-size="52"
        font-weight="900"
        fill="white"
        font-family="Arial"
      >
        ${escapeXml(String(player.name).toUpperCase())}
      </text>

      <text
        x="360"
        y="818"
        text-anchor="middle"
        font-size="30"
        font-weight="700"
        fill="${accent}"
        font-family="Arial"
      >
        ${escapeXml(player.club)}
      </text>

      <text
        x="360"
        y="862"
        text-anchor="middle"
        font-size="27"
        fill="white"
        font-family="Arial"
      >
        ${escapeXml(player.nation)}
      </text>

      <rect
        x="175"
        y="900"
        width="370"
        height="56"
        rx="28"
        fill="#00000099"
      />

      <text
        x="360"
        y="939"
        text-anchor="middle"
        font-size="27"
        font-weight="800"
        fill="${accent}"
        font-family="Arial"
      >
        GI FOOTBALL • ${escapeXml(
          String(player.rarity).toUpperCase()
        )}
      </text>
    </svg>
  `;

  const layers = [];

  if (photo) {
    try {
      const photoMask = Buffer.from(`
        <svg width="550" height="500" xmlns="http://www.w3.org/2000/svg">
          <rect
            width="550"
            height="500"
            rx="42"
            fill="white"
          />
        </svg>
      `);

      const processedPhoto = await sharp(photo)
        .resize(550, 500, {
          fit: 'cover',
          position: 'top'
        })
        .composite([
          {
            input: photoMask,
            blend: 'dest-in'
          }
        ])
        .png()
        .toBuffer();

      layers.push({
        input: processedPhoto,
        left: 85,
        top: 185
      });
    } catch (error) {
      console.error(
        `Failed to process image for ${player.name}:`,
        error.message
      );
    }
  }

  layers.push({
    input: Buffer.from(detailsSvg),
    left: 0,
    top: 0
  });

  return sharp(Buffer.from(backgroundSvg))
    .composite(layers)
    .png()
    .toBuffer();
};
