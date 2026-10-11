// The products shown first on the shop, in this order: they are exactly what
// the Hot Selling list contains, and they lead the main order list. Edit the
// list (product id, then its name as a reminder) to change what retailers see.
export const FEATURED_PRODUCTS: ReadonlyArray<{ id: string; name: string }> = [
  { id: "cmsox34ub0037cctcryvd37ci", name: "OMEE CAP. omeprazole 20 S" },
  { id: "cmumz180000lq94tcw8nl6dze", name: "COFSILS NEW ORANGE JAR 33X10" },
  { id: "cmsox56hy00dmcctcjn3cy717", name: "AZICIP 500 TAB. 20*3 S" },
  { id: "cmsox6v7k00mbcctcu6n4vltl", name: "MOVEXX SP TAB 20*10 S" },
  { id: "cmsox5lng00fscctcqi0uu02t", name: "CIPLADINE OINT 10GM 12*10GM" },
  { id: "cmsox5vwe00hacctchdn1h1tc", name: "OMNIGEL 10 GM 10 GM" },
  { id: "cmumz3rhv016w94tce1b3w2sn", name: "INTAGESIC MR TABLET 100*10S" },
  { id: "cmsox52mb00d2cctcru0aift2", name: "LEVOZET M TAB 20*10 S" },
  { id: "cmumz0smj00i594tcvhuvxyge", name: "SKINSHINE SOAP (REGU) 75 GM" },
  { id: "cmsoxor0702xocctcqpoal711", name: "DERMI 5 CREAM 20X15GM" },
  { id: "cmsoxoqmt02xmcctcy7gp1zo2", name: "CLOBET GM CREAM RC 20*10 GM" },
  { id: "cmsoxoruw02xtcctchknl5rus", name: "MELAMET CREAM 20X15 GM" },
  { id: "cmsox6nlo00l4cctca9ydb6yz", name: "SUHAGRA 100 TAB 20*4 S" },
  { id: "cmsox42oj007zcctcuk3jjimy", name: "AF J9 POPULAR HOT WA 1 S" },
  { id: "cmsoxd3pm01jhcctc4z3htzs9", name: "GLUCOONE BG 03 50'S STRIP 50'S" },
  { id: "cmsox5swo00gwcctcp3qio936", name: "NICOTEX 2 MINT PLUS 15S 15'S" },
  { id: "cmumz1ayo00mf94tcaqy31td4", name: "NICOGUM 2MG 16'S" },
  { id: "cmsoxda3101k9cctc4jo5x8zp", name: "HANDYNEB SMART 1S" },
  { id: "cmsoxcx5901imcctcg848vb9f", name: "THERMOMETER MEDTECH" },
  { id: "cmsox2kmo0004cctc9niyfe89", name: "AMOXYCLAV 625 5x3  amoxy+clav 15X10S" },
  { id: "cmsox6skf00lwcctclftdiyso", name: "CHESTON COLD TAB. 25*10 S" },
  { id: "cmsox6sed00lvcctcm9afnm3u", name: "CHESTON COLD SYRUP 60 ML" },
  { id: "cmsox5hdc00f4cctc8b8pc5db", name: "OKACET TAB. 140*10 S" },
  { id: "cmsoxonbl02x4cctcfhx0bdxf", name: "TOPCEF 200 DT TAB 20*10'S" },
  { id: "cmsox7vnc00s0cctc7b9z6j76", name: "REBEZ DSR CAP. 20*10 S" },
  { id: "cmsox2vdg001rcctcf7pixecn", name: "PENTAB 40 TAB. 25*15 S" },
];

export const FEATURED_PRODUCT_IDS: string[] = FEATURED_PRODUCTS.map((p) => p.id);
