// Demo data for the CrossWay worker app prototype. Everything is local; no backend.
export const TR={en:{hello:'Hello, Ravi',avail:'Available for work today',speak:'Speak to find work',near:'Shifts near you',accept:'Accept shift',home:'Home',shifts:'My shifts',wallet:'Wallet',passport:'Passport',more:'More'},
hi:{hello:'नमस्ते, रवि',avail:'आज काम के लिए उपलब्ध',speak:'बोलकर काम खोजें',near:'आपके पास की शिफ्ट',accept:'शिफ्ट स्वीकार करें',home:'होम',shifts:'मेरी शिफ्ट',wallet:'वॉलेट',passport:'पासपोर्ट',more:'और'},
kn:{hello:'ನಮಸ್ಕಾರ, ರವಿ',avail:'ಇಂದು ಕೆಲಸಕ್ಕೆ ಲಭ್ಯ',speak:'ಮಾತನಾಡಿ ಕೆಲಸ ಹುಡುಕಿ',near:'ನಿಮ್ಮ ಹತ್ತಿರದ ಶಿಫ್ಟ್‌ಗಳು',accept:'ಶಿಫ್ಟ್ ಒಪ್ಪಿಕೊಳ್ಳಿ',home:'ಮುಖಪುಟ',shifts:'ನನ್ನ ಶಿಫ್ಟ್',wallet:'ವಾಲೆಟ್',passport:'ಪಾಸ್‌ಪೋರ್ಟ್',more:'ಇನ್ನಷ್ಟು'}};
export const LANGS=[['en','English'],['hi','हिन्दी'],['kn','ಕನ್ನಡ'],['te','తెలుగు'],['ta','தமிழ்'],['ml','മലയാളം'],['mr','मराठी'],['bn','বাংলা'],['or','ଓଡ଼ିଆ'],['gu','ગુજરાતી']];
export const T={ok:['#C4EED0','#072711'],warn:['#FEEFC3','#594300'],bad:['#F9DEDC','#410E0B'],info:['#D3E3FD','#041E49'],mute:['#E9EEF6','#444746']};
export const FEED=[
{id:'s1',role:'Waiter',client:'Toit Brewpub · Indiranagar',when:'Sun 19 Oct · 6 pm–12 am',pay:'₹1,160',dist:'2.1 km',icon:'restaurant',kind:'ok',tags:[['verified','Verified employer','ok'],['local_taxi','Free cab home','info']],cat:'evening'},
{id:'s3',role:'Kitchen helper',client:'Taj MG Road',when:'Today · 6–11 pm',pay:'₹1,050',dist:'3.4 km',icon:'soup_kitchen',kind:'conflict',tags:[['verified','Verified employer','ok']],cat:'evening'},
{id:'s2',role:'Warehouse picker',client:'Flipkart FC · Hoskote',when:'Sun 19 Oct · 7 am–3 pm',pay:'₹980',dist:'14 km',icon:'inventory_2',kind:'far',tags:[['directions_bus','Company bus from KR Puram','info']],cat:'day'},
{id:'s5',role:'Barista',client:'Third Wave Coffee · Koramangala',when:'Mon 20 Oct · 8 am–4 pm',pay:'₹1,100',dist:'4.0 km',icon:'local_cafe',kind:'race',tags:[['bolt','2 spots left','warn']],cat:'day'},
{id:'s4',role:'Event crew',client:'Palace Grounds · Diwali expo',when:'Fri 31 Oct · 4 pm–12 am',pay:'₹1,400',dist:'6.2 km',icon:'celebration',kind:'police',tags:[['trending_up','+₹200 festival bonus','ok'],['local_police','Police verification needed','bad']],cat:'evening'}];
export const MINE=[
{id:'m1',role:'Housekeeping',client:'Prestige Tech Park',when:'Today · 5:00–9:00 pm',status:'Check-in open',sev:'info',note:'Tower B, Whitefield. Check-in opens 30 min before start.',act:'Go to shift',icon:'login',day:true},
{id:'m2',role:'Store helper',client:'Decathlon Sarjapur',when:'Tue 21 Oct',status:'Cancelled by client',sev:'bad',note:'Cancelled 6 h before start. ₹200 compensation added to your wallet. Your score isn\'t affected.'},
{id:'m0',role:'Waiter',client:'Toit Brewpub',when:'Thu 16 Oct',status:'Paid',sev:'ok',note:'6.0 h · ₹1,160 paid to UPI · you rated 5★'}];
export const APPS=[
{id:'a1',title:'Senior data scientist',co:'Razorpay · via CrossWay Pro',status:'AI interview',sev:'info',stage:2,note:'A 20-minute AI interview on ML and SQL. You choose when. A person reviews every result.',kind:'ai'},
{id:'a2',title:'ML engineer',co:'Swiggy',status:'Interview Mon',sev:'ok',stage:3,note:'Video interview Mon 20 Oct, 11:00 am with 2 panelists. Reminder set.',kind:'int'},
{id:'a3',title:'Data scientist II',co:'PhonePe',status:'Not selected',sev:'bad',stage:2,note:'Reason shared: needed 2+ years of recommender systems. You can ask a person to review the decision.',kind:'rej'},
{id:'a4',title:'Lead analyst',co:'Infosys BPM',status:'Offer',sev:'ok',stage:4,note:'₹38 LPA offer. Expires Wed 22 Oct, 6 pm.',kind:'offer'}];
export const ini=n=>n.split(' ').map(w=>w[0]).join('').slice(0,2);
export const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');

export const TXNS=[['payments','Toit Brewpub · Thu','Paid to UPI ravi@ybl','+₹1,160','ok'],['schedule','Prestige · today','Waiting for client approval','₹780','warn'],['redeem','Decathlon cancellation','Compensation for late cancel','+₹200','ok'],['money_off','Taj MG Road · 12 Oct','Bank payout failed (server down). Re-sent to UPI.','+₹1,050','bad'],['rule','Third Wave · 10 Oct','Client disputed 2 h. Paid 4 h now; rest after review.','+₹480','warn']];

export const JOBS=[{id:'j1',title:'Senior data scientist',co:'Razorpay',loc:'Bengaluru · hybrid',pay:'₹38–45 LPA',match:'90% match',why:'Python, ML in production, fintech'},{id:'j2',title:'Applied scientist',co:'Flipkart',loc:'Bengaluru',pay:'₹40–52 LPA',match:'84% match',why:'Recommender systems would strengthen your fit'}];

export const EXTRA_SHIFT={id:'sx',role:'Loader',client:'BigBasket · Mahadevapura',when:'Sun 19 Oct · 6 am–2 pm',pay:'₹900',dist:'12.8 km',icon:'local_shipping',kind:'far',tags:[['verified','Verified employer','ok']],cat:'day'};

export const SCENARIOS=[['kyc','DigiLocker result',[['ok','Success'],['down','DigiLocker down'],['minor','Under 18']]],['selfie','Selfie liveness',[['ok','Pass'],['fail','Fails (low light)']]],['bank','Bank penny-drop',[['ok','Name matches'],['mismatch','Name mismatch']]],['geo','Location at shift',[['inside','Inside geofence'],['outside','420 m away']]],['payout','UPI payout',[['ok','Succeeds'],['fail','Bank down']]],['feed','Shift feed',[['ok','Shifts nearby'],['empty','None nearby']]]];
