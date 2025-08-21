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

export interface AboutTranslations {
  pageTitle: string;
  pageDescription: string;
  tagline: string;
  intro1: string;
  intro2: string;
  intro3: string;
  stayUpdated: string;
  followTwitter: string;
  subscribeRss: string;
  needHelp: string;
  letsTalk: string;
  profilePicAlt: string;
}

export const aboutTranslations: Record<SupportedLanguage, AboutTranslations> = {
  en: {
    pageTitle: 'About',
    pageDescription: 'Engineering Manager at Mollie, father of two amazing kids, and funny lovely husband. Addicted to details and obsessed with how things work: from Cloud services to human relationships.',
    tagline: 'Insightful. Precise. Human.',
    intro1: "I'm addicted to details and obsessed with how things work: from Cloud services to human relationships. Since my first Hello World in RPG Maker, I have come to believe that being an Engineer is much more than coding.",
    intro2: "I'm currently an Engineering Manager at Mollie, where I focus on helping teams collaborate effectively and deliver impactful solutions.",
    intro3: "When I'm not fostering great engineering culture, you can find me in Busto Arsizio (near Milan's Malpensa airport) where I'm a proud father of two amazing kids and a funny lovely husband.",
    stayUpdated: 'Wanna stay updated?',
    followTwitter: 'Follow @_aleromano',
    subscribeRss: 'subscribe to my RSS feed.',
    needHelp: 'Need help launching your startup, scaling your engineering team, or growing as a software engineer?',
    letsTalk: "Let's talk.",
    profilePicAlt: 'Alessandro Romano profile picture',
  },
  it: {
    pageTitle: 'Chi Sono',
    pageDescription: 'Engineering Manager a Mollie, padre di due bambini fantastici e marito divertente e affettuoso. Ossessionato dai dettagli e da come funzionano le cose: dai servizi Cloud alle relazioni umane.',
    tagline: 'Perspicace. Preciso. Umano.',
    intro1: "Sono ossessionato dai dettagli e da come funzionano le cose: dai servizi Cloud alle relazioni umane. Dal mio primo Hello World in RPG Maker, sono arrivato a credere che essere un Ingegnere sia molto più che programmare.",
    intro2: "Attualmente sono Engineering Manager a Mollie, dove mi concentro sull'aiutare i team a collaborare efficacemente e fornire soluzioni di impatto.",
    intro3: "Quando non sto promuovendo un'ottima cultura ingegneristica, mi trovi a Busto Arsizio (vicino all'aeroporto di Milano Malpensa) dove sono un orgoglioso padre di due bambini fantastici e un marito divertente e affettuoso.",
    stayUpdated: 'Vuoi rimanere aggiornato?',
    followTwitter: 'Segui @_aleromano',
    subscribeRss: 'iscriviti al mio feed RSS.',
    needHelp: 'Hai bisogno di aiuto per lanciare la tua startup, far crescere il tuo team di ingegneria, o crescere come ingegnere del software?',
    letsTalk: 'Parliamone.',
    profilePicAlt: 'Foto profilo di Alessandro Romano',
  },
};

export function getAboutTranslations(language: SupportedLanguage): AboutTranslations {
  return aboutTranslations[language];
}

export interface ContactTranslations {
  pageTitle: string;
  pageDescription: string;
  formLabels: {
    reason: string;
    blogPostTitle: string;
    name: string;
    email: string;
    message: string;
  };
  reasonOptions: {
    select: string;
    problems: string;
    consultancy: string;
    mentoring: string;
    job: string;
    blogpost: string;
    general: string;
  };
  buttons: {
    submit: string;
    submitting: string;
    openGitHubIssue: string;
  };
  prefillMessages: {
    consultancy: string;
    mentoring: string;
    job: string;
    blogpost: string;
  };
  alerts: {
    fillRequired: string;
    success: string;
    error: string;
    networkError: string;
  };
}

