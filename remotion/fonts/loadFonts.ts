import { loadFont as loadNotoSerifJP } from '@remotion/google-fonts/NotoSerifJP';
import { loadFont as loadCormorantGaramond } from '@remotion/google-fonts/CormorantGaramond';
import { loadFont as loadShipporiMincho } from '@remotion/google-fonts/ShipporiMincho';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadZenMaruGothic } from '@remotion/google-fonts/ZenMaruGothic';

export const notoSerifJP = loadNotoSerifJP('normal', {
  weights: ['300', '400', '500'],
  subsets: ['japanese'],
  ignoreTooManyRequestsWarning: true,
});

export const cormorantGaramond = loadCormorantGaramond('normal', {
  weights: ['400', '500', '600'],
  ignoreTooManyRequestsWarning: true,
});

export const shipporiMincho = loadShipporiMincho('normal', {
  weights: ['400', '500'],
  subsets: ['japanese'],
  ignoreTooManyRequestsWarning: true,
});

export const inter = loadInter('normal', {
  weights: ['400', '500', '600'],
  ignoreTooManyRequestsWarning: true,
});

export const zenMaruGothic = loadZenMaruGothic('normal', {
  weights: ['400', '500'],
  subsets: ['japanese'],
  ignoreTooManyRequestsWarning: true,
});

export type FontPairId = 'A' | 'B' | 'C';

export const fontPairs = {
  A: {
    japanese: notoSerifJP.fontFamily,
    english: cormorantGaramond.fontFamily,
  },
  B: {
    japanese: shipporiMincho.fontFamily,
    english: inter.fontFamily,
  },
  C: {
    japanese: zenMaruGothic.fontFamily,
    english: inter.fontFamily,
  },
} as const;
