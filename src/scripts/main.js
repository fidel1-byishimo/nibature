document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-menu]');
  if (menuButton && menu) menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = contactForm.querySelector('.form-message');
    const submit = contactForm.querySelector('button[type="submit"]');
    const payload = { name: contactForm.querySelector('#name').value, email: contactForm.querySelector('#email').value, message: contactForm.querySelector('#message').value };
    submit.disabled = true; message.textContent = 'Sending your message…';
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      message.textContent = result.message; contactForm.reset();
    } catch (error) { message.textContent = error.message || 'We could not send your message. Please try again.'; }
    finally { submit.disabled = false; }
  });

  // Language switching functionality
  const langSwitcher = document.querySelector('[data-lang-switcher]');
  
  // Embedded translations (to avoid CORS issues when opening files directly)
  const translations = {
    "en": {
      "nav": {"home":"Home","about":"About","services":"Our work","blog":"Stories","gallery":"Gallery","contact":"Contact"},
      "home": {"eyebrow":"Faith in action","hero_title":"Hope that reaches beyond Sunday.","hero_description":"Nibature International Ministries walks alongside people and communities through faith, care, learning and practical support.","discover_work":"Discover our work","mission_title":"Our mission","mission_subtitle":"Growing faith. Restoring dignity. Strengthening communities.","mission_description":"We believe lasting transformation begins with people being seen, heard and equipped. Our ministry creates space for spiritual growth and practical opportunity.","meet_ministry":"Meet our ministry","what_we_do":"What we do","serving_people":"Serving people with compassion","every_programme":"Every programme is designed to bring people together and move communities forward.","community_outreach":"Community outreach","community_outreach_desc":"Practical care, family support and spiritual encouragement for people in need.","youth_empowerment":"Youth empowerment","youth_empowerment_desc":"Mentoring, skills and leadership opportunities for the next generation.","faith_counselling":"Faith & counselling","faith_counselling_desc":"Compassionate guidance for individuals and families on life's journey.","together_we_can":"Together we can","make_room":"Make room for hope.","join_community":"Join a community committed to serving with generosity, integrity and love.","get_involved":"Get involved"},
      "gallery": {"eyebrow":"Our moments","title":"Gallery","description":"Glimpses of our community, activities, and the lives we touch together."},
      "about": {"eyebrow":"Who we are","title":"Faith expressed through service.","description":"We are a ministry committed to helping people flourish in faith, dignity and purpose.","story_title":"Our story","story_1":"Nibature International Ministries began with a simple conviction: communities become stronger when faith is paired with practical care.","story_2":"We bring people together across generations, offering encouragement, learning and support where it is needed most.","values_title":"Our values","value_1":"Faith and compassion","value_2":"Integrity and service","value_3":"Community empowerment"},
      "services": {"eyebrow":"Our work","title":"Practical care. Lasting impact.","description":"We serve individuals and families through programmes that nurture hope and create opportunity.","service_1_title":"Community outreach","service_1_desc":"Food support, home visits and practical help for vulnerable households.","service_2_title":"Youth programmes","service_2_desc":"Mentoring and leadership development that helps young people thrive.","service_3_title":"Faith & counselling","service_3_desc":"Compassionate guidance for people navigating personal and family challenges.","service_4_title":"Learning workshops","service_4_desc":"Useful skills, shared knowledge and spaces for lasting growth.","get_involved_title":"Be part of the work","get_involved_desc":"Your time, prayer and generosity make this ministry possible.","get_involved_btn":"Get involved"},
      "blog": {"eyebrow":"Stories of impact","title":"Hope has a story.","description":"Read about the people, moments and acts of service that shape our ministry.","search_placeholder":"Find a story","post_1_category":"Community outreach","post_1_title":"How we spread hope","post_1_desc":"Discover how simple acts of service are creating moments of encouragement and connection in our community.","post_2_category":"Faith & counselling","post_2_title":"Growing stronger together","post_2_desc":"When people share their gifts and show up for one another, meaningful change becomes possible.","post_3_category":"Youth empowerment","post_3_title":"Making room for new leaders","post_3_desc":"Our youth programmes help young people find confidence, build skills and lead with purpose.","read_more":"Impact story","no_results":"No stories match that search."},
      "contact": {"eyebrow":"Connect with us","title":"We would love to hear from you.","description":"Ask a question, share a prayer request or find out how you can get involved.","send_message":"Send a message","name_label":"Name","email_label":"Email","message_label":"Message","send_button":"Send message","other_ways":"Other ways to reach us","email_title":"Email","get_involved_title":"Get involved","get_involved_desc":"Write to us to learn about volunteering, partnership and ministry events."},
      "footer": {"copyright":"© 2026 Nibature International Ministries. All rights reserved."}
    },
    "fr": {
      "nav": {"home":"Accueil","about":"À propos","services":"Notre travail","blog":"Histoires","gallery":"Galerie","contact":"Contact"},
      "home": {"eyebrow":"La foi en action","hero_title":"L'espoir qui va au-delà du dimanche.","hero_description":"Nibature International Ministries accompagne les personnes et les communautés à travers la foi, le soin, l'apprentissage et le soutien pratique.","discover_work":"Découvrir notre travail","mission_title":"Notre mission","mission_subtitle":"Croître dans la foi. Restaurer la dignité. Renforcer les communautés.","mission_description":"Nous croyons qu'une transformation durable commence lorsque les gens sont vus, entendus et équipés. Notre ministère crée un espace pour la croissance spirituelle et les opportunités pratiques.","meet_ministry":"Rencontrer notre ministère","what_we_do":"Ce que nous faisons","serving_people":"Servir les gens avec compassion","every_programme":"Chaque programme est conçu pour rassembler les gens et faire avancer les communautés.","community_outreach":"Action communautaire","community_outreach_desc":"Soins pratiques, soutien familial et encouragement spirituel pour les personnes dans le besoin.","youth_empowerment":"Autonomisation des jeunes","youth_empowerment_desc":"Mentorat, compétences et opportunités de leadership pour la prochaine génération.","faith_counselling":"Foi et conseil","faith_counselling_desc":"Orientation compatissante pour les individus et les familles sur le chemin de la vie.","together_we_can":"Ensemble, nous pouvons","make_room":"Faire place à l'espoir.","join_community":"Rejoignez une communauté engagée à servir avec générosité, intégrité et amour.","get_involved":"S'impliquer"},
      "gallery": {"eyebrow":"Nos moments","title":"Galerie","description":"Aperçus de notre communauté, de nos activités et des vies que nous touchons ensemble."},
      "about": {"eyebrow":"Qui nous sommes","title":"La foi exprimée par le service.","description":"Nous sommes un ministère engagé à aider les gens à s'épanouir dans la foi, la dignité et le but.","story_title":"Notre histoire","story_1":"Nibature International Ministries a commencé avec une conviction simple : les communautés deviennent plus fortes lorsque la foi est associée à des soins pratiques.","story_2":"Nous rassemblons les gens à travers les générations, offrant encouragement, apprentissage et soutien là où c'est le plus nécessaire.","values_title":"Nos valeurs","value_1":"Foi et compassion","value_2":"Intégrité et service","value_3":"Autonomisation communautaire"},
      "services": {"eyebrow":"Notre travail","title":"Soins pratiques. Impact durable.","description":"Nous servons les individus et les familles à travers des programmes qui nourrissent l'espoir et créent des opportunités.","service_1_title":"Action communautaire","service_1_desc":"Soutien alimentaire, visites à domicile et aide pratique pour les ménages vulnérables.","service_2_title":"Programmes pour les jeunes","service_2_desc":"Mentorat et développement du leadership qui aide les jeunes à s'épanouir.","service_3_title":"Foi et conseil","service_3_desc":"Orientation compatissante pour les personnes naviguant dans les défis personnels et familiaux.","service_4_title":"Ateliers d'apprentissage","service_4_desc":"Compétences utiles, connaissances partagées et espaces pour une croissance durable.","get_involved_title":"Faites partie du travail","get_involved_desc":"Votre temps, vos prières et votre générosité rendent ce ministère possible.","get_involved_btn":"S'impliquer"},
      "blog": {"eyebrow":"Histoires d'impact","title":"L'espoir a une histoire.","description":"Lisez sur les personnes, les moments et les actes de service qui façonnent notre ministère.","search_placeholder":"Trouver une histoire","post_1_category":"Action communautaire","post_1_title":"Comment nous répandons l'espoir","post_1_desc":"Découvrez comment de simples actes de service créent des moments d'encouragement et de connexion dans notre communauté.","post_2_category":"Foi et conseil","post_2_title":"Grandir plus forts ensemble","post_2_desc":"Lorsque les gens partagent leurs dons et se soutiennent mutuellement, un changement significatif devient possible.","post_3_category":"Autonomisation des jeunes","post_3_title":"Faire place aux nouveaux leaders","post_3_desc":"Nos programmes pour les jeunes aident les jeunes à trouver confiance, construire des compétences et diriger avec but.","read_more":"Histoire d'impact","no_results":"Aucune histoire ne correspond à cette recherche."},
      "contact": {"eyebrow":"Connectez avec nous","title":"Nous aimerions avoir de vos nouvelles.","description":"Posez une question, partagez une demande de prière ou découvrez comment vous pouvez vous impliquer.","send_message":"Envoyer un message","name_label":"Nom","email_label":"Email","message_label":"Message","send_button":"Envoyer le message","other_ways":"Autres moyens de nous contacter","email_title":"Email","get_involved_title":"S'impliquer","get_involved_desc":"Écrivez-nous pour en savoir sur le bénévolat, le partenariat et les événements du ministère."},
      "footer": {"copyright":"© 2026 Nibature International Ministries. Tous droits réservés."}
    },
    "sv": {
      "nav": {"home":"Hem","about":"Om oss","services":"Vårt arbete","blog":"Berättelser","gallery":"Galleri","contact":"Kontakt"},
      "home": {"eyebrow":"Tro i handling","hero_title":"Hopp som sträcker sig bortom söndagen.","hero_description":"Nibature International Ministries går bredvid människor och samhällen genom tro, omsorg, lärande och praktiskt stöd.","discover_work":"Upptäck vårt arbete","mission_title":"Vårt uppdrag","mission_subtitle":"Växande tro. Återställande av värdighet. Förstärkning av samhällen.","mission_description":"Vi tror att varaktig förändring börjar när människor ses, hörs och utrustas. Vårt tjänst skapar utrymme för andlig tillväxt och praktiska möjligheter.","meet_ministry":"Träffa vårt tjänst","what_we_do":"Vad vi gör","serving_people":"Tjäna människor med medkänsla","every_programme":"Varje program är utformat för att föra människor samman och flytta samhällen framåt.","community_outreach":"Samhällsengagemang","community_outreach_desc":"Praktisk vård, familjestöd och andlig uppmuntran för människor i behov.","youth_empowerment":"Ungdoms empowerment","youth_empowerment_desc":"Mentorskap, färdigheter och ledarskapsmöjligheter för nästa generation.","faith_counselling":"Tro och rådgivning","faith_counselling_desc":"Medkännande vägledning för individer och familjer på livets resa.","together_we_can":"Tillsammans kan vi","make_room":"Gör plats för hopp.","join_community":"Gå med i ett community engagerat att tjäna med generositet, integritet och kärlek.","get_involved":"Engagera dig"},
      "gallery": {"eyebrow":"Våra ögonblick","title":"Galleri","description":"Glimtar av vårt community, aktiviteter och de liv vi rör vid tillsammans."},
      "about": {"eyebrow":"Vilka vi är","title":"Tro uttryckt genom tjänst.","description":"Vi är ett tjänst engagerat att hjälpa människor att blomstra i tro, värdighet och syfte.","story_title":"Vår historia","story_1":"Nibature International Ministries började med en enkel övertygelse: samhällen blir starkare när tro paras med praktisk vård.","story_2":"Vi förenar människor över generationer och erbjuder uppmuntran, lärande och stöd där det behövs mest.","values_title":"Våra värderingar","value_1":"Tro och medkänsla","value_2":"Integritet och tjänst","value_3":"Community empowerment"},
      "services": {"eyebrow":"Vårt arbete","title":"Praktisk vård. Varaktig påverkan.","description":"Vi tjänar individer och familjer genom program som närar hopp och skapar möjligheter.","service_1_title":"Samhällsengagemang","service_1_desc":"Matstöd, hembesök och praktisk hjälp för sårbara hushåll.","service_2_title":"Ungdomsprogram","service_2_desc":"Mentorskap och ledarskapsutveckling som hjälper unga människor att blomstra.","service_3_title":"Tro och rådgivning","service_3_desc":"Medkännande vägledning för personer som navigerar i personliga och familjära utmaningar.","service_4_title":"Lärningsverkstäder","service_4_desc":"Användbara färdigheter, delad kunskap och utrymmen för varaktig tillväxt.","get_involved_title":"Var en del av arbetet","get_involved_desc":"Din tid, bön och generositet gör detta tjänst möjligt.","get_involved_btn":"Engagera dig"},
      "blog": {"eyebrow":"Berättelser om påverkan","title":"Hopp har en historia.","description":"Läs om människorna, ögonblicken och tjänsthandlingarna som formar vårt tjänst.","search_placeholder":"Hitta en berättelse","post_1_category":"Samhällsengagemang","post_1_title":"Hur vi sprider hopp","post_1_desc":"Upptäck hur enkla tjänsthandlingar skapar ögonblick av uppmuntran och koppling i vårt community.","post_2_category":"Tro och rådgivning","post_2_title":"Växa starkare tillsammans","post_2_desc":"När människor delar sina gåvor och visar upp för varandra blir meningsfull förändring möjlig.","post_3_category":"Ungdoms empowerment","post_3_title":"Gör plats för nya ledare","post_3_desc":"Våra ungdomsprogram hjälper unga människor att hitta självförtroende, bygga färdigheter och leda med syfte.","read_more":"Påverkansberättelse","no_results":"Inga berättelser matchar den sökningen."},
      "contact": {"eyebrow":"Kontakta oss","title":"Vi skulle älska att höra från dig.","description":"Ställ en fråga, dela en bönförfrågan eller ta reda på hur du kan engagera dig.","send_message":"Skicka ett meddelande","name_label":"Namn","email_label":"E-post","message_label":"Meddelande","send_button":"Skicka meddelande","other_ways":"Andra sätt att nå oss","email_title":"E-post","get_involved_title":"Engagera dig","get_involved_desc":"Skriv till oss för att lära dig om volontärarbete, partnerskap och tjänstevenemang."},
      "footer": {"copyright":"© 2026 Nibature International Ministries. Alla rättigheter förbehållna."}
    }
  };
  
  const savedLang = localStorage.getItem('lang') || 'en';
  applyLanguage(savedLang);
  updateLangSwitcher(savedLang);

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    const t = translations[lang];
    if (!t) return;

    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const keys = key.split('.');
      let value = t;
      keys.forEach(k => value = value?.[k]);
      if (value) el.textContent = value;
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const keys = key.split('.');
      let value = t;
      keys.forEach(k => value = value?.[k]);
      if (value) el.placeholder = value;
    });
  }

  function updateLangSwitcher(currentLang) {
    if (langSwitcher) {
      langSwitcher.value = currentLang;
    }
  }

  if (langSwitcher) {
    langSwitcher.addEventListener('change', (e) => {
      const newLang = e.target.value;
      localStorage.setItem('lang', newLang);
      applyLanguage(newLang);
      updateLangSwitcher(newLang);
    });
  }
});
