import { GoogleSpreadsheet } from "google-spreadsheet";
import { Pair, apiKey, loadSheet } from "../sheet-importer";
import { Alg, SimplifyOptions } from "cubing/alg";
import { cube3x3x3 } from "cubing/puzzles";

const letterScheme = {
  U: {
    B: "A",
    R: "B",
    F: "C",
    L: "D",

    BL: "A",
    BR: "B",
    FR: "C",
    FL: "D",
  },
  F: {
    U: "E",
    R: "F",
    D: "G",
    L: "H",

    UL: "E",
    UR: "F",
    DR: "G",
    DL: "H",
  },
  R: {
    U: "I",
    B: "J",
    D: "K",
    F: "L",

    UF: "I",
    UB: "J",
    DB: "K",
    DF: "L",
  },
  B: {
    U: "M",
    L: "N",
    D: "O",
    R: "P",

    UR: "M",
    UL: "N",
    DL: "O",
    DR: "P",
  },
  L: {
    U: "Q",
    F: "R",
    D: "S",
    B: "T",

    UB: "Q",
    UF: "R",
    DF: "S",
    DB: "T",
  },
  D: {
    F: "U",
    R: "V",
    B: "W",
    L: "X",

    LF: "U",
    RF: "V",
    RB: "W",
    LB: "X",
  },
} as { [key: string]: { [key: string]: string } };

const tommySheet = '10Zqas9sWnBFo0hgL1Q8WX2NJUU5-GKG-j2jys70BBhY';

const doc = new GoogleSpreadsheet(tommySheet, { apiKey: apiKey! });
await doc.loadInfo(true);

type Set = "corner" | "edge";

const SET: Set = process.env.SET as Set || "corner";

type AlgData = {
  Position: string;
  Alg: string;
  Commutator: string;
};

const tommyPairs = (await doc.sheetsByTitle[SET].getRows<AlgData>()).map(row => row.toObject()).map(data => {
  if (!data.Position?.startsWith(SET === 'corner' ? "UFR-" : "UF-")) return;

  const position = data.Position.split("-");
  const first = position[1];
  const firstFace = letterScheme[first.substring(0, 1)]
  const firstLetter = firstFace[first.substring(1)] ?? firstFace[first.substring(1).split("").reverse().join("")];
  
  const second = position[2]; // UR
  const secondFace = letterScheme[second.substring(0, 1)]
  const secondLetter = secondFace[second.substring(1)] ?? secondFace[second.substring(1).split("").reverse().join("")];

  return {
    first: firstLetter,
    second: secondLetter,
    value: data.Alg,
    comm: data.Commutator,
  } as Pair & { comm: string };
});

const mySheet = await loadSheet(process.env.GOOGLE_SHEET_ID!, SET == 'corner' ? "UFR Corners" : "UF Edges");
const myPairs = mySheet.pairs;

function normaliseAlg(alg: string, invert: boolean) {
  const settings = {
    depth: 10000,
    cancel: { puzzleSpecificModWrap: "canonical-centered",  },
    puzzleLoader: cube3x3x3
  } as SimplifyOptions;

  let cubingAlg = new Alg(alg)
    .expand()
    .experimentalSimplify({depth: 10000, cancel: true})
    .experimentalSimplify(settings);

  if (invert) {
    cubingAlg = cubingAlg.invert();
  }

  let algString = cubingAlg
    .toString()
    .replaceAll("2'", "2");
  let tempString: string;
  do {
    tempString = algString;
    algString = algString
      .replace(/(D['2]*)\s(U['2]*)/, (match, group1, group2) => {
        return `${group2} ${group1}`;
      })
      .replace(/([ufrbd])['2]*/, (match, group1) => {
        return match.replace(group1, group1.toUpperCase()+"w");
      });
  } while (tempString !== algString);
  


  return algString;
}

const different: {
  case: string;
  tommy: string;
  mine: string;
  comm: string;
}[] = [];

tommyPairs.forEach(pair => {
  if (!pair) return;
  const myPair = myPairs.find(p => p.first.startsWith(pair.first) && p.second.startsWith(pair.second));
  let myAlg: string;

  if (!myPair) {
    const myRevPair = myPairs.find(p => p.first.startsWith(pair.second) && p.second.startsWith(pair.first));
    if (!myRevPair) {
      console.log(`Missing pair: ${pair.first}${pair.second}`);
      throw null;
    }
    
    myAlg = normaliseAlg(myRevPair.value, true);
  } else {
    myAlg = normaliseAlg(myPair.value, false);
  }

  const tommyAlg = normaliseAlg(pair.value, false);
  
  if (myAlg !== tommyAlg) {
    different.push({
      case: `${pair.first}${pair.second}`,
      tommy: tommyAlg,
      mine: myAlg,
      comm: pair.comm,
    });
  }
});

console.log("Different: " + different.length);

different.forEach(d => {
  console.log(`${d.case}: ${d.comm}`);
  console.log(`Tommy: ${d.tommy}`);
  console.log(`Mine: ${d.mine}`);
  console.log();
});