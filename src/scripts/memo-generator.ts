import { argv } from "bun";
import { loadSheet } from "../sheet-importer";
import process from "process";

if (!process.env.GOOGLE_SHEET_ID) throw new Error("Missing GOOGLE_SHEET_ID env var");

const imagesSheet = await loadSheet(process.env.GOOGLE_SHEET_ID, "Images");

function genMemo(inputMemo: string): string[] {
  const input = inputMemo.replaceAll(' ', '').toUpperCase().split("");
  const memo = [];
  for (let i = 0; i < input.length; i += 2) {
    const letter1 = input[i];
    const letter2 = input[i + 1] ?? 'Z';
    if (!letter1) continue;
    
    const image = imagesSheet.pairs.find(pair => pair.first === letter1 && pair.second === letter2) ?? {
      value: "???",
    };

    memo.push(`${input.length < 3 ? "" : `(${i/2 + 1}) `}${letter1}${letter2}: ${image.value}`);
  }
  return memo;
}

if (!argv.find(arg => arg === "--server")) {
  
  if (argv.find(arg => arg === "--once")) {
    const memo = argv[argv.length - 1];
    console.log(genMemo(memo).join("\n"));
    process.exit(0);
  }
    
  const prompt = "Enter Memo: ";
  process.stdout.write(prompt);
  for await (const line of console) {
    
    const memo = genMemo(line);
    
    console.log(memo.join("\n"));
    process.stdout.write(prompt);
  }
}

console.log("Listening on port 1337");
Bun.serve({
  port: 1337,
  async fetch(req) {
    const memo = await req.text();
    return new Response(genMemo(memo).join("\n"), {
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
});
