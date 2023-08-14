// EO,"[Uw l: [l u' l', U']]",Elmo,Ufr X-Centers,Uw l l u' l' U' l u l' U l' Uw',Ufr_X-Centers::E_-_(Ful) Ufr_X-Centers::O_-_(Bdl)

import { Alg } from "cubing/alg";

function fixForAlg(input: string): string {
  return input.replaceAll(/([ufrbld])/g, (_, p1) => '2' + p1.toUpperCase());
}

function fixForAlgReverse(input: string): string {
  return input.replaceAll(/2([UFRBLD])/g, (_, p1) => p1.toLowerCase());
}

function expand(input: Alg): Alg {
  let tempAlg = input;
  for (let index = 0; index < 5; index++) {
    tempAlg = tempAlg.expand().experimentalSimplify({ cancel: {
      directional: 'none',
    }}).experimentalSimplify({ cancel: true });
  }
  return tempAlg;
}

const comm = "[Uw l: [l u' l', U']]";
console.log("Fixed: " + fixForAlg(comm));

const alg = Alg.fromString(fixForAlg(comm));
console.log("Alg:   " + alg.toString());

const expanded = expand(alg);
console.log("Expan: " + expanded.toString());

console.log("Rever:   " + fixForAlgReverse(expanded.toString()));