export type Lang = "en" | "mr";

export const translations = {
  // --- Nav ---
  nav_home: { en: "Home", mr: "मुख्यपृष्ठ" },
  nav_calendar: { en: "Calendar", mr: "दिनदर्शिका" },
  nav_stores: { en: "Stores", mr: "दुकाने" },
  nav_near_expiry: { en: "Near Expiry", mr: "एक्सपायरी जवळ" },
  nav_regular_items: { en: "Regular Items", mr: "नियमित माल" },

  // --- Header ---
  log_out: { en: "Log out", mr: "लॉग आउट" },

  // --- Dashboard / Home ---
  monthly_target: { en: "Monthly Target", mr: "मासिक लक्ष्य" },
  today_target: { en: "Today Target", mr: "आजचे लक्ष्य" },
  per_retailer_target: { en: "Per Retailer Target", mr: "प्रति दुकान लक्ष्य" },
  not_set: { en: "Not set", mr: "सेट केलेले नाही" },
  current_incentives: { en: "Current Incentives", mr: "सध्याचे इन्सेंटिव्ह" },
  item: { en: "Item", mr: "वस्तू" },
  incentive: { en: "Incentive", mr: "इन्सेंटिव्ह" },
  my_routes: { en: "My Routes", mr: "माझे मार्ग" },
  no_routes_assigned: { en: "No routes assigned yet.", mr: "अजून कोणताही मार्ग नेमलेला नाही." },
  times_this_month: { en: "x this month", mr: " वेळा या महिन्यात" },

  // --- Attendance ---
  todays_status: { en: "Today's status:", mr: "आजची स्थिती:" },
  status_not_marked: { en: "Not marked (assumed field day)", mr: "नोंद नाही (फील्ड दिवस समजला जाईल)" },
  mark_leave: { en: "Mark Leave", mr: "रजा नोंदवा" },
  day_at_office: { en: "Day at Office", mr: "ऑफिस दिवस" },
  select_route: { en: "Select Route", mr: "मार्ग निवडा" },
  choose_todays_route: { en: "Choose today's route", mr: "आजचा मार्ग निवडा" },
  confirm_route_for_today: { en: "Confirm route for today", mr: "आजचा मार्ग निश्चित करा" },
  marked_as_for_today: { en: "Marked as", mr: "अशी नोंद झाली:" },
  for_today: { en: "for today.", mr: "आजसाठी." },

  // --- Calendar ---
  daily_call_report: { en: "Daily Call Report", mr: "दैनिक भेट अहवाल" },
  target_progress: { en: "Target Progress", mr: "लक्ष्य प्रगती" },
  today: { en: "Today", mr: "आज" },
  this_month: { en: "This month", mr: "या महिन्यात" },
  of_target: { en: "% of target", mr: "% लक्ष्य पूर्ण" },
  three_year_history: { en: "3-Year History", mr: "मागील ३ वर्षांचा तपशील" },
  monthly_numbers_recent: {
    en: "Your monthly numbers, most recent first.",
    mr: "तुमचे मासिक आकडे, अलीकडचे आधी.",
  },
  month: { en: "Month", mr: "महिना" },
  visits: { en: "Visits", mr: "भेटी" },
  productive: { en: "Productive", mr: "ऑर्डरसह भेटी" },
  order_amt: { en: "Order Amt", mr: "ऑर्डर रक्कम" },
  collected: { en: "Collected", mr: "जमा रक्कम" },

  // --- Stores search ---
  search_stores_placeholder: {
    en: "Search stores by name or address...",
    mr: "नाव किंवा पत्त्यावरून दुकान शोधा...",
  },
  no_stores_match: { en: "No stores match your search.", mr: "तुमच्या शोधाशी जुळणारे दुकान नाही." },
  location_marked: { en: "Location already marked", mr: "ठिकाण आधीच नोंदवले आहे" },
  map: { en: "Map", mr: "नकाशा" },
  tele_called: { en: "Tele called:", mr: "टेलिकॉलरने संपर्क:" },
  chemist_list: { en: "Chemist List", mr: "दुकानांची यादी" },

  // --- Visit page ---
  regularly_bought_items: { en: "Regularly bought items", mr: "नियमित घेतला जाणारा माल" },
  check_before_order: {
    en: "Highest value first — check before you order.",
    mr: "जास्त किमतीचा माल आधी — ऑर्डर करण्यापूर्वी पहा.",
  },
  qty: { en: "Qty", mr: "प्रमाण" },
  near_expiry_stock: { en: "Near-Expiry Stock", mr: "एक्सपायरी जवळ असलेला माल" },
  push_special_rate: { en: "Push these at special rate.", mr: "हा माल खास दरात विका." },
  expiry: { en: "Expiry", mr: "एक्सपायरी" },
  rate: { en: "Rate", mr: "दर" },
  collection_amount: { en: "Collection Amount", mr: "जमा रक्कम" },
  discount_given: { en: "Discount Given?", mr: "सूट दिली का?" },
  yes: { en: "Yes", mr: "होय" },
  no: { en: "No", mr: "नाही" },
  order_placed: { en: "Order placed", mr: "ऑर्डर मिळाली" },
  no_order: { en: "No order", mr: "ऑर्डर नाही" },
  order_amount: { en: "Order Amount", mr: "ऑर्डर रक्कम" },
  reason: { en: "Reason", mr: "कारण" },
  choose_a_reason: { en: "Choose a reason", mr: "कारण निवडा" },
  notes_optional: { en: "Notes (optional)", mr: "टीप (ऐच्छिक)" },
  submit_visit: { en: "Submit Visit", mr: "भेट सबमिट करा" },
  submitting: { en: "Submitting...", mr: "सबमिट होत आहे..." },
  verify_gps_photo: {
    en: "Verify GPS and take a photo before submitting.",
    mr: "सबमिट करण्यापूर्वी GPS पडताळा आणि फोटो काढा.",
  },
  last_telecaller_call: { en: "Last telecaller call:", mr: "शेवटचा टेलिकॉलर संपर्क:" },
  note: { en: "Note:", mr: "टीप:" },
  gps_verified: { en: "GPS Verified ✓", mr: "GPS पडताळले ✓" },
  fetching_location: { en: "Fetching location...", mr: "ठिकाण शोधत आहे..." },
  verify_gps_location: { en: "Verify GPS Location", mr: "GPS ठिकाण पडताळा" },
  retake_photo: { en: "Retake Photo", mr: "पुन्हा फोटो घ्या" },
  take_photo: { en: "Take Photo", mr: "फोटो घ्या" },
  processing_photo: { en: "Processing photo...", mr: "फोटो प्रक्रिया होत आहे..." },

  // No-order reasons
  reason_store_closed: { en: "Store closed", mr: "दुकान बंद" },
  reason_no_stock_needed: { en: "No stock needed", mr: "माल हवा नाही" },
  reason_owner_not_available: { en: "Owner not available", mr: "मालक उपलब्ध नाही" },
  reason_payment_dispute: { en: "Payment dispute", mr: "पेमेंट वाद" },
  reason_competitor_stocked: { en: "Competitor stocked", mr: "स्पर्धकाकडून माल घेतला" },
  reason_other: { en: "Other", mr: "इतर" },

  // --- Near expiry / Regular items pages ---
  near_expiry_heading: { en: "Near-Expiry Stock", mr: "एक्सपायरी जवळ असलेला माल" },
  soonest_expiry_first: {
    en: "Soonest expiry first — push these at special rate.",
    mr: "लवकर एक्सपायर होणारा माल आधी — खास दरात विका.",
  },
  no_expiry_uploaded: { en: "No near-expiry stock uploaded yet.", mr: "अजून एक्सपायरी यादी अपलोड नाही." },
  regularly_bought_items_heading: { en: "Regularly Bought Items", mr: "नियमित घेतला जाणारा माल" },
  choose_a_store: { en: "Choose a store", mr: "दुकान निवडा" },
  view: { en: "View", mr: "पहा" },
  highest_value_first: { en: "Highest value first", mr: "जास्त किमतीचा माल आधी" },
  no_purchase_history: {
    en: "No purchase history for this store.",
    mr: "या दुकानासाठी खरेदी इतिहास नाही.",
  },

  // --- Route detail ---
  monthly_visit_history: { en: "Monthly visit history", mr: "मासिक भेटींचा तपशील" },
  todays_visit_order: { en: "Today's Visit Order", mr: "आजचा भेट क्रम" },
  visited: { en: "Visited", mr: "भेट दिली" },
  no_stores_on_route: { en: "No stores on this route yet.", mr: "या मार्गावर अजून दुकान नाही." },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(lang: Lang, key: TranslationKey): string {
  return translations[key][lang] ?? translations[key].en;
}