export const contactTranslations: Record<SupportedLanguage, ContactTranslations> = {
  en: {
    pageTitle: 'Contact',
    pageDescription: 'Get in touch with Alessandro Romano for consultancy, mentoring, job opportunities, or general inquiries about software engineering and leadership.',
    formLabels: {
      reason: 'Reason',
      blogPostTitle: 'Blog Post Title',
      name: 'Name',
      email: 'Email',
      message: 'Message',
    },
    reasonOptions: {
      select: 'Select a reason...',
      problems: 'Problems on the website',
      consultancy: 'Consultancy request',
      mentoring: 'Mentoring',
      job: 'Job opportunities',
      blogpost: 'Blog Post Feedback',
      general: 'General inquiry',
    },
    buttons: {
      submit: 'Submit',
      submitting: 'Submitting...',
      openGitHubIssue: 'Open GitHub Issue',
    },
    prefillMessages: {
      consultancy: "Please, in order to make good use of your time and mine, please don't contact me before reviewing at least my LinkedIn profile (https://www.linkedin.com/in/aleromano92/). If you think I could be a good help for your company, write here why you think so and leave me a link to get more details",
      mentoring: 'Please, in order to make good use of your time and mine, write here why you think I could be of any help and I will happily do my best to help you',
      job: "please, in order to make good use of your time and mine, please don't contact me before reviewing at least my LinkedIn profile (https://www.linkedin.com/in/aleromano92/). If you think I could be a good fit for your company, write here why you think so and leave me a link to get more details",
      blogpost: 'Please share your thoughts, feedback, or questions about this blog post. I appreciate constructive feedback and engaging discussions!',
    },
    alerts: {
      fillRequired: 'Please fill in all required fields: Name, Email, and Message.',
      success: 'Your message has been sent successfully!',
      error: 'An error occurred. Please try again.',
      networkError: 'An unexpected error occurred. Please check your connection and try again.',
    },
  },
  it: {
    pageTitle: 'Contatti',
    pageDescription: 'Contatta Alessandro Romano per consulenza, mentoring, opportunità di lavoro o domande generali su ingegneria del software e leadership.',
    formLabels: {
      reason: 'Motivo',
      blogPostTitle: 'Titolo del Post',
      name: 'Nome',
      email: 'Email',
      message: 'Messaggio',
    },
    reasonOptions: {
      select: 'Seleziona un motivo...',
      problems: 'Problemi sul sito web',
      consultancy: 'Richiesta di consulenza',
      mentoring: 'Mentoring',
      job: 'Opportunità di lavoro',
      blogpost: 'Feedback su articolo',
      general: 'Domanda generale',
    },
    buttons: {
      submit: 'Invia',
      submitting: 'Invio in corso...',
      openGitHubIssue: 'Apri Issue su GitHub',
    },
    prefillMessages: {
      consultancy: "Per favore, per sfruttare al meglio il tuo tempo e il mio, non contattarmi prima di aver visto almeno il mio profilo LinkedIn (https://www.linkedin.com/in/aleromano92/). Se pensi che potrei essere d'aiuto per la tua azienda, scrivi qui perché lo pensi e lasciami un link per maggiori dettagli",
      mentoring: 'Per favore, per sfruttare al meglio il tuo tempo e il mio, scrivi qui perché pensi che potrei esserti d\'aiuto e farò del mio meglio per aiutarti',
      job: "Per favore, per sfruttare al meglio il tuo tempo e il mio, non contattarmi prima di aver visto almeno il mio profilo LinkedIn (https://www.linkedin.com/in/aleromano92/). Se pensi che potrei essere adatto per la tua azienda, scrivi qui perché lo pensi e lasciami un link per maggiori dettagli",
      blogpost: 'Condividi i tuoi pensieri, feedback o domande su questo articolo. Apprezzo feedback costruttivi e discussioni interessanti!',
    },
    alerts: {
      fillRequired: 'Compila tutti i campi obbligatori: Nome, Email e Messaggio.',
      success: 'Il tuo messaggio è stato inviato con successo!',
      error: 'Si è verificato un errore. Riprova.',
      networkError: 'Si è verificato un errore imprevisto. Controlla la connessione e riprova.',
    },
  },
};

export function getContactTranslations(language: SupportedLanguage): ContactTranslations {
  return contactTranslations[language];
}