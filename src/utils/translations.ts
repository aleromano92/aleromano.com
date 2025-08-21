import type { SupportedLanguage } from '../types/i18n';

export interface PageTranslations {
  pageTitle: string;
  pageDescription: string;
  tagline: string;
  intro: string;
  readMore: string;
  readMoreLink: string;
  stayUpdated: string;
  followTwitter: string;
  subscribeRss: string;
  needHelp: string;
  letsTalk: string;
  profilePicAlt: string;
}

export const homeTranslations: Record<SupportedLanguage, PageTranslations> = {
  en: {
    pageTitle: 'Home',
    pageDescription: "I'm a Software Engineering Manager addicted to details and obsessed with how things work: from Cloud services to human relationships. Since my first Hello World in RPG Maker, I have come to believe that being an Engineer is much more than coding.",
    tagline: 'Insightful. Precise. Human.',
    intro: "I'm a Software Engineering Manager addicted to details and obsessed with how things work: from Cloud services to human relationships. Since my first Hello World in RPG Maker, I have come to believe that being an Engineer is much more than coding.",
    readMore: 'Wanna know more about me?',
    readMoreLink: 'Read my story.',
    stayUpdated: 'Wanna stay updated?',
    followTwitter: 'Follow @_aleromano',
    subscribeRss: 'subscribe to my RSS feed.',
    needHelp: 'Need help launching your startup, scaling your engineering team, or growing as a software engineer?',
    letsTalk: "Let's talk.",
    profilePicAlt: 'Alessandro Romano profile picture',
  },
  it: {
    pageTitle: 'Home',
    pageDescription: "Sono un Engineering Manager ossessionato dai dettagli e da come funzionano le cose: dai servizi Cloud alle relazioni umane. Dal mio primo Hello World in RPG Maker, sono arrivato a credere che essere un Ingegnere sia molto più che programmare.",
    tagline: 'Perspicace. Preciso. Umano.',
    intro: "Sono un Engineering Manager ossessionato dai dettagli e da come funzionano le cose: dai servizi Cloud alle relazioni umane. Dal mio primo Hello World in RPG Maker, sono arrivato a credere che essere un Ingegnere sia molto più che programmare.",
    readMore: 'Vuoi saperne di più su di me?',
    readMoreLink: 'Leggi la mia storia.',
    stayUpdated: 'Vuoi rimanere aggiornato?',
    followTwitter: 'Segui @_aleromano',
    subscribeRss: 'iscriviti al mio feed RSS.',
    needHelp: 'Hai bisogno di aiuto per lanciare la tua startup, far crescere il tuo team di ingegneria, o crescere come ingegnere del software?',
    letsTalk: 'Parliamone.',
    profilePicAlt: 'Foto profilo di Alessandro Romano',
  },
};

export function getHomeTranslations(language: SupportedLanguage): PageTranslations {
  return homeTranslations[language];
}