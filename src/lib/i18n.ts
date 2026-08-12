export type Lang = "en" | "mr";

export const translations = {
  // --- Nav ---
  nav_home: { en: "Home", mr: "मुख्यपृष्ठ" },
  nav_calendar: { en: "Calendar", mr: "दिनदर्शिका" },
  nav_stores: { en: "Stores", mr: "दुकाने" },
  nav_near_expiry: { en: "Near Expiry", mr: "एक्सपायरी जवळ" },
  nav_regular_items: { en: "Regular Items", mr: "नियमित माल" },
  nav_tour_plan: { en: "Tour Plan", mr: "टूर प्लॅन" },

  // --- Header ---
  log_out: { en: "Log out", mr: "लॉग आउट" },

  // --- Score badge ---
  score_out_of_100: { en: "Score", mr: "गुण" },
  how_score_calculated: { en: "How is this calculated?", mr: "हे कसे मोजले जाते?" },
  score_sales: { en: "Sales (order amount vs monthly target)", mr: "विक्री (मासिक लक्ष्याच्या तुलनेत ऑर्डर रक्कम)" },
  score_receipts: { en: "Receipts (collection vs monthly target)", mr: "वसुली (मासिक लक्ष्याच्या तुलनेत जमा रक्कम)" },
  score_locations: {
    en: "Locations marked (% of your stores with GPS saved)",
    mr: "ठिकाण नोंदवले (तुमच्या दुकानांपैकी GPS असलेले %)",
  },
  score_medicals_done: {
    en: "Medicals visited (% of your stores visited this month)",
    mr: "भेट दिलेली दुकाने (या महिन्यात भेट दिलेल्या दुकानांचे %)",
  },
  score_attendance: {
    en: "Attendance (minus points for Leave/Absent days)",
    mr: "हजेरी (रजा/गैरहजर दिवसांसाठी गुण वजा)",
  },
  score_this_month: { en: "This month, out of 100:", mr: "या महिन्यात, १०० पैकी:" },
  close: { en: "Close", mr: "बंद करा" },

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

  // --- Tour Plan ---
  tour_plan_heading: { en: "Tour Plan", mr: "टूर प्लॅन" },
  tour_plan_subtitle: {
    en: "Plan your whole month at once — route and colleague for each day.",
    mr: "संपूर्ण महिन्याचे नियोजन एकाच वेळी करा — प्रत्येक दिवसाचा मार्ग व सोबती.",
  },
  day: { en: "Day", mr: "दिवस" },
  working_with: { en: "Working With", mr: "सोबती" },
  route_col: { en: "Route", mr: "मार्ग" },
  remarks: { en: "Remarks", mr: "शेरा" },
  none: { en: "None", mr: "काहीही नाही" },
  save_tour_plan: { en: "Save Tour Plan", mr: "टूर प्लॅन जतन करा" },
  saving: { en: "Saving...", mr: "जतन होत आहे..." },
  tour_plan_saved: { en: "Tour plan saved.", mr: "टूर प्लॅन जतन झाला." },
  go: { en: "Go", mr: "जा" },

  // --- July Catch-up (one-time backfill) ---
  catchup_banner_text: {
    en: "One-time: catch up July's numbers, store by store →",
    mr: "एकदाच: जुलैचे आकडे दुकाननिहाय भरा →",
  },
  catchup_heading: { en: "July Catch-up Entry", mr: "जुलैची भरपाई नोंद" },
  catchup_subtitle: {
    en: "One-time exception: add order and collection amounts for each day of July, per store. No photo or GPS needed for these entries.",
    mr: "एकदाची सूट: प्रत्येक दुकानासाठी जुलैच्या प्रत्येक दिवसाची ऑर्डर व जमा रक्कम भरा. यासाठी फोटो किंवा GPS लागणार नाही.",
  },
  save_all: { en: "Save All", mr: "सर्व जतन करा" },
  entries_saved: { en: "Saved.", mr: "जतन झाले." },

  // --- Route detail ---
  monthly_visit_history: { en: "Monthly visit history", mr: "मासिक भेटींचा तपशील" },
  todays_visit_order: { en: "Today's Visit Order", mr: "आजचा भेट क्रम" },
  visited: { en: "Visited", mr: "भेट दिली" },
  no_stores_on_route: { en: "No stores on this route yet.", mr: "या मार्गावर अजून दुकान नाही." },

  // --- Retailer shop ---
  shop_catalog: { en: "Catalog", mr: "यादी" },
  shop_cart: { en: "Cart", mr: "कार्ट" },
  shop_my_orders: { en: "My Orders", mr: "माझ्या ऑर्डर्स" },
  shop_catalog_heading: { en: "Catalog", mr: "उत्पादन यादी" },
  shop_catalog_subtitle: {
    en: "Add items to your cart, then check out.",
    mr: "वस्तू कार्टमध्ये टाका, मग ऑर्डर करा.",
  },
  shop_search_products: { en: "Search products...", mr: "उत्पादन शोधा..." },
  shop_no_products_found: { en: "No products found.", mr: "उत्पादन सापडले नाही." },
  shop_your_cart: { en: "Your Cart", mr: "तुमचा कार्ट" },
  shop_cart_empty: { en: "Your cart is empty.", mr: "तुमचा कार्ट रिकामा आहे." },
  shop_browse_catalog: { en: "Browse catalog", mr: "यादी पहा" },
  shop_item: { en: "Item", mr: "वस्तू" },
  shop_qty: { en: "Qty", mr: "प्रमाण" },
  shop_line_total: { en: "Line Total", mr: "एकूण" },
  shop_remove: { en: "Remove", mr: "काढा" },
  shop_total: { en: "Total", mr: "एकूण रक्कम" },
  shop_notes_optional: { en: "Notes (optional)", mr: "टीप (ऐच्छिक)" },
  shop_notes_placeholder: {
    en: "Any special instructions for this order...",
    mr: "या ऑर्डरसाठी विशेष सूचना असल्यास...",
  },
  shop_place_order: { en: "Place Order", mr: "ऑर्डर द्या" },
  shop_placing_order: { en: "Placing order...", mr: "ऑर्डर देत आहे..." },
  shop_my_orders_heading: { en: "My Orders", mr: "माझ्या ऑर्डर्स" },
  shop_no_orders_yet: { en: "No orders placed yet.", mr: "अजून कोणतीही ऑर्डर दिली नाही." },
  shop_order_status_pending: { en: "PENDING", mr: "प्रलंबित" },
  shop_order_status_confirmed: { en: "CONFIRMED", mr: "स्वीकृत" },
  shop_order_status_fulfilled: { en: "FULFILLED", mr: "पूर्ण" },
  shop_order_status_cancelled: { en: "CANCELLED", mr: "रद्द" },
  shop_unit_price: { en: "Unit Rate", mr: "प्रति नग दर" },
  shop_note_prefix: { en: "Note:", mr: "टीप:" },

  // --- Retailer shop v2: home dashboard, pending bills, offers, loyalty, request product, pay online ---
  shop_home: { en: "Home", mr: "मुख्यपृष्ठ" },
  shop_company: { en: "Company", mr: "कंपनी" },
  shop_menu: { en: "Menu", mr: "मेनू" },
  shop_menu_order: { en: "Order", mr: "ऑर्डर" },
  shop_menu_order_history: { en: "Order History", mr: "ऑर्डर इतिहास" },
  shop_menu_pending_bills: { en: "Pending Bills", mr: "थकीत बिले" },
  shop_menu_offers: { en: "Offers", mr: "ऑफर्स" },
  shop_menu_request_product: { en: "Request Product", mr: "उत्पादनाची मागणी" },
  shop_menu_pay_online: { en: "Pay Online", mr: "ऑनलाइन पेमेंट" },
  shop_special_offers: { en: "Special Offers", mr: "खास ऑफर्स" },
  shop_loyalty_heading: { en: "Yearly Gift on Sale", mr: "वार्षिक विक्रीवर भेट" },
  shop_tax: { en: "Tax", mr: "कर" },
  shop_scheme: { en: "Scheme", mr: "स्कीम" },
  shop_pending_bills_heading: { en: "Pending Bills", mr: "थकीत बिले" },
  shop_total_outstanding: { en: "Total Outstanding", mr: "एकूण थकबाकी" },
  shop_invoice_no: { en: "Invoice #", mr: "बिल क्र." },
  shop_date: { en: "Date", mr: "दिनांक" },
  shop_bill_amount: { en: "Bill Amount", mr: "बिल रक्कम" },
  shop_balance_due: { en: "Balance Due", mr: "देय रक्कम" },
  shop_no_pending_bills: { en: "No pending bills.", mr: "कोणतेही थकीत बिल नाही." },
  shop_no_offers: { en: "No offers right now.", mr: "सध्या कोणतीही ऑफर नाही." },
  shop_product_name: { en: "Product Name", mr: "उत्पादनाचे नाव" },
  shop_note_optional: { en: "Note (optional)", mr: "टीप (ऐच्छिक)" },
  shop_request_sent: { en: "Request sent.", mr: "विनंती पाठवली." },
  shop_sending: { en: "Sending...", mr: "पाठवत आहे..." },
  shop_send_request: { en: "Send Request", mr: "विनंती पाठवा" },
  shop_request_product_heading: { en: "Request a Product", mr: "उत्पादनाची मागणी करा" },
  shop_request_product_subtitle: {
    en: "Can't find what you're looking for? Let us know and we'll review it.",
    mr: "तुम्हाला हवं ते सापडत नाही? आम्हाला कळवा, आम्ही ते तपासू.",
  },
  shop_pay_online_not_configured: {
    en: "Online payment isn't set up yet. Please contact your distributor.",
    mr: "ऑनलाइन पेमेंट अजून सुरू केलेले नाही. कृपया तुमच्या वितरकाशी संपर्क साधा.",
  },
  shop_pay_online_heading: { en: "Pay Online", mr: "ऑनलाइन पेमेंट" },
  shop_pay_online_subtitle: {
    en: "Scan the QR code or tap the button to pay via UPI.",
    mr: "QR कोड स्कॅन करा किंवा UPI ने पेमेंट करण्यासाठी बटण दाबा.",
  },
  shop_pay_now: { en: "Pay Now", mr: "आता पेमेंट करा" },
  shop_low_stock: { en: "Low Stock", mr: "मर्यादित साठा" },
  shop_in_stock: { en: "In Stock", mr: "साठा" },
  shop_show_alternatives: { en: "Show alternatives", mr: "पर्याय दाखवा" },
  shop_hide_alternatives: { en: "Hide alternatives", mr: "पर्याय लपवा" },
  shop_reorder: { en: "Reorder", mr: "पुन्हा ऑर्डर करा" },
  shop_reordering: { en: "Adding to cart...", mr: "कार्टमध्ये टाकत आहे..." },
  shop_reorder_unavailable: {
    en: "No longer available and skipped",
    mr: "आता उपलब्ध नाही, वगळले",
  },
  shop_enable_notifications: { en: "Enable order updates", mr: "ऑर्डर सूचना सुरू करा" },
  shop_notifications_enabled: { en: "Order updates enabled", mr: "ऑर्डर सूचना सुरू आहेत" },
  shop_notifications_blocked: {
    en: "Notifications are blocked in your browser settings",
    mr: "तुमच्या ब्राउझर सेटिंगमध्ये सूचना बंद आहेत",
  },
  shop_menu_fast_order: { en: "Fast Order", mr: "जलद ऑर्डर" },
  shop_fast_order_heading: { en: "Fast Order", mr: "जलद ऑर्डर" },
  shop_fast_order_subtitle: {
    en: "Your regular items — just enter quantity and go.",
    mr: "तुमचा नियमित माल — फक्त प्रमाण टाका आणि पुढे जा.",
  },
  shop_no_fast_order_items: {
    en: "No regular items found yet. Order a few times and they'll show up here.",
    mr: "अजून नियमित माल सापडला नाही. काही वेळा ऑर्डर केल्यावर इथे दिसेल.",
  },
  shop_usual_qty: { en: "Usual qty", mr: "नेहमीचे प्रमाण" },
  shop_add_to_cart_checkout: { en: "Add to Cart & Checkout", mr: "कार्टमध्ये टाका आणि पुढे जा" },
} as const;

export type TranslationKey = keyof typeof translations;

const ORDER_STATUS_KEYS = {
  PENDING: "shop_order_status_pending",
  CONFIRMED: "shop_order_status_confirmed",
  FULFILLED: "shop_order_status_fulfilled",
  CANCELLED: "shop_order_status_cancelled",
} as const;

export function orderStatusLabel(
  lang: Lang,
  status: keyof typeof ORDER_STATUS_KEYS,
): string {
  return t(lang, ORDER_STATUS_KEYS[status]);
}

export function t(lang: Lang, key: TranslationKey): string {
  return translations[key][lang] ?? translations[key].en;
}
