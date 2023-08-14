import { Sheet, loadSheet } from "../sheet-importer";
import { existsSync, mkdirSync } from "fs";
import { writeToString } from '@fast-csv/format';
import { argv } from "bun";
import { Alg } from "cubing/alg";

if (!process.env.GOOGLE_SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

let imagesSheet, xcentersSheet: Sheet;
const cacheFolderExists = existsSync("cache");
if (argv.find(arg => arg === "--cache") && cacheFolderExists) {
  imagesSheet = await Bun.file("cache/images.json").json() as Sheet;
  xcentersSheet = await Bun.file("cache/xcenters.json").json() as Sheet;
} else {
  imagesSheet = await loadSheet(process.env.GOOGLE_SHEET_ID, "Images");
  xcentersSheet = await loadSheet(process.env.GOOGLE_SHEET_ID, "Ubl XCenters");

  if (!cacheFolderExists) {
    mkdirSync("cache");
  }
  await Bun.write("cache/images.json", JSON.stringify(imagesSheet, null, 2));
  await Bun.write("cache/xcenters.json", JSON.stringify(xcentersSheet, null, 2));
}

const data: {
  pair: string;
  comm: string;
  image: string;
  piece: string;
  expanded: string;
  tags: string;
}[] = [];

function fixForAlg(input: string): string {
  return input.replaceAll(/([ufrbld])/g, (_, p1) => '2' + p1.toUpperCase());
}

function fixForAlgReverse(input: string): string {
  return input
    .replaceAll(/2([UFRBLD])/g, (_, p1) => p1.toLowerCase())
    .replaceAll('3', '\'')
    .replaceAll('\'\'', '');
}

function expand(input: Alg): Alg {
  let tempAlg = input;
  for (let index = 0; index < 5; index++) {
    tempAlg = tempAlg
    .expand()
    .experimentalSimplify({ cancel: {
      directional: 'none',
    }})
    .experimentalSimplify({ 
      cancel: true,
    });
  }
  return tempAlg;
}

for (const pair of xcentersSheet.pairs) {
  const first = pair.first.substring(0, 1);
  const second = pair.second.substring(0, 1);

  const imagePair = imagesSheet.pairs.find(p => p.first === first && p.second === second)!;

  const alg = Alg.fromString(fixForAlg(pair.value));

  data.push({ 
    pair: first + second, 
    comm: fixForAlgReverse(alg.toString()),
    image: imagePair.value, 
    piece: "Ufr X-Centers",
    expanded: fixForAlgReverse(expand(alg).toString()),
    tags: `Ufr_X-Centers::${pair.first.replaceAll(' ', '_')} Ufr_X-Centers::${pair.second.replaceAll(' ', '_')}` });

  if (data.find(d => d.pair === second + first)) continue;

  const inverseImagePair = imagesSheet.pairs.find(p => p.first === second && p.second === first)!;
  data.push({
    pair: second + first,
    comm: fixForAlgReverse(alg.invert().toString()),
    image: inverseImagePair.value,
    piece: "Ufr X-Centers",
    expanded: fixForAlgReverse(expand(alg.invert()).toString()),
    tags: `Ufr_X-Centers::${pair.second.replaceAll(' ', '_')} Ufr_X-Centers::${pair.first.replaceAll(' ', '_')}` });
}

if (!existsSync('out')) {
  mkdirSync('out');
}

await Bun.write("out/xcenters.csv", await writeToString(data, { headers: false }));
