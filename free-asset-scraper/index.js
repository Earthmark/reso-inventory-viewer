const undici = require("undici");
const fs = require("fs");

const pool = new undici.Pool("https://api.resonite.com", {
  connections: 10,
});

async function getAssetMetadata(assetId) {
  const { body, statusCode } = await pool.request({
    path: `/assets/${assetId}`,
    method: "GET",
  });
  if (statusCode != "200") {
    throw new Error(`Non-success status code: ${statusCode}`)
  }
  return await body.json();
}

function loadManifest(path) {
  const manifest = JSON.parse(fs.readFileSync(path));

  const assets = new Set();

  manifest.forEach((asset) => {
    asset.assetManifest.forEach((asset) => assets.add(asset.hash));
  });

  return assets;
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    console.error("No manifest file provided to scrape for free assets.");
    return;
  }

  const assets = loadManifest(manifestPath);

  const assetMetadata = await Promise.all([...assets].map(async (asset, index) => {
    try {
        const metadata = await getAssetMetadata(asset);

        if ((index % 100) == 0) {
            console.log(`Assets checked: ${index}/${assets.size}`)
        }
        return metadata;
    }
    catch (e) {
        console.log(`Error reading asset ${asset}`, e);
        return { assetHash: asset, free: false };
    }
  }))

  const freeAssets = assetMetadata.filter(met => met.free).map(met => met.assetHash);

  fs.writeFileSync("../src/free-assets.json", JSON.stringify(freeAssets));
}

main();
