import fs from 'fs';
import path from 'path';

const translations = {
  "LandingPage": {
    "en": {
      "demoFounder": "Founder Login",
      "demoInvestor": "Investor Login",
      "demoAdmin": "Admin Login",
      "loadingDemo": "Loading demo access...",
      "titlePart1": "Turn startup chaos",
      "titlePart2": "into a flawless system.",
      "subtitle": "A unified operating system connecting founders and investors. Structured data, AI analytics, and a transparent fundraising process.",
      "accessFounder": "Access Founder Dashboard",
      "accessInvestor": "Access Investor Dashboard",
      "accessAdmin": "Access Admin Dashboard",
      "enterSystem": "Enter System",
      "endOfChaosTitle": "The end of Excel and chaos",
      "endOfChaosDesc": "90% of startups fail due to unstructured processes and poor investor communication. We solve this.",
      "feature1Title": "Fragmented Data",
      "feature1Desc": "No more lost links to Notion, Google Docs, and Excel models. Everything in one place.",
      "feature2Title": "Unclear Status",
      "feature2Desc": "Investors always see the current status of the startup, its traction, and readiness for a round.",
      "feature3Title": "Long Due Diligence",
      "feature3Desc": "A standardized data room reduces startup verification time by 3 times.",
      "forFounders": "FOR FOUNDERS",
      "founderTitle": "Focus on product, not spreadsheets",
      "founderDesc": "Founder OS gives you a step-by-step action plan. From idea validation to closing a funding round.",
      "founderList1": "AI analysis of your Pitch Deck with recommendations",
      "founderList2": "Automatic calculation of financial models and metrics",
      "founderList3": "Direct access to verified investors",
      "founderList4": "Investment Readiness tracking",
      "forInvestors": "FOR INVESTORS",
      "investorTitle": "Quality Pipeline, not email spam",
      "investorDesc": "Get access only to startups that have passed basic verification and match your investment focus.",
      "investorList1": "Unified metric presentation format",
      "investorList2": "Convenient Data Room with all documents",
      "investorList3": "Early risk detection thanks to AI scoring",
      "investorList4": "Portfolio synchronization and deal pipeline",
      "footerRights": "© 2026 UNTITLED Ecosystem. All rights reserved."
    },
    "ru": {
      "demoFounder": "Вход для Фаундеров",
      "demoInvestor": "Вход для Инвесторов",
      "demoAdmin": "Вход для Админов",
      "loadingDemo": "Демо-доступ загружается...",
      "titlePart1": "Превратите хаос стартапа",
      "titlePart2": "в безупречную систему.",
      "subtitle": "Единая операционная система, которая объединяет фаундеров и инвесторов. Структурированные данные, AI-аналитика и прозрачный процесс фандрайзинга.",
      "accessFounder": "Доступ в панель управления основателя.",
      "accessInvestor": "Доступ в панель управления инвестора.",
      "accessAdmin": "Доступ в панель управления администратора.",
      "enterSystem": "Войти в систему",
      "endOfChaosTitle": "Конец эпохи Excel и хаоса",
      "endOfChaosDesc": "90% стартапов проваливаются из-за неструктурированных процессов и плохой коммуникации с инвесторами. Мы решаем эту проблему.",
      "feature1Title": "Разрозненные данные",
      "feature1Desc": "Больше никаких потерянных ссылок на Notion, Google Docs и Excel-модели. Всё в одном месте.",
      "feature2Title": "Непонятный статус",
      "feature2Desc": "Инвесторы всегда видят актуальный статус стартапа, его traction и готовность к раунду.",
      "feature3Title": "Долгий Due Diligence",
      "feature3Desc": "Стандартизированная дата-комната сокращает время проверки стартапа в 3 раза.",
      "forFounders": "ДЛЯ ФАУНДЕРОВ",
      "founderTitle": "Фокус на продукте, а не на таблицах",
      "founderDesc": "Founder OS дает вам пошаговый алгоритм действий. От проработки идеи до закрытия раунда финансирования.",
      "founderList1": "AI-анализ вашего Pitch Deck с рекомендациями",
      "founderList2": "Автоматический расчет финансовых моделей и метрик",
      "founderList3": "Прямой доступ к верифицированным инвесторам",
      "founderList4": "Трекинг готовности к инвестициям (Investment Readiness)",
      "forInvestors": "ДЛЯ ИНВЕСТОРОВ",
      "investorTitle": "Качественный Pipeline, а не спам на почту",
      "investorDesc": "Получайте доступ только к тем стартапам, которые прошли базовую проверку и соответствуют вашему инвестиционному фокусу.",
      "investorList1": "Унифицированный формат презентации метрик",
      "investorList2": "Удобная Data Room со всеми документами",
      "investorList3": "Раннее обнаружение рисков благодаря AI-скорингу",
      "investorList4": "Синхронизация портфеля и пайплайн сделок",
      "footerRights": "© 2026 UNTITLED Ecosystem. Все права защищены."
    },
    "uz": {
      "demoFounder": "Founderlar uchun kirish",
      "demoInvestor": "Investorlar uchun kirish",
      "demoAdmin": "Adminlar uchun kirish",
      "loadingDemo": "Demo kirish yuklanmoqda...",
      "titlePart1": "Startap xaosini",
      "titlePart2": "mukammal tizimga aylantiring.",
      "subtitle": "Founderlar va investorlarni birlashtiruvchi yagona operatsion tizim. Tuzilgan ma'lumotlar, AI analitikasi va shaffof fandrayzing jarayoni.",
      "accessFounder": "Founder boshqaruv paneliga kirish.",
      "accessInvestor": "Investor boshqaruv paneliga kirish.",
      "accessAdmin": "Admin boshqaruv paneliga kirish.",
      "enterSystem": "Tizimga kirish",
      "endOfChaosTitle": "Excel va xaos davrining oxiri",
      "endOfChaosDesc": "Startaplarning 90% tartibsiz jarayonlar va investorlar bilan yomon aloqa tufayli muvaffaqiyatsizlikka uchraydi. Biz bu muammoni hal qilamiz.",
      "feature1Title": "Tarqoq ma'lumotlar",
      "feature1Desc": "Notion, Google Docs va Excel modellariga yo'qolgan havolalar ortiq yo'q. Barchasi bir joyda.",
      "feature2Title": "Noaniq holat",
      "feature2Desc": "Investorlar doimo startapning dolzarb holatini, uning o'sishini va raundga tayyorligini ko'rishadi.",
      "feature3Title": "Uzoq Due Diligence",
      "feature3Desc": "Standartlashtirilgan ma'lumotlar xonasi startapni tekshirish vaqtini 3 barobarga qisqartiradi.",
      "forFounders": "FOUNDERLAR UCHUN",
      "founderTitle": "Jadvallarga emas, mahsulotga e'tibor qarating",
      "founderDesc": "Founder OS sizga qadamma-qadam harakatlar rejasini beradi. G'oyani ishlab chiqishdan tortib moliyalashtirish raundini yopishgacha.",
      "founderList1": "Pitch Deckingizni tavsiyalar bilan AI tahlili",
      "founderList2": "Moliyaviy modellar va metrikalarni avtomatik hisoblash",
      "founderList3": "Tasdiqlangan investorlarga to'g'ridan-to'g'ri kirish",
      "founderList4": "Investitsiyaga tayyorlikni (Investment Readiness) kuzatish",
      "forInvestors": "INVESTORLAR UCHUN",
      "investorTitle": "Pochtaga spam emas, sifatli Pipeline",
      "investorDesc": "Faqat bazaviy tekshiruvdan o'tgan va investitsiya yo'nalishingizga mos keladigan startaplarga kirish huquqiga ega bo'ling.",
      "investorList1": "Metrikalarni taqdim etishning unifikatsiyalangan formati",
      "investorList2": "Barcha hujjatlar bilan qulay Data Room",
      "investorList3": "AI skoringi yordamida xavflarni erta aniqlash",
      "investorList4": "Portfelni va bitimlar pipelineni sinxronlashtirish",
      "footerRights": "© 2026 UNTITLED Ecosystem. Barcha huquqlar himoyalangan."
    }
  }
};

const locales = ['en', 'ru', 'uz'];
locales.forEach(locale => {
  const file = path.resolve(`messages/${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  
  for (const [namespace, langData] of Object.entries(translations)) {
    if (!data[namespace]) data[namespace] = {};
    data[namespace] = { ...data[namespace], ...langData[locale] };
  }
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`Updated ${locale}.json`);
});
