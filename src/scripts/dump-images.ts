import { loadSheet } from "../sheet-importer";
import { existsSync, mkdirSync } from "fs";

if (!process.env.GOOGLE_SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

const imagesSheet = await loadSheet(process.env.GOOGLE_SHEET_ID, "Images");

if (!existsSync('out')) {
  mkdirSync('out');
}

const exclusions: string[] = [];
const filtered = imagesSheet.pairs.filter(p => !exclusions.includes(p.first) && !exclusions.includes(p.second));

console.log(`Writing ${filtered.length} pairs...`)

await Bun.write("out/images.csv", filtered.map(p => p.first+p.second+","+p.value).join("\n"));