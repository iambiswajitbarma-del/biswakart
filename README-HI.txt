BiswaKart PWA — Android phone setup

यह एक शुरुआती PWA starter project है, अभी published/live दुकान नहीं है। Firebase config और rules सेट करने के बाद इसे टेस्ट कर सकते हैं।

1) Firebase web config:
- Firebase Console खोलें → Project settings (gear) → General → Your apps.
- यदि Web app नहीं है, Add app (</>) चुनें और नाम BiswaKart दें।
- Firebase SDK setup में दिए config values को firebase-config.js में भरें.
- कभी भी service-account private key या admin SDK key browser code में न डालें.

2) Authentication:
- Authentication → Sign-in method → Email/Password Enable करें.
- Authentication → Users में अपना admin login user बनाएं.

3) Firestore:
- Firestore Database → Rules में firestore.rules की सामग्री publish करें.
- इससे products public read होंगे; order create करने के लिए sign-in चाहिए; orders केवल owner और admin पढ़ सकते हैं.
- Admin setup: Authentication → Users में अपने account का UID copy करें.
  Firestore → Data → Start collection → Collection ID `admins`
  Document ID में अपना exact UID डालें.
  Field: `active` (boolean) = `true`
  Save करें.
  ध्यान: admins collection के client-side writes rules से blocked हैं. Console से ही manually provision करें.
- `products` collection में documents जोड़ें. Example fields:
  name (string), description (string), price (number), stock (number), imageUrl (string).
  Product images के लिए publicly reachable image URL दें; बाद में Firebase Storage भी जोड़ा जा सकता है.
- `orders` collection manually test करने के लिए जरूरी नहीं; ग्राहक checkout से order create करेगा.
- Firestore Rules की सुरक्षा को production में लॉन्च करने से पहले अलग से review/test करें. अभी order rules basic starter rules हैं, payment/stock validation server-side नहीं है.

4) Run/host:
- ES modules और Firebase browser SDK के कारण इसे file manager से file:// खोलने पर सही काम नहीं करेगा.
- इसे HTTPS hosting पर publish करें, जैसे Firebase Hosting. Hosting setup के लिए Firebase CLI आम तौर पर computer/Cloud Shell की जरूरत रखता है.
- ZIP को unzip करके project files hosting पर upload करें. फिर HTTPS link खोलें और Chrome menu → Add to Home screen चुनें.

5) Features:
- Product grid, cart, email/password sign up/login, order creation, My Orders, basic admin order list.
- Push notifications अभी शामिल/कनेक्ट नहीं हैं. Push notifications के लिए Firebase Cloud Messaging, HTTPS, browser permission, service-worker configuration और server-side trigger/function चाहिए.
- Online payments, shipping integration, refunds, tax/invoice, stock decrement and production-grade validation अभी शामिल नहीं हैं.
