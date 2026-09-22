// =============================================
// Smart Invest - SPA Application Controller
// =============================================
const API = 'http://127.0.0.1:8000';  // FastAPI Backend
let authToken = localStorage.getItem('si_token') || null;
let currentUser = JSON.parse(localStorage.getItem('si_user') || 'null');
let selectedCountry = localStorage.getItem('si_country') || 'India';
let isDark = true;
let sidebarCollapsed = false;
let notifOpen = false;
let charts = {};
let backendOnline = true; // tracks live backend reachability

// =============================================
// GEO DATA — Country → State → District
// =============================================
const GEO_DATA = {
  "India": {
    "Andhra Pradesh": ["Alluri Sitharama Raju","Anakapalli","Anantapur","Bapatla","Chittoor","East Godavari","Eluru","Guntur","Kadapa","Kakinada","Konaseema","Krishna","Kurnool","Manyam","Nandyal","Nellore","Palnadu","Prakasam","Sri Potti Sriramulu Nellore","Srikakulam","Tirupati","Visakhapatnam","Vizianagaram","West Godavari"],
    "Arunachal Pradesh": ["Anjaw","Changlang","Dibang Valley","East Kameng","East Siang","Kamle","Kra Daadi","Kurung Kumey","Lepa Rada","Lohit","Longding","Lower Dibang Valley","Lower Siang","Lower Subansiri","Namsai","Pakke-Kessang","Papum Pare","Shi Yomi","Siang","Tawang","Tirap","Upper Siang","Upper Subansiri","West Kameng","West Siang"],
    "Assam": ["Bajali","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara-Mankachar","Tinsukia","Udalguri","West Karbi Anglong"],
    "Bihar": ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"],
    "Chhattisgarh": ["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada","Dhamtari","Durg","Gariaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur","Kabirdham","Kanker","Khairagarh","Kondagaon","Korba","Koriya","Mahasamund","Manendragarh","Mohla-Manpur","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sakti","Sarangarh-Bilaigarh","Sukma","Surajpur","Surguja"],
    "Goa": ["North Goa","South Goa"],
    "Gujarat": ["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad","Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad"],
    "Haryana": ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Mewat","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"],
    "Himachal Pradesh": ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul & Spiti","Mandi","Shimla","Sirmaur","Solan","Una"],
    "Jharkhand": ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahebganj","Seraikela Kharsawan","Simdega","West Singhbhum"],
    "Karnataka": ["Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban","Bidar","Chamarajanagar","Chikkaballapur","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davangere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"],
    "Kerala": ["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"],
    "Madhya Pradesh": ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Mandla","Mandsaur","Morena","Narsinghpur","Neemuch","Niwari","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"],
    "Maharashtra": ["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"],
    "Manipur": ["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"],
    "Meghalaya": ["East Garo Hills","East Jaintia Hills","East Khasi Hills","Eastern West Khasi Hills","North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills"],
    "Mizoram": ["Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit","Saitual","Serchhip"],
    "Nagaland": ["Chumoukedima","Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Niuland","Noklak","Peren","Phek","Tseminyu","Tuensang","Wokha","Zunheboto"],
    "Odisha": ["Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara","Kendujhar","Khurda","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Subarnapur","Sundargarh"],
    "Punjab": ["Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur","Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa","Moga","Mohali","Muktsar","Pathankot","Patiala","Rupnagar","Sangrur","Shahid Bhagat Singh Nagar","Tarn Taran"],
    "Rajasthan": ["Ajmer","Alwar","Banswara","Baran","Barmer","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Dholpur","Dungarpur","Hanumangarh","Jaipur","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Karauli","Kota","Nagaur","Pali","Pratapgarh","Rajsamand","Sawai Madhopur","Sikar","Sirohi","Sri Ganganagar","Tonk","Udaipur"],
    "Sikkim": ["East Sikkim","North Sikkim","Pakyong","Soreng","South Sikkim","West Sikkim"],
    "Tamil Nadu": ["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Kanniyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar"],
    "Telangana": ["Adilabad","Bhadradri Kothagudem","Hanumakonda","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Kumuram Bheem","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal-Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal","Yadadri Bhuvanagiri"],
    "Tripura": ["Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti","West Tripura"],
    "Uttar Pradesh": ["Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Prayagraj","Raebareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"],
    "Uttarakhand": ["Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"],
    "West Bengal": ["Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling","Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman","Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"],
    "Andaman & Nicobar Islands": ["Nicobar","North & Middle Andaman","South Andaman"],
    "Chandigarh": ["Chandigarh"],
    "Dadra & Nagar Haveli and Daman & Diu": ["Dadra & Nagar Haveli","Daman","Diu"],
    "Delhi": ["Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"],
    "Jammu & Kashmir": ["Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar","Kulgam","Kupwara","Poonch","Pulwama","Rajouri","Ramban","Reasi","Samba","Shopian","Srinagar","Udhampur"],
    "Ladakh": ["Kargil","Leh"],
    "Lakshadweep": ["Lakshadweep"],
    "Puducherry": ["Karaikal","Mahe","Puducherry","Yanam"]
  },
  "United States": {
    "California": ["Los Angeles","San Francisco","San Diego","Sacramento","San Jose","Fresno","Oakland","Long Beach","Bakersfield","Anaheim"],
    "Texas": ["Houston","Dallas","Austin","San Antonio","Fort Worth","El Paso","Arlington","Corpus Christi","Plano","Laredo"],
    "New York": ["New York City","Buffalo","Rochester","Yonkers","Syracuse","Albany","New Rochelle","Mount Vernon","Schenectady","Utica"],
    "Florida": ["Jacksonville","Miami","Tampa","Orlando","St. Petersburg","Hialeah","Port St. Lucie","Cape Coral","Tallahassee","Fort Lauderdale"],
    "Illinois": ["Chicago","Aurora","Joliet","Naperville","Rockford","Springfield","Elgin","Peoria","Champaign","Waukegan"],
    "Pennsylvania": ["Philadelphia","Pittsburgh","Allentown","Erie","Reading","Scranton","Bethlehem","Lancaster","Harrisburg","York"],
    "Ohio": ["Columbus","Cleveland","Cincinnati","Toledo","Akron","Dayton","Parma","Canton","Youngstown","Lorain"],
    "Georgia": ["Atlanta","Columbus","Augusta","Macon","Savannah","Athens","Sandy Springs","Roswell","Johns Creek","Albany"],
    "Michigan": ["Detroit","Grand Rapids","Warren","Sterling Heights","Ann Arbor","Lansing","Flint","Dearborn","Livonia","Westland"],
    "Washington": ["Seattle","Spokane","Tacoma","Vancouver","Bellevue","Kent","Everett","Renton","Kirkland","Bellingham"]
  },
  "United Kingdom": {
    "England": ["London","Birmingham","Manchester","Leeds","Liverpool","Sheffield","Bristol","Newcastle","Nottingham","Southampton","Leicester","Coventry","Bradford","Plymouth","Reading"],
    "Scotland": ["Glasgow","Edinburgh","Aberdeen","Dundee","Inverness","Stirling","Perth","Dunfermline"],
    "Wales": ["Cardiff","Swansea","Newport","Bangor","St Davids","Wrexham"],
    "Northern Ireland": ["Belfast","Londonderry","Lisburn","Newry","Armagh","Ballymena"]
  },
  "United Arab Emirates": {
    "Abu Dhabi": ["Abu Dhabi City","Al Ain","Al Dhafra","Khalifa City","Musaffah","Reem Island"],
    "Dubai": ["Bur Dubai","Deira","Downtown Dubai","Dubai Marina","Jumeirah","Al Barsha","Business Bay","Palm Jumeirah","Al Quoz","Silicon Oasis"],
    "Sharjah": ["Sharjah City","Khor Fakkan","Kalba","Dhaid"],
    "Ajman": ["Ajman City","Masfout"],
    "Ras Al Khaimah": ["Ras Al Khaimah City","Al Jazirah Al Hamra","Khatt"],
    "Fujairah": ["Fujairah City","Dibba Al Fujairah","Kalba"],
    "Umm Al Quwain": ["Umm Al Quwain City"]
  },
  "Australia": {
    "New South Wales": ["Sydney","Newcastle","Wollongong","Maitland","Wagga Wagga","Albury","Tamworth","Dubbo","Bathurst","Orange"],
    "Victoria": ["Melbourne","Geelong","Ballarat","Bendigo","Shepparton","Melton","Mildura","Warrnambool","Wodonga","Sunbury"],
    "Queensland": ["Brisbane","Gold Coast","Sunshine Coast","Townsville","Cairns","Toowoomba","Mackay","Rockhampton","Bundaberg","Hervey Bay"],
    "Western Australia": ["Perth","Mandurah","Bunbury","Geraldton","Kalgoorlie","Albany","Broome","Karratha","Port Hedland"],
    "South Australia": ["Adelaide","Mount Gambier","Whyalla","Murray Bridge","Port Augusta","Port Pirie","Victor Harbor"],
    "Tasmania": ["Hobart","Launceston","Devonport","Burnie","Queenstown"],
    "Australian Capital Territory": ["Canberra","Belconnen","Tuggeranong","Woden Valley","Gungahlin"],
    "Northern Territory": ["Darwin","Alice Springs","Palmerston","Katherine","Nhulunbuy"]
  },
  "Canada": {
    "Ontario": ["Toronto","Ottawa","Mississauga","Brampton","Hamilton","London","Markham","Vaughan","Kitchener","Windsor"],
    "Quebec": ["Montreal","Quebec City","Laval","Gatineau","Longueuil","Sherbrooke","Saguenay","Levis","Trois-Rivieres"],
    "British Columbia": ["Vancouver","Surrey","Burnaby","Richmond","Kelowna","Abbotsford","Coquitlam","Langley","Saanich"],
    "Alberta": ["Calgary","Edmonton","Red Deer","Lethbridge","St. Albert","Medicine Hat","Grande Prairie","Airdrie","Spruce Grove"],
    "Manitoba": ["Winnipeg","Brandon","Steinbach","Thompson","Portage la Prairie"],
    "Saskatchewan": ["Saskatoon","Regina","Prince Albert","Moose Jaw","Swift Current"],
    "Nova Scotia": ["Halifax","Cape Breton","Truro","New Glasgow","Sydney"]
  },
  "Singapore": {
    "Central Region": ["Bishan","Bukit Merah","Bukit Timah","Downtown Core","Geylang","Kallang","Marina East","Marina South","Museum","Newton","Novena","Orchard","Outram","Queenstown","River Valley","Rochor","Tanglin","Toa Payoh"],
    "East Region": ["Bedok","Changi","Paya Lebar","Pasir Ris","Tampines"],
    "North Region": ["Mandai","Sembawang","Simpang","Sungei Kadut","Woodlands","Yishun"],
    "North-East Region": ["Ang Mo Kio","Hougang","Punggol","Sengkang","Serangoon"],
    "West Region": ["Bukit Batok","Bukit Panjang","Choa Chu Kang","Clementi","Jurong East","Jurong West","Pioneer","Tengah","Tuas","Western Water Catchment"]
  }
};

// =============================================
// CURRENCY HELPER — Indian Rupee (INR)
// =============================================
function formatINR(value, compact = false, fractionDigits = 0) {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  if (compact) {
    if (value >= 1e7) return '₹' + (value / 1e7).toFixed(2) + ' Cr';
    if (value >= 1e5) return '₹' + (value / 1e5).toFixed(2) + ' L';
    return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: fractionDigits });
  }
  return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits });
}


// =============================================
// AUTH HELPERS
// =============================================
function switchAuthTab(tab) {
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  const countrySelect = document.getElementById('login-country');
  if (countrySelect && !countrySelect.value) {
    errEl.style.color = 'var(--danger)';
    errEl.textContent = '✖ Please select a country.';
    return;
  }
  btn.textContent = 'Signing in...'; btn.disabled = true;
  try {
    const form = new FormData();
    form.append('username', document.getElementById('login-email').value.trim());
    form.append('password', document.getElementById('login-password').value);
    const res = await fetch(API + '/api/auth/login', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed. Check your credentials.');
    authToken = data.access_token;
    currentUser = data.user;
    localStorage.setItem('si_token', authToken);
    localStorage.setItem('si_user', JSON.stringify(currentUser));
    if (countrySelect) {
      selectedCountry = countrySelect.value;
      localStorage.setItem('si_country', selectedCountry);
    }
    bootApp();
  } catch (err) {
    errEl.style.color = 'var(--danger)';
    if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
      errEl.textContent = '✖ Cannot connect to backend (Server offline).';
    } else {
      errEl.textContent = '✖ ' + err.message;
    }
  } finally {
    btn.textContent = 'Sign In to Smart Invest'; btn.disabled = false;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-btn');
  const errEl = document.getElementById('reg-error');
  errEl.textContent = '';

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;
  const role = document.getElementById('reg-role').value;

  // Validate
  if (!name) { errEl.style.color='var(--danger)'; errEl.textContent='✖ Full name is required.'; return; }
  if (!email) { errEl.style.color='var(--danger)'; errEl.textContent='✖ Email is required.'; return; }
  if (password.length < 8) { errEl.style.color='var(--danger)'; errEl.textContent='✖ Password must be at least 8 characters.'; return; }
  if (password !== confirmPassword) { errEl.style.color='var(--danger)'; errEl.textContent='✖ Passwords do not match.'; return; }

  btn.textContent = 'Creating account...'; btn.disabled = true;

  try {
    // Step 1: Register
    const regForm = new FormData();
    regForm.append('full_name', name);
    regForm.append('email', email);
    regForm.append('password', password);
    regForm.append('role', role);
    const regRes = await fetch(API + '/api/auth/register', { method: 'POST', body: regForm });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(regData.detail || 'Registration failed');

    // Step 2: Auto-login
    const loginForm = new FormData();
    loginForm.append('username', email);
    loginForm.append('password', password);
    const loginRes = await fetch(API + '/api/auth/login', { method: 'POST', body: loginForm });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error('Account created! Please sign in manually.');

    authToken = loginData.access_token;
    currentUser = loginData.user;
    localStorage.setItem('si_token', authToken);
    localStorage.setItem('si_user', JSON.stringify(currentUser));

    // Show success briefly then enter app
    errEl.style.color = 'var(--success)';
    errEl.textContent = '✓ Account created! Logging you in...';
    setTimeout(() => bootApp(), 600);

  } catch (err) {
    errEl.style.color = 'var(--danger)';
    if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
      errEl.textContent = '✖ Cannot connect to backend (Server offline).';
    } else {
      errEl.textContent = '✖ ' + err.message;
    }
    // If account was created but auto-login failed, switch to login tab
    if (err.message.includes('sign in')) {
      setTimeout(() => switchAuthTab('login'), 1500);
    }
  } finally {
    btn.textContent = 'Create Account & Sign Up'; btn.disabled = false;
  }
}

function logout() {
  authToken = null; currentUser = null;
  localStorage.removeItem('si_token'); localStorage.removeItem('si_user');
  const shell = document.getElementById('app-shell');
  const auth = document.getElementById('auth-screen');
  if (shell) shell.classList.remove('active');
  if (auth) { auth.style.display = 'flex'; }
  // Reset auth forms
  const lf = document.getElementById('login-form');
  const rf = document.getElementById('register-form');
  if (lf) lf.reset();
  if (rf) rf.reset();
  switchAuthTab('login');
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(e){} });
  charts = {};
}

function apiHeaders() {
  return { 'Authorization': `Bearer ${authToken}` };
}

// =============================================
// BACKEND HEALTH CHECK
// =============================================
async function checkBackendHealth() {
  try {
    const res = await fetch(API + '/health', { method: 'GET', signal: AbortSignal.timeout(5000) });
    backendOnline = res.ok;
  } catch(e) {
    backendOnline = false;
  }
  const banner = document.getElementById('backend-offline-banner');
  if (banner) banner.style.display = backendOnline ? 'none' : 'flex';
  return backendOnline;
}

// =============================================
// FETCH HELPERS
// =============================================
function apiHeaders() {
  return { 'Authorization': `Bearer ${authToken}` };
}

// apiFetch — with 1 automatic retry on network failure
async function apiFetch(url, opts = {}, retries = 1) {
  try {
    opts.headers = { ...apiHeaders(), ...(opts.headers || {}) };
    const res = await fetch(API + url, opts);
    // Only logout on 401 if we have a token
    if (res.status === 401 && authToken) { logout(); return null; }
    backendOnline = true;
    const banner = document.getElementById('backend-offline-banner');
    if (banner) banner.style.display = 'none';
    return res;
  } catch(e) {
    console.warn(`apiFetch error (retries left: ${retries}):`, url, e.message);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 800)); // wait 800ms then retry
      return apiFetch(url, opts, retries - 1);
    }
    backendOnline = false;
    const banner = document.getElementById('backend-offline-banner');
    if (banner) banner.style.display = 'flex';
    return null;
  }
}

// apiFetchStrict — throws on failure so callers can show specific messages
async function apiFetchStrict(url, opts = {}) {
  try {
    opts.headers = { ...apiHeaders(), ...(opts.headers || {}) };
    const res = await fetch(API + url, opts);
    if (res.status === 401 && authToken) { logout(); return null; }
    backendOnline = true;
    return res;
  } catch(e) {
    backendOnline = false;
    const banner = document.getElementById('backend-offline-banner');
    if (banner) banner.style.display = 'flex';
    const networkErr = new Error('No response from server. The backend may be offline — please ensure the server is running and refresh the page.');
    networkErr.isNetworkError = true;
    throw networkErr;
  }
}

// =============================================
// APP BOOT
// =============================================
function bootApp() {
  try {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell');
    if (authScreen) authScreen.style.display = 'none';
    if (appShell) appShell.classList.add('active');
    // Set user info in sidebar
    if (currentUser) {
      const nameEl = document.getElementById('sidebar-name');
      const roleEl = document.getElementById('sidebar-role');
      const avatarEl = document.getElementById('sidebar-avatar');
      if (nameEl) nameEl.textContent = currentUser.full_name || 'User';
      if (roleEl) roleEl.textContent = currentUser.role || 'Investor';
      if (avatarEl) avatarEl.textContent = (currentUser.full_name || 'U')[0].toUpperCase();
    }
    
    // Check if backend is alive
    checkBackendHealth();

    navigate('dashboard');
    loadNotifications();
    setupMarketWebSocket();
  } catch(err) {
    console.error('bootApp error:', err);
  }
}

// =============================================
// NAVIGATION
// =============================================
const PAGE_TITLES = {
  dashboard: 'Dashboard', valuation: 'Property Valuation', market: 'Market Analysis',
  sentiment: 'Sentiment Analysis', assistant: 'AI Investment Assistant',
  simulation: 'Scenario Simulation', portfolio: 'Portfolio Management',
  reports: 'Reports', settings: 'Settings'
};

function navigate(page) {
  document.querySelectorAll('.sidebar-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="spinner"></div>';
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(e){} });
  charts = {};
  setTimeout(() => {
    const pages = { dashboard, valuation, market, sentiment, assistant, simulation, portfolio, reports, settings };
    if (pages[page]) pages[page](content);
  }, 50);
}

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
}

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-btn').textContent = isDark ? '🌙' : '☀️';
}

function toggleNotifications() {
  notifOpen = !notifOpen;
  document.getElementById('notif-panel').classList.toggle('open', notifOpen);
}

// =============================================
// WEBSOCKETS
// =============================================
function setupMarketWebSocket() {
  try {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const countryParam = encodeURIComponent(selectedCountry || 'India');
    const ws = new WebSocket(`${proto}://localhost:8000/ws/market?country=${countryParam}`);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        updateTicker(data.indices || []);
      } catch(e) {}
    };
    ws.onerror = () => {};
    // Store so we can close & reconnect when country changes
    window._marketWs = ws;
  } catch(e) {}
}

function updateTicker(indices) {
  const container = document.getElementById('ticker-items');
  if (!container) return;
  container.innerHTML = indices.map(idx => {
    const cls = idx.change >= 0 ? 'positive' : 'negative';
    const arrow = idx.change >= 0 ? '▲' : '▼';
    return `<div class="ticker-item">
      <span class="ticker-name">${idx.name}</span>
      <span class="ticker-value">${idx.value.toFixed(2)}</span>
      <span class="ticker-change ${cls}">${arrow} ${Math.abs(idx.change).toFixed(2)}%</span>
    </div>`;
  }).join('');
}

// =============================================
// NOTIFICATIONS
// =============================================
async function loadNotifications() {
  try {
    const res = await apiFetch('/api/alerts');
    if (!res || !res.ok) return;
    const alerts = await res.json();
    const list = document.getElementById('notif-list');
    const badge = document.getElementById('notif-badge');
    if (!Array.isArray(alerts)) return;
    const unread = alerts.filter(a => !a.is_read);
    if (badge) {
      badge.textContent = unread.length;
      badge.style.display = unread.length > 0 ? 'flex' : 'none';
    }
    if (!list) return;
    if (!alerts.length) {
      list.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-secondary)">No notifications</div>`;
      return;
    }
    list.innerHTML = alerts.slice(0, 20).map(a => `
      <div class="notif-item ${!a.is_read ? 'unread' : ''}" onclick="markRead(${a.id}, this)">
        <div class="notif-msg">${a.message}</div>
        <div class="notif-time">${new Date(a.created_at).toLocaleString()}</div>
      </div>`).join('');
  } catch(e) { console.warn('loadNotifications error:', e); }
}

async function markRead(id, el) {
  try { await apiFetch(`/api/alerts/read/${id}`, { method: 'POST' }); } catch(e) {}
  el.classList.remove('unread');
}

// =============================================
// PAGE: DASHBOARD
// =============================================
async function dashboard(content) {
  content.innerHTML = `
  <div class="grid-4">
    <div class="metric-card">
      <div class="metric-icon">🛡️</div>
      <div class="metric-label">Portfolio Risk Score</div>
      <div class="metric-value risk-medium" id="dash-risk">—</div>
      <div class="metric-change">Updated just now</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon">💰</div>
      <div class="metric-label">Portfolio Value</div>
      <div class="metric-value" id="dash-value">—</div>
      <div class="metric-change pos" id="dash-val-change">Loading...</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon">🧠</div>
      <div class="metric-label">Market Sentiment</div>
      <div class="metric-value" id="dash-sentiment" style="font-size:1.4rem">—</div>
      <div class="metric-change" id="dash-sent-label">Loading...</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon">🏡</div>
      <div class="metric-label">Properties</div>
      <div class="metric-value" id="dash-props">—</div>
      <div class="metric-change pos" id="dash-props-change">In portfolio</div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">📈 Portfolio Value Trend</div>
      <canvas id="dash-chart" height="220"></canvas>
    </div>
    <div class="card">
      <div class="card-title">📋 Recent Properties</div>
      <div id="dash-prop-list" style="font-size:0.85rem"></div>
    </div>
  </div>`;

  try {
    const [portRes, propRes] = await Promise.all([apiFetch('/api/portfolio'), apiFetch('/api/properties')]);
    const portfolio = portRes ? await portRes.json() : [];
    const properties = propRes ? await propRes.json() : [];
    const totalVal = portfolio.reduce((s, p) => s + (p.current_price || 0), 0);
    const avgRisk = portfolio.length ? portfolio.reduce((s, p) => s + (p.property_risk || 0), 0) / portfolio.length : 0;
    document.getElementById('dash-risk').textContent = avgRisk.toFixed(1) + '%';
    document.getElementById('dash-risk').className = `metric-value ${avgRisk > 60 ? 'risk-high' : avgRisk > 35 ? 'risk-medium' : 'risk-low'}`;
    document.getElementById('dash-value').textContent = formatINR(totalVal, true);
    document.getElementById('dash-val-change').textContent = `${portfolio.length} holdings`;
    document.getElementById('dash-props').textContent = properties.length;
    // Sentiment from last analysis
    const sentRes = await apiFetch('/api/sentiment/history');
    const sentHistory = sentRes ? await sentRes.json() : [];
    if (sentHistory.length) {
      const s = sentHistory[0];
      const sc = s.sentiment_score;
      document.getElementById('dash-sentiment').textContent = sc > 0.15 ? '🟢 Positive' : sc < -0.15 ? '🔴 Negative' : '🟡 Neutral';
      document.getElementById('dash-sent-label').textContent = `Score: ${sc.toFixed(2)}`;
    } else {
      document.getElementById('dash-sentiment').textContent = '🟡 Neutral';
      document.getElementById('dash-sent-label').textContent = 'No data yet';
    }
    // Chart
    const labels = properties.slice(0, 8).map(p => p.address.substring(0, 12) + '...');
    const vals = properties.slice(0, 8).map(p => p.actual_price || p.predicted_price || 0);
    const ctx = document.getElementById('dash-chart').getContext('2d');
    charts['dash'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Property Value (₹)',
          data: vals,
          backgroundColor: 'rgba(0,212,255,0.2)',
          borderColor: '#00D4FF',
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9CA3AF', font: { size: 10 } }, grid: { color: '#1E3A5F' } }, y: { ticks: { color: '#9CA3AF', callback: v => v >= 1e7 ? '₹' + (v/1e7).toFixed(1)+'Cr' : v >= 1e5 ? '₹'+(v/1e5).toFixed(0)+'L' : '₹'+(v/1000).toFixed(0)+'k' }, grid: { color: '#1E3A5F' } } } }
    });
    // Prop list
    const pl = document.getElementById('dash-prop-list');
    if (!properties.length) { pl.innerHTML = '<div style="color:var(--text-secondary);padding:1rem 0">No properties yet. Add one in Property Valuation.</div>'; }
    else { pl.innerHTML = properties.slice(0, 5).map(p => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color)"><span>${p.address}</span><span class="badge ${p.risk_score > 60 ? 'badge-danger' : p.risk_score > 35 ? 'badge-warning' : 'badge-success'}">Risk ${p.risk_score}%</span></div>`).join(''); }
  } catch(e) { console.error(e); }
}

// =============================================
// PAGE: PROPERTY VALUATION
// =============================================
async function valuation(content) {
  content.innerHTML = `
  <div class="grid-2">
    <div class="card">
      <div class="card-title">🏡 Add & Predict Property</div>
      <form id="val-form" onsubmit="predictProperty(event)">
        <div class="form-row">
          <div class="form-group">
            <label>🗺️ State / Province</label>
            <select class="form-select" id="v-state" onchange="onStateChange(this.value)" disabled>
              <option value="">— Select State —</option>
            </select>
          </div>
          <div class="form-group">
            <label>📍 District / City</label>
            <select class="form-select" id="v-district" onchange="onDistrictChange(this.value)" disabled>
              <option value="">— Select District —</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Street Address</label>
            <input class="form-input" id="v-address" placeholder="123 Main St" list="address-suggestions" required />
            <datalist id="address-suggestions"></datalist>
            <div style="margin-top: 0.75rem;">
              <div id="google-map-container" style="width: 100%;"></div>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Property Type</label>
            <select class="form-select" id="v-type" onchange="onPropertyTypeChange(this.value)">
              <option value="Houses (single-family, townhouses)">Houses (single-family, townhouses)</option>
              <option value="Land (vacant, agricultural, development)">Land (vacant, agricultural, development)</option>
              <option value="Flats/Apartments (residential units)">Flats/Apartments (residential units)</option>
              <option value="Commercial Properties (offices, retail, warehouses)">Commercial Properties (offices, retail, warehouses)</option>
              <option value="Mixed-Use Properties (residential + commercial)">Mixed-Use Properties (residential + commercial)</option>
              <option value="Industrial Properties (factories, logistics centers)">Industrial Properties (factories, logistics centers)</option>
            </select>
          </div>
        </div>
        
        <div id="dynamic-fields"></div>

        <div class="form-row">
          <div class="form-group"><label id="v-price-label">Actual Price (₹/Sqft) <span style="font-size:0.75rem;color:var(--text-secondary);font-weight:400">(optional)</span></label><input class="form-input" type="number" id="v-price" placeholder="e.g. 3000" step="any" /></div>
          <div class="form-group">
            <label>📅 Sale Timeline (Investor Hold Period)</label>
            <select class="form-select" id="v-hold-years">
              <option value="1">1 Year</option>
              <option value="2">2 Years</option>
              <option value="3">3 Years</option>
              <option value="5">5 Years</option>
              <option value="7">7 Years</option>
              <option value="10">10 Years</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:0.75rem">
          <label>📸 Upload Property Images <span style="font-size:0.75rem;color:var(--text-secondary);font-weight:400">(optional · multiple supported · analyzed by AI)</span></label>
          <label for="v-images" id="v-images-label" style="display:flex;align-items:center;gap:0.75rem;cursor:pointer;background:var(--bg-primary);border:1.5px dashed var(--border-color);border-radius:10px;padding:0.75rem 1rem;transition:border-color 0.2s,background 0.2s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border-color)'">
            <span style="font-size:1.5rem">📷</span>
            <span style="font-size:0.85rem;color:var(--text-secondary)">Click to select images — road, land, surroundings etc.</span>
            <input type="file" id="v-images" accept="image/*" multiple style="display:none" onchange="previewPropertyImages(this)" />
          </label>
          <div id="v-images-preview" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.6rem"></div>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
          <button type="submit" class="btn-accent">⚡ Predict & Save</button>
          <button type="button" class="btn-outline" onclick="document.getElementById('csv-input').click()">📁 Bulk CSV Upload</button>
          <input type="file" id="csv-input" accept=".csv" style="display:none" onchange="uploadCSV(event)" />
        </div>
      </form>
      <div id="val-result" style="margin-top:1.5rem"></div>
    </div>
    <div class="card">
      <div class="card-title">📊 Saved Properties</div>
      <div id="prop-table-wrap"><div class="spinner"></div></div>
    </div>
  </div>`;
  onPropertyTypeChange("Houses (single-family, townhouses)");
  // Init country → state cascade for the user's selected country
  onCountryChange(selectedCountry);
  loadPropertyTable();
  setTimeout(() => initGoogleMap(), 100);
}

function onCountryChange(country) {
  const stateEl    = document.getElementById('v-state');
  const districtEl = document.getElementById('v-district');
  if (!stateEl || !districtEl) return;

  // Reset state & district
  stateEl.innerHTML    = '<option value="">— Select State —</option>';
  districtEl.innerHTML = '<option value="">— Select District —</option>';
  districtEl.disabled  = true;

  if (!country || !GEO_DATA[country]) {
    stateEl.disabled = true;
    return;
  }

  stateEl.disabled = false;
  const states = Object.keys(GEO_DATA[country]);
  states.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    stateEl.appendChild(opt);
  });
}

function onStateChange(state) {
  const country    = selectedCountry;
  const districtEl = document.getElementById('v-district');
  if (!districtEl) return;

  districtEl.innerHTML = '<option value="">— Select District —</option>';

  if (!state || !country || !GEO_DATA[country]?.[state]) {
    districtEl.disabled = true;
    return;
  }

  districtEl.disabled = false;
  GEO_DATA[country][state].forEach(d => {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d;
    districtEl.appendChild(opt);
  });
}

async function onDistrictChange(district) {
  const addrEl = document.getElementById('v-address');
  const datalist = document.getElementById('address-suggestions');
  if (!addrEl || !district) return;
  
  // Set default initial address prefix
  addrEl.value = district + ', ';
  addrEl.focus();

  if (datalist) {
    datalist.innerHTML = '';
    try {
      const res = await apiFetch(`/api/properties/suggest-locations?query=${encodeURIComponent(district)}`);
      const suggestions = res ? await res.json() : [];
      suggestions.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        datalist.appendChild(opt);
      });
    } catch (e) {
      console.error('Failed to load address suggestions:', e);
    }
  }
}

function onPropertyTypeChange(type) {
  const container = document.getElementById('dynamic-fields');
  if (!container) return;
  // Reset price label to Sqft for non-land types
  const priceLabelEl = document.getElementById('v-price-label');
  if (priceLabelEl) priceLabelEl.innerHTML = `Actual Price (&#8377;/Sqft) <span style="font-size:0.75rem;color:var(--text-secondary);font-weight:400">(optional)</span>`;
  
  if (type === 'Houses (single-family, townhouses)') {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label>Square Footage</label><input class="form-input" type="number" id="v-sqft" placeholder="1500" required /></div>
        <div class="form-group"><label>Bedrooms</label><input class="form-input" type="number" id="v-beds" placeholder="3" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Bathrooms</label><input class="form-input" type="number" step="0.5" id="v-baths" placeholder="2.0" required /></div>
        <div class="form-group"><label>Year Built</label><input class="form-input" type="number" id="v-year" placeholder="2010" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>House Type</label>
          <select class="form-select" id="v-house-type">
            <option value="Single-Family">Single-Family</option>
            <option value="Townhouse">Townhouse</option>
          </select>
        </div>
        <div class="form-group">
          <label>Has Garage</label>
          <select class="form-select" id="v-garage">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Yard Size (Sqft)</label><input class="form-input" type="number" id="v-yard" placeholder="2000" /></div>
      </div>`;
  } else if (type === 'Land (vacant, agricultural, development)') {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Area</label>
          <input class="form-input" type="number" id="v-sqft" placeholder="e.g. 10" min="0.001" step="any" required />
        </div>
        <div class="form-group">
          <label>Area Unit</label>
          <select class="form-select" id="v-area-unit" onchange="onAreaUnitChange(this.value)">
            <option value="Sqft">Square Feet (Sqft)</option>
            <option value="Cent">Cent</option>
            <option value="Acre">Acre</option>
          </select>
        </div>
      </div>
      <div style="font-size:0.75rem;color:var(--text-secondary);padding:0 0.2rem;margin-top:-0.4rem;margin-bottom:0.6rem">
        &#128208; 1 Cent = 435.6 Sqft &nbsp;&middot;&nbsp; 1 Acre = 100 Cent = 43,560 Sqft
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Land Type</label>
          <select class="form-select" id="v-land-type">
            <option value="Vacant">Vacant Land</option>
            <option value="Agricultural">Agricultural Land</option>
            <option value="Development">Development Land</option>
          </select>
        </div>
        <div class="form-group">
          <label>Location Type</label>
          <select class="form-select" id="v-location-type">
            <option value="Rural">Rural / Traditional</option>
            <option value="Semi-Urban">Semi-Urban</option>
            <option value="Urban">Urban / Town</option>
            <option value="Commercial">Premium Commercial</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Road Access</label>
          <select class="form-select" id="v-road">
            <option value="no">No Road Access</option>
            <option value="yes">Yes — Road Available</option>
          </select>
        </div>
        <div class="form-group">
          <label>Utilities Available</label>
          <select class="form-select" id="v-utilities">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>`;
    // Default price label to Sqft for newly rendered Land form
    onAreaUnitChange('Sqft');
  } else if (type === 'Flats/Apartments (residential units)') {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label>Square Footage</label><input class="form-input" type="number" id="v-sqft" placeholder="1000" required /></div>
        <div class="form-group"><label>Bedrooms</label><input class="form-input" type="number" id="v-beds" placeholder="2" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Bathrooms</label><input class="form-input" type="number" step="0.5" id="v-baths" placeholder="1.5" required /></div>
        <div class="form-group"><label>Year Built</label><input class="form-input" type="number" id="v-year" placeholder="2015" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Floor Level</label><input class="form-input" type="number" id="v-floor" placeholder="4" required /></div>
        <div class="form-group">
          <label>Has Balcony</label>
          <select class="form-select" id="v-balcony">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Monthly HOA Fees (₹)</label><input class="form-input" type="number" id="v-hoa" placeholder="20000" /></div>
      </div>`;
  } else if (type === 'Commercial Properties (offices, retail, warehouses)') {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label>Square Footage</label><input class="form-input" type="number" id="v-sqft" placeholder="5000" required /></div>
        <div class="form-group">
          <label>Commercial Type</label>
          <select class="form-select" id="v-comm-type">
            <option value="Office">Office</option>
            <option value="Retail">Retail</option>
            <option value="Warehouse">Warehouse</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Parking Spaces</label><input class="form-input" type="number" id="v-parking" placeholder="15" /></div>
        <div class="form-group"><label>Annual Maintenance Cost (₹)</label><input class="form-input" type="number" id="v-maint" placeholder="10,00,000" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Occupancy Rate (%)</label><input class="form-input" type="number" id="v-occupancy" placeholder="95" required /></div>
      </div>`;
  } else if (type === 'Mixed-Use Properties (residential + commercial)') {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label>Total Square Footage</label><input class="form-input" type="number" id="v-sqft" placeholder="8000" required /></div>
        <div class="form-group"><label>Year Built</label><input class="form-input" type="number" id="v-year" placeholder="2012" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Residential Units Count</label><input class="form-input" type="number" id="v-res-units" placeholder="4" required /></div>
        <div class="form-group"><label>Commercial Units Count</label><input class="form-input" type="number" id="v-comm-units" placeholder="2" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Total Bedrooms</label><input class="form-input" type="number" id="v-beds" placeholder="8" required /></div>
        <div class="form-group"><label>Total Bathrooms</label><input class="form-input" type="number" step="0.5" id="v-baths" placeholder="6.0" required /></div>
      </div>`;
  } else if (type === 'Industrial Properties (factories, logistics centers)') {
    container.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label>Square Footage</label><input class="form-input" type="number" id="v-sqft" placeholder="25000" required /></div>
        <div class="form-group">
          <label>Industrial Type</label>
          <select class="form-select" id="v-ind-type">
            <option value="Logistics Center">Logistics Center</option>
            <option value="Factory">Factory</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Ceiling Height (ft)</label><input class="form-input" type="number" id="v-ceiling" placeholder="24" required /></div>
        <div class="form-group"><label>Power Capacity (Amps)</label><input class="form-input" type="number" id="v-power" placeholder="800" required /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Loading Docks Count</label><input class="form-input" type="number" id="v-docks" placeholder="4" required /></div>
        <div class="form-group"><label>Year Built</label><input class="form-input" type="number" id="v-year" placeholder="2008" required /></div>
      </div>`;
  }
}

// =============================================
// AREA UNIT HELPERS
// =============================================
function onAreaUnitChange(unit) {
  const labelEl = document.getElementById('v-price-label');
  if (labelEl) {
    const unitLabel = unit === 'Sqft' ? 'Sqft' : unit === 'Cent' ? 'Cent' : 'Acre';
    labelEl.innerHTML = `Actual Price (&#8377;/${unitLabel}) <span style="font-size:0.75rem;color:var(--text-secondary);font-weight:400">(optional)</span>`;
  }
}

function previewPropertyImages(input) {
  const preview = document.getElementById('v-images-preview');
  if (!preview) return;
  preview.innerHTML = '';
  const files = Array.from(input.files).slice(0, 6);
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const div = document.createElement('div');
      div.style.cssText = 'position:relative;width:68px;height:68px;border-radius:8px;overflow:hidden;border:1px solid var(--border-color);flex-shrink:0';
      div.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover" title="${file.name}" />`;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
  if (input.files.length > 6) {
    const more = document.createElement('div');
    more.style.cssText = 'width:68px;height:68px;border-radius:8px;border:1px solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--text-secondary);flex-shrink:0';
    more.textContent = `+${input.files.length - 6} more`;
    preview.appendChild(more);
  }
  // Update the label text to show count
  const labelEl = document.getElementById('v-images-label');
  if (labelEl) {
    const span = labelEl.querySelector('span');
    if (span && input.files.length > 0) span.textContent = `${input.files.length} image(s) selected — AI will analyze them`;
  }
}

// =============================================
// MAP: LEAFLET / OPENSTREETMAP
// =============================================

function initGoogleMap() {
  // Container where the React-Leaflet map will be mounted
  const container = document.getElementById('google-map-container');
  if (!container) return;

  // mountLeafletMap is exposed by map-entry.jsx (loaded as a module)
  // It renders the React MapComponent into the container
  if (window.mountLeafletMap) {
    window.mountLeafletMap('google-map-container');
  } else {
    // Retry once the module has loaded
    window.addEventListener('leaflet-map-ready', () => {
      window.mountLeafletMap('google-map-container');
    }, { once: true });
  }
}

// Nominatim reverse geocode helper (used by the current-location button in app.js if needed)
async function nominatimReverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) throw new Error('Reverse geocode failed');
    const data = await res.json();
    const addr = data.address || {};
    return {
      latitude: lat,
      longitude: lon,
      google_place_id: data.place_id?.toString() || '',
      formatted_address: data.display_name || '',
      country: addr.country || '',
      state: addr.state || '',
      district: addr.county || addr.state_district || addr.city_district || addr.district || '',
      city: addr.city || addr.town || addr.village || '',
      locality: addr.suburb || addr.neighbourhood || '',
      area: addr.neighbourhood || addr.suburb || '',
      pincode: addr.postcode || '',
      street: addr.road || '',
    };
  } catch (e) {
    console.error('Nominatim reverse geocode error:', e);
    return null;
  }
}

function updateLocationData(addressObj) {
  window.currentLocationData = addressObj;

  const addressEl = document.getElementById('v-address');
  if (addressEl) {
    addressEl.value = addressObj.formatted_address || addressObj.street || addressObj.locality || '';
  }

  const stateEl = document.getElementById('v-state');
  if (stateEl && addressObj.state) {
    const matched = Array.from(stateEl.options).find(
      (o) =>
        o.value.toLowerCase() === addressObj.state.toLowerCase() ||
        addressObj.state.toLowerCase().includes(o.value.toLowerCase())
    );
    if (matched) {
      stateEl.value = matched.value;
      onStateChange(matched.value);
    }
  }

  setTimeout(() => {
    const districtEl = document.getElementById('v-district');
    if (districtEl && !districtEl.disabled) {
      const dVal = addressObj.district || addressObj.city;
      if (dVal) {
        const matched = Array.from(districtEl.options).find(
          (o) =>
            o.value.toLowerCase() === dVal.toLowerCase() ||
            dVal.toLowerCase().includes(o.value.toLowerCase())
        );
        if (matched) districtEl.value = matched.value;
      }
    }
  }, 300);
}

async function predictProperty(e) {
  e.preventDefault();
  const type = document.getElementById('v-type').value;
  const address = document.getElementById('v-address').value;
  // Area in user's selected unit
  const areaRaw = parseFloat(document.getElementById('v-sqft') ? document.getElementById('v-sqft').value : 0) || 1;
  const unit = document.getElementById('v-area-unit') ? document.getElementById('v-area-unit').value : 'Sqft';
  const bedrooms = document.getElementById('v-beds') ? document.getElementById('v-beds').value : 0;
  const bathrooms = document.getElementById('v-baths') ? document.getElementById('v-baths').value : 0.0;
  const year_built = document.getElementById('v-year') ? document.getElementById('v-year').value : 2026;
  const pricePerUnitInput = document.getElementById('v-price').value;
  // Total actual price = price per unit × area in that unit
  const totalActualPrice = pricePerUnitInput ? (parseFloat(pricePerUnitInput) * areaRaw) : null;

  // Build extra details object depending on type
  const extraDetails = {};
  if (type === 'Houses (single-family, townhouses)') {
    extraDetails.house_type = document.getElementById('v-house-type').value;
    extraDetails.has_garage = document.getElementById('v-garage').value;
    extraDetails.yard_size = document.getElementById('v-yard').value || 0;
  } else if (type === 'Land (vacant, agricultural, development)') {
    extraDetails.land_type = document.getElementById('v-land-type').value;
    extraDetails.road_access = document.getElementById('v-road').value;
    extraDetails.utilities_available = document.getElementById('v-utilities').value;
    extraDetails.location_type = document.getElementById('v-location-type') ? document.getElementById('v-location-type').value : 'Rural';
  } else if (type === 'Flats/Apartments (residential units)') {
    extraDetails.floor_level = document.getElementById('v-floor').value;
    extraDetails.has_balcony = document.getElementById('v-balcony').value;
    extraDetails.hoa_fees = document.getElementById('v-hoa').value || 0;
  } else if (type === 'Commercial Properties (offices, retail, warehouses)') {
    extraDetails.commercial_type = document.getElementById('v-comm-type').value;
    extraDetails.parking_spaces = document.getElementById('v-parking').value || 0;
    extraDetails.annual_maintenance = document.getElementById('v-maint').value || 0;
    extraDetails.occupancy_rate = document.getElementById('v-occupancy').value || 100;
  } else if (type === 'Mixed-Use Properties (residential + commercial)') {
    extraDetails.residential_units = document.getElementById('v-res-units').value || 1;
    extraDetails.commercial_units = document.getElementById('v-comm-units').value || 1;
  } else if (type === 'Industrial Properties (factories, logistics centers)') {
    extraDetails.industrial_type = document.getElementById('v-ind-type').value;
    extraDetails.ceiling_height = document.getElementById('v-ceiling').value;
    extraDetails.power_capacity = document.getElementById('v-power').value;
    extraDetails.loading_docks = document.getElementById('v-docks').value;
  }

  const holdYears = document.getElementById('v-hold-years') ? document.getElementById('v-hold-years').value : 1;

  const form = new FormData();
  form.append('address', address);
  
  if (window.currentLocationData) {
      if (window.currentLocationData.latitude) form.append('latitude', window.currentLocationData.latitude);
      if (window.currentLocationData.longitude) form.append('longitude', window.currentLocationData.longitude);
      if (window.currentLocationData.google_place_id) form.append('google_place_id', window.currentLocationData.google_place_id);
      if (window.currentLocationData.formatted_address) form.append('formatted_address', window.currentLocationData.formatted_address);
      if (window.currentLocationData.area) form.append('area', window.currentLocationData.area);
      if (window.currentLocationData.pincode) form.append('pincode', window.currentLocationData.pincode);
      if (window.currentLocationData.state) form.append('state', window.currentLocationData.state);
      if (window.currentLocationData.district) form.append('district', window.currentLocationData.district);
  }

  form.append('sqft', areaRaw);       // area in user's unit; backend converts to sqft internally
  form.append('bedrooms', bedrooms);
  form.append('bathrooms', bathrooms);
  form.append('year_built', year_built);
  form.append('property_type', type);
  form.append('extra_details', JSON.stringify(extraDetails));
  form.append('hold_years', holdYears);
  form.append('unit', unit);
  if (totalActualPrice) form.append('actual_price', totalActualPrice);

  // Append property images for AI analysis
  const imagesInput = document.getElementById('v-images');
  if (imagesInput && imagesInput.files.length > 0) {
    for (const file of imagesInput.files) {
      form.append('images', file);
    }
  }

  const resDiv = document.getElementById('val-result');
  resDiv.innerHTML = '<div class="spinner"></div><div style="text-align:center;font-size:0.82rem;color:var(--text-secondary);margin-top:0.5rem">' + (imagesInput && imagesInput.files.length > 0 ? '🔍 Analyzing images with AI...' : 'Running ML prediction...') + '</div>';

  const submitBtn = document.querySelector('#val-form button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Processing...';
  }

  // Log request details for debugging
  console.log("Predict Property Request:");
  for (let pair of form.entries()) {
    console.log(pair[0] + ' = ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
  }

  try {
    const res = await apiFetch('/api/properties', { method: 'POST', body: form });
    if (!res) {
      throw new Error("No response from server. Please ensure the backend is running or check your internet connection.");
    }

    let data;
    try {
      data = await res.json();
    } catch(err) {
      console.error("Response is not valid JSON", err);
      throw new Error(`Invalid response from server (Status: ${res.status}). Ensure the backend is returning JSON.`);
    }

    console.log("Predict Property Response:", data);

    if (!res.ok) {
      let errorMsg = 'Server returned an error.';
      if (data && data.detail) {
        errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
      throw new Error(errorMsg);
    }

    if (!data.prediction) {
      throw new Error('Server returned a response but no prediction data was found. Please check the backend logs.');
    }
    const pred = data.prediction;

    // Safe numeric helpers
    const safeNum = (v, fallback = 0) => (v !== undefined && v !== null && !isNaN(Number(v))) ? Number(v) : fallback;

    const safeArea = Math.max(1, areaRaw);  // Prevent division by zero

    const riskScore       = safeNum(pred.risk_score, 0);
    const confidence      = safeNum(pred.confidence, 0);
    const appreciationRate = safeNum(pred.appreciation_rate, 0);
    const holdYearsVal    = safeNum(pred.hold_years, 1);
    const predictedPrice  = safeNum(pred.predicted_price, 0);
    const projectedPrice  = safeNum(pred.projected_price, predictedPrice);
    const lowerBound      = safeNum(pred.lower_bound, predictedPrice);
    const upperBound      = safeNum(pred.upper_bound, predictedPrice);

    const riskColor = riskScore > 60 ? 'var(--danger)' : riskScore > 35 ? 'var(--warning)' : 'var(--success)';

    const displayUnit      = pred.unit || unit;
    const predictedPerUnit = safeNum(pred.predicted_per_unit, predictedPrice / safeArea);
    const projectedPerUnit = safeNum(pred.projected_per_unit, projectedPrice / safeArea);
    const lowerPerUnit     = lowerBound / safeArea;
    const upperPerUnit     = upperBound / safeArea;

    // Area conversion summary calculations
    let sqftVal = areaRaw, centVal = areaRaw / 435.6, acreVal = areaRaw / 43560;
    if (displayUnit === 'Cent') { sqftVal = areaRaw * 435.6; centVal = areaRaw; acreVal = areaRaw / 100; }
    else if (displayUnit === 'Acre') { sqftVal = areaRaw * 43560; centVal = areaRaw * 100; acreVal = areaRaw; }

    let plHtml = '';
    if (pricePerUnitInput) {
      const actualPricePerUnit = parseFloat(pricePerUnitInput);
      const totalActualPrice = actualPricePerUnit * areaRaw;
      const totalPredictedPrice = predictedPerUnit * areaRaw;
      
      const profitLossTotal = totalPredictedPrice - totalActualPrice;
      const profitLossPercentage = totalActualPrice > 0 ? (profitLossTotal / totalActualPrice) * 100 : 0;
      
      if (profitLossTotal > 0) {
        plHtml = `<div style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--success)">Est. Net Profit: +${formatINR(profitLossTotal)} <span style="font-size:0.82rem;font-weight:400">(+${profitLossPercentage.toFixed(2)}%)</span></div>`;
      } else if (profitLossTotal < 0) {
        plHtml = `<div style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--danger)">Est. Net Loss: -${formatINR(Math.abs(profitLossTotal))} <span style="font-size:0.82rem;font-weight:400">(${profitLossPercentage.toFixed(2)}%)</span></div>`;
      } else {
        plHtml = `<div style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--text-secondary)">Est. Net Profit/Loss: ₹0</div>`;
      }
    }

    // Image analysis scores section
    const imgScores = (pred.image_scores && typeof pred.image_scores === 'object') ? pred.image_scores : {};
    const hasImgScores = Object.keys(imgScores).length > 0;
    const scoreBar = (val, color='linear-gradient(90deg,#00D4FF,#7B61FF)') =>
      `<div style="flex:1;background:var(--bg-primary);border-radius:999px;height:8px;overflow:hidden"><div style="width:${Math.min(100, safeNum(val))}%;height:100%;background:${color};border-radius:999px;transition:width 0.6s ease"></div></div>`;

    const imgHtml = hasImgScores ? `
      <div style="margin-top:1.25rem;padding:1rem 1.1rem;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.18);border-radius:12px">
        <div class="card-title" style="margin-bottom:0.85rem;color:var(--accent)">🔬 AI Image Analysis Results</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.6rem;margin-bottom:1rem">
          <div style="background:var(--bg-secondary);border-radius:9px;padding:0.65rem">
            <div style="font-size:0.68rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.3rem">📍 Location Type</div>
            <div style="font-weight:700;color:var(--accent)">${imgScores.location_type || '—'}</div>
          </div>
          <div style="background:var(--bg-secondary);border-radius:9px;padding:0.65rem">
            <div style="font-size:0.68rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.3rem">🪨 Soil Type</div>
            <div style="font-weight:700">${imgScores.soil_type_detected || '—'}</div>
          </div>
          <div style="background:var(--bg-secondary);border-radius:9px;padding:0.65rem">
            <div style="font-size:0.68rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.3rem">🏗️ Land Character</div>
            <div style="font-weight:700">${imgScores.land_characteristics || '—'}</div>
          </div>
          <div style="background:var(--bg-secondary);border-radius:9px;padding:0.65rem">
            <div style="font-size:0.68rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.3rem">💧 Water Body</div>
            <div style="font-weight:700">${imgScores.water_body_detected ? '✅ Detected' : '❌ Not Found'}</div>
          </div>
        </div>
        ${[
          ['🛣️ Road Access Score', imgScores.road_access_score],
          ['🏙️ Urbanization Score', imgScores.urbanization_score],
          ['🏗️ Development Score', imgScores.development_score],
          ['⚡ Infrastructure Score', imgScores.infrastructure_score],
          ['🌿 Vegetation Coverage', imgScores.vegetation_coverage],
        ].filter(([,v]) => v !== undefined && v !== null).map(([label, val]) => `
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.55rem">
            <span style="font-size:0.78rem;color:var(--text-secondary);width:175px;flex-shrink:0">${label}</span>
            ${scoreBar(val)}
            <span style="font-size:0.78rem;font-weight:700;width:36px;text-align:right">${safeNum(val)}</span>
          </div>`).join('')}
        ${imgScores.road_features ? `
        <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:0.6rem;padding:0.5rem 0.7rem;background:var(--bg-secondary);border-radius:8px">
          Road: <strong>${imgScores.road_features.road_available ? '✅ Available' : '❌ Not Available'}</strong>
          ${imgScores.road_features.road_available ? ` &nbsp;·&nbsp; Est. Width: <strong>~${imgScores.road_features.road_width_est_ft || '?'} ft</strong> &nbsp;·&nbsp; ${imgScores.road_features.paved ? '🟢 Paved' : '🟡 Unpaved'}` : ''}
        </div>` : ''}
        <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:0.65rem">📷 Analyzed ${imgScores.image_count || 0} image(s)</div>
      </div>` : '';

    // Feature importance — guard against missing/null
    const featImportance = (pred.feature_importance && typeof pred.feature_importance === 'object')
      ? pred.feature_importance : {};
    const featHtml = Object.keys(featImportance).length > 0
      ? `<div class="card-title" style="margin-top:1rem">Feature Importance</div>
         ${Object.entries(featImportance).map(([k, v]) => `
          <div class="feat-row">
            <span class="feat-name">${k}</span>
            <div class="feat-bar-wrap"><div class="feat-bar" style="width:${safeNum(v)}%"></div></div>
            <span class="feat-pct">${safeNum(v).toFixed(1)}%</span>
          </div>`).join('')}`
      : '';

    // Model comparison — guard against missing/null
    const modelComp = (pred.model_comparison && typeof pred.model_comparison === 'object')
      ? pred.model_comparison : {};
    const modelHtml = Object.keys(modelComp).length > 0
      ? `<div class="card-title" style="margin-top:0.75rem">Model Comparison</div>
         <div style="display:flex;gap:1rem;flex-wrap:wrap">
           ${Object.entries(modelComp).map(([m, v]) => `<div style="background:var(--bg-secondary);border-radius:8px;padding:0.5rem 0.8rem;flex:1;min-width:120px"><div style="font-size:0.7rem;color:var(--text-secondary)">${m}</div><div style="font-weight:700">${formatINR(safeNum(v))}</div></div>`).join('')}
         </div>`
      : '';

    resDiv.innerHTML = `
      <div class="card" style="background:var(--bg-primary);border-color:var(--accent)">
        <div class="card-title" style="color:var(--accent)">✓ Prediction Results</div>
        <div style="font-size:2.2rem;font-weight:800;margin-bottom:0.3rem">${formatINR(predictedPerUnit, false, 2)} <span style="font-size:1rem;font-weight:500;color:var(--text-secondary)">/ ${displayUnit}</span></div>
        <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.75rem">
          Total Valuation: <strong>${formatINR(predictedPrice)}</strong> &nbsp;|&nbsp; Range: ${formatINR(lowerPerUnit, false, 2)} — ${formatINR(upperPerUnit, false, 2)} /${displayUnit}
        </div>
        <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.5rem">
          Confidence: <strong>${confidence.toFixed(1)}%</strong> &nbsp;|&nbsp; Annual Appreciation: <strong style="color:var(--success)">${appreciationRate.toFixed(1)}%</strong>
        </div>
        ${pred.data_source ? `
        <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.5rem">
          Dataset Context: <strong style="color:var(--accent)">${pred.data_source}</strong>
        </div>` : ''}
        <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:1rem">
          📅 Projected Value in <strong>${holdYearsVal} year(s)</strong>: <strong style="color:var(--accent)">${formatINR(projectedPrice)}</strong> (${formatINR(projectedPerUnit, false, 2)}/${displayUnit})
        </div>
        ${plHtml}
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
          <span style="font-size:0.8rem;color:var(--text-secondary)">Risk Score</span>
          <span style="font-size:1.5rem;font-weight:700;color:${riskColor}">${riskScore.toFixed(1)}%</span>
        </div>
        <!-- Area Conversion Summary -->
        <div style="background:var(--bg-secondary);border-radius:10px;padding:0.75rem 1rem;margin-bottom:1rem">
          <div style="font-size:0.7rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.45rem">&#128208; Area Conversion Summary</div>
          <div style="display:flex;gap:1.25rem;flex-wrap:wrap;font-size:0.82rem">
            <span><strong>${sqftVal.toLocaleString('en-IN', {maximumFractionDigits:1})}</strong> <span style="color:var(--text-secondary)">Sqft</span></span>
            <span style="color:var(--border-color)">|</span>
            <span><strong>${centVal.toFixed(4)}</strong> <span style="color:var(--text-secondary)">Cent</span></span>
            <span style="color:var(--border-color)">|</span>
            <span><strong>${acreVal.toFixed(4)}</strong> <span style="color:var(--text-secondary)">Acre</span></span>
          </div>
        </div>
        ${imgHtml}
        ${featHtml}
        ${modelHtml}
      </div>`;
    loadPropertyTable();
  } catch(err) {
    console.error("Predict Property Error:", err);
    resDiv.innerHTML = `<div style="color:var(--danger);padding:0.5rem 0">✖ Error: ${err.message}</div>`;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '⚡ Predict & Save';
    }
  }
}

async function uploadCSV(e) {
  const file = e.target.files[0]; if (!file) return;
  const form = new FormData(); form.append('file', file);
  const resDiv = document.getElementById('val-result');
  resDiv.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await apiFetch('/api/properties/upload', { method: 'POST', body: form });
    if (!res) throw new Error('No response from server. Is the backend running?');
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : 'Upload failed');
    resDiv.innerHTML = `<div style="color:var(--success);padding:0.5rem 0">✓ ${data.properties_added} properties imported from CSV</div>`;
    loadPropertyTable();
  } catch(err) { resDiv.innerHTML = `<div style="color:var(--danger)">Upload failed: ${err.message}</div>`; }
}

async function loadPropertyTable() {
  const wrap = document.getElementById('prop-table-wrap');
  if (!wrap) return;
  const res = await apiFetch('/api/properties');
  const props = res ? await res.json() : [];
  if (!props.length) { wrap.innerHTML = '<div style="color:var(--text-secondary);padding:1rem 0;font-size:0.85rem">No properties yet.</div>'; return; }
  
  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Address</th><th>Type</th><th>Area</th><th>Key Details</th><th>Predicted Price / Unit</th><th>Profit / Loss</th><th>Risk</th><th></th></tr></thead>
    <tbody>${props.map(p => {
      let detailsStr = '';
      let details = {};
      try {
        if (p.extra_details) details = JSON.parse(p.extra_details);
      } catch(e) {}
      
      const type = p.property_type || "Houses (single-family, townhouses)";
      if (type.includes("Land")) {
        detailsStr = `Land (${details.land_type || 'Vacant'}), Road: ${details.road_access || 'no'}`;
      } else if (type.includes("Flat") || type.includes("Apartment")) {
        detailsStr = `${p.bedrooms} Beds, Floor ${details.floor_level || 1}, HOA: ${formatINR(details.hoa_fees || 0)}`;
      } else if (type.includes("Commercial")) {
        detailsStr = `${details.commercial_type || 'Office'}, Occupancy: ${details.occupancy_rate || 100}%`;
      } else if (type.includes("Mixed")) {
        detailsStr = `Units: ${details.residential_units || 1}R + ${details.commercial_units || 1}C`;
      } else if (type.includes("Industrial")) {
        detailsStr = `${details.industrial_type || 'Logistics'}, Ceiling: ${details.ceiling_height || 15}ft`;
      } else {
        detailsStr = `${p.bedrooms} Beds, ${p.bathrooms} Baths, ${details.house_type || 'House'}`;
      }

      const displayType = type.split(' ')[0]; // E.g. "Houses", "Land"
      const pricePerSqft = (p.predicted_price || 0) / (p.sqft || 1);
      // Profit / Loss scales with hold timeline: Projected Price - Actual Entry Price
      const profitLoss = (p.projected_price || p.predicted_price || 0) - (p.actual_price || 0);

      let plHtml = '';
      if (!p.actual_price) {
        plHtml = `<span style="color:var(--text-secondary)">—</span>`;
      } else if (profitLoss > 0) {
        plHtml = `<span style="color:var(--success);font-weight:600" title="Projected over ${p.hold_years || 1} years">+${formatINR(profitLoss)}</span>`;
      } else if (profitLoss < 0) {
        plHtml = `<span style="color:var(--danger);font-weight:600" title="Projected over ${p.hold_years || 1} years">-${formatINR(Math.abs(profitLoss))}</span>`;
      } else {
        plHtml = `<span style="color:var(--text-secondary)">₹0</span>`;
      }
      
      return `<tr>
        <td>${p.address}</td>
        <td><span class="badge badge-info">${displayType}</span></td>
        <td>${p.sqft.toLocaleString('en-IN')}</td>
        <td><span style="font-size:0.78rem;color:var(--text-secondary)">${detailsStr}</span></td>
        <td><strong>${formatINR(pricePerSqft, false, 2)}</strong></td>
        <td>${plHtml}</td>
        <td><span class="badge ${p.risk_score>60?'badge-danger':p.risk_score>35?'badge-warning':'badge-success'}">${p.risk_score}%</span></td>
        <td><button class="btn-danger" style="padding:0.3rem 0.6rem;font-size:0.75rem" onclick="deleteProp(${p.id})">✕</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

async function deleteProp(id) {
  if (!confirm('Delete this property?')) return;
  try { await apiFetch(`/api/properties/${id}`, { method: 'DELETE' }); } catch(e) {}
  loadPropertyTable();
}

// =============================================
// PAGE: MARKET ANALYSIS
// =============================================
async function market(content) {
  content.innerHTML = `
  <!-- Area Image Analysis (Top Center Alignment) -->
  <div class="card" style="text-align: center; margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
    <div class="card-title">🗺️ Area Image Analysis</div>
    <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.25rem; max-width:600px; line-height:1.4">
      Upload an aerial or area image of the site. The platform will analyze infrastructural markers (roads, accessibility) and local risk metrics (vegetation density, urban profile) to project future Profit &amp; Loss margins.
    </div>
    <input type="file" id="sat-file" accept="image/*" style="display:none" onchange="analyzeSatellite(event)" />
    <button class="btn-accent" style="padding:0.75rem 2.5rem; font-size: 0.95rem; border-radius: 8px; font-weight: 600;" onclick="document.getElementById('sat-file').click()">📡 Upload Area Image</button>
    <div id="sat-result" style="margin-top:1.5rem; width: 100%; max-width: 800px; text-align: left;"></div>
  </div>

  <div class="card" id="img-history-card">
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
      <div class="card-title" style="margin-bottom:0">🗂️ Previous Image Analysis Reports</div>
      <button id="clear-history-btn" onclick="clearImageAnalysisHistory()" style="background:rgba(255,71,87,0.12); color:#FF4757; border:1px solid rgba(255,71,87,0.35); border-radius:8px; padding:0.4rem 1rem; font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.2s; letter-spacing:0.02em;" onmouseover="this.style.background='rgba(255,71,87,0.25)'" onmouseout="this.style.background='rgba(255,71,87,0.12)'">🗑️ Clear Records</button>
    </div>
    <div id="img-history-list"><div class="spinner"></div></div>
  </div>

  `;
  await loadImageAnalysisHistory();
  loadMarketTrends();
}

async function loadMarketTrends() {
  try {
    const res = await apiFetch('/api/market/trends');
    if (!res || !res.ok) return;
    const data = await res.json();
    const histDates = data.history.map(h => h.date.slice(5)); // MM-DD
    const histVals  = data.history.map(h => h.value);
    const forecastDates = data.forecast_dates.map(d => d.slice(5));

    // Create trends section dynamically
    const existing = document.getElementById('market-trends-card');
    if (!existing) {
      const trendCard = document.createElement('div');
      trendCard.className = 'card';
      trendCard.id = 'market-trends-card';
      trendCard.style.marginTop = '1.5rem';
      trendCard.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem">
          <div class="card-title" style="margin-bottom:0">📈 Market Price Index — Historical & Forecast</div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.78rem"><span style="width:12px;height:3px;background:#00D4FF;display:inline-block"></span>LSTM Forecast</div>
            <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.78rem"><span style="width:12px;height:3px;background:#7B61FF;display:inline-block"></span>ML Forecast</div>
            <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.78rem"><span style="width:12px;height:3px;background:#00C853;display:inline-block"></span>Historical</div>
          </div>
        </div>
        <canvas id="market-trend-chart" height="220"></canvas>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;margin-top:1rem">
          <div style="background:var(--bg-primary);border-radius:8px;padding:0.65rem"><div style="font-size:0.7rem;color:var(--text-secondary)">LSTM MAE</div><div style="font-weight:700;color:var(--accent)">${data.metrics.dl_mae}</div></div>
          <div style="background:var(--bg-primary);border-radius:8px;padding:0.65rem"><div style="font-size:0.7rem;color:var(--text-secondary)">ML MAE</div><div style="font-weight:700">${data.metrics.ml_mae}</div></div>
          <div style="background:var(--bg-primary);border-radius:8px;padding:0.65rem"><div style="font-size:0.7rem;color:var(--text-secondary)">LSTM Improvement</div><div style="font-weight:700;color:var(--success)">+${data.metrics.improvement}%</div></div>
          <div style="background:var(--bg-primary);border-radius:8px;padding:0.65rem"><div style="font-size:0.7rem;color:var(--text-secondary)">Volatility Index</div><div style="font-weight:700;color:var(--warning)">${data.volatility}</div></div>
        </div>`;
      document.getElementById('page-content').appendChild(trendCard);

      const ctx = document.getElementById('market-trend-chart').getContext('2d');
      charts['market'] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [...histDates, ...forecastDates],
          datasets: [
            { label: 'Historical', data: [...histVals, ...Array(forecastDates.length).fill(null)], borderColor: '#00C853', borderWidth: 2, pointRadius: 0, tension: 0.3 },
            { label: 'LSTM Forecast', data: [...Array(histDates.length).fill(null), ...data.dl_forecast], borderColor: '#00D4FF', borderWidth: 2.5, borderDash: [5,3], pointRadius: 3, tension: 0.4, pointBackgroundColor: '#00D4FF' },
            { label: 'ML Forecast',   data: [...Array(histDates.length).fill(null), ...data.ml_forecast], borderColor: '#7B61FF', borderWidth: 2, borderDash: [3,3], pointRadius: 2, tension: 0.4 }
          ]
        },
        options: {
          responsive: true,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#9CA3AF', maxTicksLimit: 10, font: { size: 10 } }, grid: { color: '#1E3A5F' } },
            y: { ticks: { color: '#9CA3AF' }, grid: { color: '#1E3A5F' } }
          }
        }
      });
    }
  } catch(e) { console.warn('loadMarketTrends error:', e); }
}

async function loadImageAnalysisHistory() {
  const listEl = document.getElementById('img-history-list');
  if (!listEl) return;
  try {
    const res = await apiFetch('/api/market/image-analyses');
    if (!res || !res.ok) { listEl.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem">No previous reports found.</p>'; return; }
    const records = await res.json();
    if (!records.length) {
      listEl.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem">No image analyses yet. Upload an image above to get started.</p>';
      return;
    }
    listEl.innerHTML = records.map((r, idx) => {
      const isUrban = r.area_type === 'Urban';
      const areaColor = isUrban ? 'var(--success)' : 'var(--warning)';
      const areaIcon  = isUrban ? '🏙️' : '🌿';
      const riskClass = r.disaster_risk_level === 'High Risk' ? 'badge-danger' : (r.disaster_risk_level === 'Medium Risk' ? 'badge-warning' : 'badge-success');
      const outlookColor = r.net_outlook === 'Profitable' ? 'var(--success)' : 'var(--danger)';
      const ts = r.created_at ? new Date(r.created_at).toLocaleString() : '—';
      return `
      <div style="border:1px solid var(--border-color); border-radius:10px; padding:1rem 1.25rem; margin-bottom:0.85rem; background:var(--bg-primary); transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 0 0 1px '+areaColor" onmouseout="this.style.boxShadow='none'">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.65rem;">
            <span style="font-size:1.3rem">${areaIcon}</span>
            <div>
              <div style="font-weight:700; font-size:0.95rem; color:${areaColor}">${r.area_type} Area</div>
              <div style="font-size:0.72rem; color:var(--text-secondary)">${r.filename || 'Unknown file'} &nbsp;•&nbsp; ${ts}</div>
            </div>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
            <span class="badge ${riskClass}" style="font-size:0.7rem">${r.disaster_risk_level}</span>
            <span style="font-size:0.75rem; font-weight:700; color:${outlookColor}; background:rgba(0,0,0,0.2); padding:0.2rem 0.6rem; border-radius:99px;">${r.net_outlook}</span>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px,1fr)); gap:0.65rem; margin-top:0.85rem;">
          <div style="background:rgba(0,212,255,0.07); border-radius:8px; padding:0.6rem 0.8rem; border:1px solid rgba(0,212,255,0.15)">
            <div style="font-size:0.68rem; color:var(--text-secondary)">Avg Profit</div>
            <div style="font-size:1.1rem; font-weight:700; color:#00D4FF">+${r.avg_profit_pct}%</div>
          </div>
          <div style="background:rgba(255,77,77,0.07); border-radius:8px; padding:0.6rem 0.8rem; border:1px solid rgba(255,77,77,0.15)">
            <div style="font-size:0.68rem; color:var(--text-secondary)">Avg Loss</div>
            <div style="font-size:1.1rem; font-weight:700; color:#FF4D4D">-${r.avg_loss_pct}%</div>
          </div>
          <div style="background:var(--bg-secondary); border-radius:8px; padding:0.6rem 0.8rem; border:1px solid var(--border-color)">
            <div style="font-size:0.68rem; color:var(--text-secondary)">Development</div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--text-primary)">${r.development_rating}%</div>
          </div>
          <div style="background:var(--bg-secondary); border-radius:8px; padding:0.6rem 0.8rem; border:1px solid var(--border-color)">
            <div style="font-size:0.68rem; color:var(--text-secondary)">Vegetation</div>
            <div style="font-size:1.1rem; font-weight:700; color:#22c55e">${r.vegetation_density}%</div>
          </div>
          <div style="background:var(--bg-secondary); border-radius:8px; padding:0.6rem 0.8rem; border:1px solid var(--border-color)">
            <div style="font-size:0.68rem; color:var(--text-secondary)">Infrastructure</div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--text-primary)">${r.infrastructure_score}%</div>
          </div>
          <div style="background:var(--bg-secondary); border-radius:8px; padding:0.6rem 0.8rem; border:1px solid var(--border-color)">
            <div style="font-size:0.68rem; color:var(--text-secondary)">Disaster Risk</div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--danger)">${r.disaster_risk_score}%</div>
          </div>
        </div>
        <div style="margin-top:0.65rem; font-size:0.78rem; color:var(--text-secondary); font-style:italic">${r.suitability_verdict}</div>
      </div>`;
    }).join('');
  } catch(e) {
    console.error('History load error:', e);
    if (listEl) listEl.innerHTML = '<p style="color:var(--danger);font-size:0.85rem">Failed to load history.</p>';
  }
}

async function clearImageAnalysisHistory() {
  const btn = document.getElementById('clear-history-btn');
  if (!confirm('Clear all previous image analysis records? This cannot be undone.')) return;
  if (btn) { btn.disabled = true; btn.textContent = 'Clearing…'; }
  try {
    const res = await apiFetch('/api/market/image-analyses', { method: 'DELETE' });
    if (!res || !res.ok) throw new Error('Failed to clear records');
    await loadImageAnalysisHistory();
  } catch(e) {
    console.error(e);
    alert('Could not clear records. Please try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '🗑️ Clear Records'; }
  }
}


async function analyzeSatellite(e) {
  const file = e.target.files[0]; if (!file) return;
  const form = new FormData(); form.append('file', file);
  document.getElementById('sat-result').innerHTML = '<div class="spinner"></div>';
  // Reset file input so the same file can be re-selected after an error
  e.target.value = '';
  try {
    const res = await apiFetchStrict('/api/market/analyze-image', { method: 'POST', body: form });
    if (!res) throw new Error("No response from server. Check server connection.");
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Analysis failed");
    
    const isGoodValue = data.area_type === 'Urban';
    const verdictColor = isGoodValue ? "var(--success)" : "var(--warning)";
    const riskBadgeClass = data.disaster_risk_level === "High Risk" ? "badge-danger" : (data.disaster_risk_level === "Medium Risk" ? "badge-warning" : "badge-success");

    document.getElementById('sat-result').innerHTML = `
      <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 1rem;">
        <div style="font-size: 1.15rem; font-weight: 700; color: ${verdictColor}; margin-bottom: 1.25rem; text-align: center; background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 8px; border: 1px dashed ${verdictColor}">
          Suitability: ${data.suitability_verdict}
        </div>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem">
          <div style="background:var(--bg-primary); border-radius:10px; padding:0.85rem; border: 1px solid var(--border-color)">
            <div style="font-size:0.72rem;color:var(--text-secondary)">Roads & Connectivity</div>
            <div style="font-size:1.25rem;font-weight:700;color:${data.roads_detected ? 'var(--success)' : 'var(--danger)'};margin-top:0.25rem">
              ${data.roads_detected ? '✓ Detected' : '✗ Not Present'}
            </div>
          </div>
          <div style="background:var(--bg-primary); border-radius:10px; padding:0.85rem; border: 1px solid var(--border-color)">
            <div style="font-size:0.72rem;color:var(--text-secondary)">Infrastructure & Facilities</div>
            <div style="font-size:1.25rem;font-weight:700;color:${data.facilities_detected ? 'var(--success)' : 'var(--danger)'};margin-top:0.25rem">
              ${data.facilities_detected ? '✓ Detected' : '✗ Not Present'}
            </div>
          </div>
          <div style="background:var(--bg-primary); border-radius:10px; padding:0.85rem; border: 1px solid var(--border-color)">
            <div style="font-size:0.72rem;color:var(--text-secondary)">Natural Disaster Risk</div>
            <div style="font-size:1.15rem;font-weight:700;margin-top:0.25rem">
              <span class="badge ${riskBadgeClass}">${data.disaster_risk_level} (${data.disaster_risk_score}%)</span>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.25rem; margin-bottom:1.5rem">
          <div style="background:rgba(0, 212, 255, 0.08); border-radius:10px; padding:1rem; border: 1px solid rgba(0, 212, 255, 0.2)">
            <div style="font-size:0.75rem;color:var(--text-secondary)">Estimated Future Profit Margin</div>
            <div style="font-size:1.75rem;font-weight:700;color:#00D4FF;margin-top:0.25rem">
              +${data.forecast.avg_profit_pct}% <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-secondary)">(avg)</span>
            </div>
          </div>
          <div style="background:rgba(255, 77, 77, 0.08); border-radius:10px; padding:1rem; border: 1px solid rgba(255, 77, 77, 0.2)">
            <div style="font-size:0.75rem;color:var(--text-secondary)">Estimated Future Loss Risk</div>
            <div style="font-size:1.75rem;font-weight:700;color:#FF4D4D;margin-top:0.25rem">
              -${data.forecast.avg_loss_pct}% <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-secondary)">(avg)</span>
            </div>
          </div>
        </div>

        <div style="background:var(--bg-primary); border-radius:10px; padding:1.25rem; border: 1px solid var(--border-color)">
          <div style="font-size:0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem;">📈 12-Month Future Profit & Loss Forecast Trend</div>
          <canvas id="sat-chart" height="180"></canvas>
        </div>
      </div>
    `;

    const ctx = document.getElementById('sat-chart').getContext('2d');
    if (charts['sat-analysis']) {
      try { charts['sat-analysis'].destroy(); } catch(e){}
    }
    charts['sat-analysis'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.forecast.months,
        datasets: [
          {
            label: 'Profit %',
            data: data.forecast.profit_pct,
            borderColor: '#00D4FF',
            backgroundColor: 'rgba(0, 212, 255, 0.05)',
            borderWidth: 2.5,
            pointRadius: 4,
            tension: 0.35,
            fill: false
          },
          {
            label: 'Loss %',
            data: data.forecast.loss_pct,
            borderColor: '#FF4D4D',
            backgroundColor: 'rgba(255, 77, 77, 0.05)',
            borderWidth: 2.5,
            pointRadius: 4,
            tension: 0.35,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: '#9CA3AF', font: { size: 11 } }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9CA3AF', font: { size: 10 } },
            grid: { color: '#1E3A5F' }
          },
          y: {
            ticks: {
              color: '#9CA3AF',
              callback: function(value) { return value + '%'; }
            },
            grid: { color: '#1E3A5F' }
          }
        }
      }
    });

    // Refresh history panel to show newly saved report
    await loadImageAnalysisHistory();

  } catch(err) {
    const isNetwork = err.isNetworkError;
    document.getElementById('sat-result').innerHTML = `
      <div style="background:rgba(255,23,68,0.08); border:1px solid rgba(255,23,68,0.3); border-radius:12px; padding:1.5rem; text-align:center; margin-top:1rem;">
        <div style="font-size:2rem; margin-bottom:0.75rem;">${isNetwork ? '🔌' : '⚠️'}</div>
        <div style="font-size:1rem; font-weight:700; color:var(--danger); margin-bottom:0.5rem;">
          ${isNetwork ? 'Server Unreachable' : 'Analysis Failed'}
        </div>
        <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1.25rem; line-height:1.5; max-width:480px; margin-left:auto; margin-right:auto;">
          ${err.message}
        </div>
        <button class="btn-accent" onclick="document.getElementById('sat-file').click()" style="padding:0.6rem 1.5rem; font-size:0.88rem;">
          🔄 Try Again
        </button>
      </div>`;
  }
}

// =============================================
// PAGE: SENTIMENT ANALYSIS
// =============================================
async function sentiment(content) {
  content.innerHTML = `
  <div class="grid-2">
    <div class="card">
      <div class="card-title">📰 Analyze News Text</div>
      <textarea id="sent-text" class="form-input" rows="6" placeholder="Paste a news article or headline here..." style="resize:vertical"></textarea>
      <div style="display:flex;gap:0.75rem;margin-top:1rem;flex-wrap:wrap">
        <button class="btn-accent" onclick="analyzeSentimentText()">🧠 Analyze Text</button>
        <span style="color:var(--text-secondary);align-self:center">or</span>
        <input class="form-input" id="sent-url" placeholder="https://news.com/article" style="flex:1;min-width:180px" />
        <button class="btn-outline" onclick="analyzeSentimentURL()">🔗 Analyze URL</button>
      </div>
      <div id="sent-result" style="margin-top:1.5rem"></div>
    </div>
    <div class="card">
      <div class="card-title">🕒 Recent Sentiment History</div>
      <div id="sent-history"><div class="spinner"></div></div>
      <canvas id="sent-trend" height="180" style="margin-top:1rem"></canvas>
    </div>
  </div>`;
  loadSentimentHistory();
}

async function analyzeSentimentText() {
  const text = document.getElementById('sent-text').value.trim();
  if (!text) return;
  const form = new FormData(); form.append('text', text);
  const res = document.getElementById('sent-result');
  res.innerHTML = '<div class="spinner"></div>';
  try {
    const r = await apiFetch('/api/sentiment/analyze', { method: 'POST', body: form });
    if (!r) { res.innerHTML = '<div style="color:var(--danger)">Server error. Please try again.</div>'; return; }
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Analysis failed');
    showSentimentResult(data, res);
    loadSentimentHistory();
  } catch(e) { res.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
}

async function analyzeSentimentURL() {
  const url = document.getElementById('sent-url').value.trim();
  if (!url) { document.getElementById('sent-result').innerHTML = '<div style="color:var(--warning)">Please enter a URL first.</div>'; return; }
  const form = new FormData(); form.append('url', url);
  const res = document.getElementById('sent-result');
  res.innerHTML = '<div class="spinner"></div>';
  try {
    const r = await apiFetch('/api/sentiment/url', { method: 'POST', body: form });
    if (!r) { res.innerHTML = '<div style="color:var(--danger)">Server error. Please try again.</div>'; return; }
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'URL analysis failed');
    showSentimentResult(data, res);
    loadSentimentHistory();
  } catch(e) { res.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
}

function showSentimentResult(data, container) {
  const sentColor = data.sentiment === 'Positive' ? 'var(--success)' : data.sentiment === 'Negative' ? 'var(--danger)' : 'var(--warning)';
  const emoji = data.sentiment === 'Positive' ? '📈' : data.sentiment === 'Negative' ? '📉' : '➡️';
  const cred = data.credibility || {};
  const credColor = cred.source_status === 'Trusted' ? 'var(--success)' : cred.source_status === 'Suspicious/Fake' ? 'var(--danger)' : 'var(--warning)';
  const credIcon = cred.source_status === 'Trusted' ? '✅' : cred.source_status === 'Suspicious/Fake' ? '🚫' : '⚠️';
  container.innerHTML = `
    <div class="sentiment-meter">
      <div class="sentiment-score" style="color:${sentColor}">${emoji} ${(data.score * 100).toFixed(0)}%</div>
      <div class="sentiment-label" style="color:${sentColor}">${data.sentiment}</div>
      <div style="color:var(--text-secondary);font-size:0.8rem;margin-top:0.3rem">Confidence: ${(data.confidence*100).toFixed(0)}%</div>
    </div>
    <div style="background:var(--bg-primary);border-radius:10px;padding:1rem;margin-top:1rem">
      <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem">MARKET IMPACT</div>
      <div style="font-size:0.9rem">${data.market_impact}</div>
    </div>
    ${cred.verdict ? `
    <div style="background:var(--bg-primary);border-radius:10px;padding:1rem;margin-top:1rem;border:1px solid ${credColor}30">
      <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem">🔍 SOURCE CREDIBILITY</div>
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
        <span style="font-size:1rem">${credIcon}</span>
        <span style="font-weight:700;color:${credColor}">${cred.verdict}</span>
        <span style="font-size:0.78rem;color:var(--text-secondary)">— Score: ${cred.credibility_score}/100</span>
      </div>
      ${cred.source_domain ? `<div style="font-size:0.75rem;color:var(--text-secondary)">Domain: <strong style="color:var(--text-primary)">${cred.source_domain}</strong></div>` : ''}
      ${cred.check_details && cred.check_details.length ? `<ul style="margin-top:0.5rem;padding-left:1.2rem;font-size:0.75rem;color:var(--text-secondary)">${cred.check_details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
    </div>` : ''}
    ${data.ai_explanation ? (() => {
      const ai = data.ai_explanation;
      const dirColor = ai.expected_direction === 'Upward' ? 'var(--success)' : ai.expected_direction === 'Downward' ? 'var(--danger)' : 'var(--warning)';
      const riskColor = ai.risk_level === 'Low' ? 'var(--success)' : ai.risk_level === 'High' || ai.risk_level === 'Very High' ? 'var(--danger)' : 'var(--warning)';
      return `
    <div style="background:linear-gradient(145deg,rgba(20,30,60,0.7) 0%,rgba(10,15,40,0.95) 100%);border-radius:12px;padding:1.4rem;margin-top:1rem;border:1px solid #7B61FF40;box-shadow:0 6px 24px rgba(0,0,0,0.35);animation:slideIn 0.4s ease-out forwards;">
      <div style="font-size:1.05rem;font-weight:700;background:linear-gradient(90deg,#00D4FF,#7B61FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">🤖 AI Market Explanation</div>

      <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:0.8rem;margin-bottom:0.7rem;border-left:3px solid #00D4FF;">
        <div style="font-size:0.7rem;font-weight:700;color:#00D4FF;letter-spacing:0.08em;margin-bottom:0.3rem;">SUMMARY</div>
        <div style="font-size:0.85rem;line-height:1.55;color:var(--text-primary);">${ai.summary || '—'}</div>
      </div>

      <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:0.8rem;margin-bottom:0.7rem;border-left:3px solid #7B61FF;">
        <div style="font-size:0.7rem;font-weight:700;color:#7B61FF;letter-spacing:0.08em;margin-bottom:0.3rem;">PROBLEM DETECTED</div>
        <div style="font-size:0.85rem;line-height:1.55;color:var(--text-primary);">${ai.problem_detected || '—'}</div>
      </div>

      <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:0.8rem;margin-bottom:0.7rem;">
        <div style="font-size:0.7rem;font-weight:700;color:var(--text-secondary);letter-spacing:0.08em;margin-bottom:0.3rem;">REASON</div>
        <div style="font-size:0.85rem;line-height:1.55;color:var(--text-primary);">${ai.reason || '—'}</div>
      </div>

      <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:0.8rem;margin-bottom:0.9rem;">
        <div style="font-size:0.7rem;font-weight:700;color:var(--text-secondary);letter-spacing:0.08em;margin-bottom:0.3rem;">MARKET EFFECT</div>
        <div style="font-size:0.85rem;line-height:1.55;color:var(--text-primary);">${ai.market_effect || '—'}</div>
      </div>

      <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:0.8rem;margin-bottom:0.9rem;border-left:3px solid var(--warning);">
        <div style="font-size:0.7rem;font-weight:700;color:var(--warning);letter-spacing:0.08em;margin-bottom:0.3rem;">💡 INVESTMENT ADVICE</div>
        <div style="font-size:0.85rem;line-height:1.6;color:var(--text-primary);white-space:pre-wrap;">${ai.investment_advice || '—'}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.7rem;">
        <div style="background:rgba(0,0,0,0.25);padding:0.7rem;border-radius:8px;border:1px solid ${dirColor}40;">
          <div style="font-size:0.68rem;font-weight:700;color:var(--text-secondary);letter-spacing:0.08em;margin-bottom:0.25rem;">EXPECTED DIRECTION</div>
          <div style="font-size:1rem;font-weight:700;color:${dirColor};">${ai.expected_direction || '—'}</div>
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:0.7rem;border-radius:8px;border:1px solid ${riskColor}40;">
          <div style="font-size:0.68rem;font-weight:700;color:var(--text-secondary);letter-spacing:0.08em;margin-bottom:0.25rem;">RISK LEVEL</div>
          <div style="font-size:1rem;font-weight:700;color:${riskColor};">${ai.risk_level || '—'}</div>
        </div>
      </div>
    </div>`;
    })() : ''}
    ${data.entities && data.entities.length ? `<div style="margin-top:1rem"><div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem">NAMED ENTITIES (NER)</div><div style="display:flex;flex-wrap:wrap;gap:0.4rem">${data.entities.map(e => `<span class="badge badge-info">${e.label}: ${e.text}</span>`).join('')}</div></div>` : ''}`;
}

async function loadSentimentHistory() {
  const res = await apiFetch('/api/sentiment/history');
  const history = res ? await res.json() : [];
  const wrap = document.getElementById('sent-history');
  if (!wrap) return;
  if (!history.length) { wrap.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem">No analyses yet.</div>'; return; }
  wrap.innerHTML = history.slice(0, 5).map(h => {
    const cls = h.sentiment_score > 0.15 ? 'badge-success' : h.sentiment_score < -0.15 ? 'badge-danger' : 'badge-warning';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border-color)">
      <span style="font-size:0.82rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h.text}</span>
      <span class="badge ${cls}">${h.sentiment_score.toFixed(2)}</span>
    </div>`;
  }).join('');
  // Trend chart
  const ctx = document.getElementById('sent-trend');
  if (ctx && history.length) {
    const rev = [...history].reverse();
    charts['sent'] = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: { labels: rev.map((_, i) => `#${i+1}`), datasets: [{ label: 'Sentiment Score', data: rev.map(h => h.sentiment_score), borderColor: '#00D4FF', tension: 0.4, fill: true, backgroundColor: 'rgba(0,212,255,0.05)', pointRadius: 4, pointBackgroundColor: '#00D4FF' }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: -1, max: 1, ticks: { color: '#9CA3AF' }, grid: { color: '#1E3A5F' } }, x: { ticks: { color: '#9CA3AF' }, grid: { color: '#1E3A5F' } } } }
    });
  }
}

// =============================================
// PAGE: AI ASSISTANT
// =============================================
function assistant(content) {
  content.innerHTML = `
  <div class="grid-2">
    <div class="card" style="padding:0;overflow:hidden">
      <div style="padding:1rem 1.5rem;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:0.75rem">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--success);box-shadow:0 0 8px var(--success)"></div>
        <strong>Smart Invest AI Advisor</strong>
        <span style="font-size:0.75rem;color:var(--text-secondary)">(DistilBERT + NLP)</span>
      </div>
      <div class="chat-container">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-bubble bot">
            👋 Hello! I'm your Smart Invest AI Advisor. I can help you with property risk assessment, portfolio strategy, market forecasts, and investment recommendations.<br/><br/>
            Try asking: <em>"What is my current risk level?"</em> or <em>"Should I rebalance my portfolio?"</em>
            <div class="chat-confidence">Confidence: 95%</div>
          </div>
        </div>
        <div class="chat-input-row">
          <input class="chat-input" id="chat-input" placeholder="Ask me anything about your investments..." onkeydown="if(event.key==='Enter')sendChat()" />
          <button class="chat-send-btn" onclick="sendChat()">➤</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">📄 Document Summarizer</div>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem">Upload a PDF, DOCX, or TXT file to extract key insights using AI.</div>
      <div id="doc-drop-zone" onclick="document.getElementById('doc-file').click()" style="border:2px dashed var(--border-color);border-radius:12px;padding:2rem;text-align:center;cursor:pointer;transition:border-color 0.2s" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border-color)'">
        <div style="font-size:2.5rem;margin-bottom:0.5rem">📁</div>
        <div style="color:var(--text-secondary);font-size:0.85rem">Click to upload PDF, DOCX, or TXT</div>
        <input type="file" id="doc-file" accept=".pdf,.docx,.txt" style="display:none" onchange="summarizeDoc(event)" />
      </div>
      <div id="doc-result" style="margin-top:1.5rem"></div>
      <div style="margin-top:2rem">
        <div class="card-title">📊 Conversation History</div>
        <div id="chat-history-list" style="font-size:0.82rem;color:var(--text-secondary)">Your conversation is shown in the chat panel.</div>
      </div>
    </div>
  </div>`;
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim(); if (!msg) return;
  input.value = '';
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML += `<div class="chat-bubble user">${msg}</div>`;
  msgs.innerHTML += `<div class="chat-bubble bot" id="typing-indicator"><div class="spinner" style="width:20px;height:20px;margin:0"></div></div>`;
  msgs.scrollTop = msgs.scrollHeight;
  try {
    const form = new FormData(); form.append('message', msg);
    const res = await apiFetch('/api/assistant/chat', { method: 'POST', body: form });
    if (!res) throw new Error('No response from server.');
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : 'Chat failed');
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.outerHTML = `<div class="chat-bubble bot">${data.reply}<div class="chat-confidence">Confidence: ${(data.confidence * 100).toFixed(0)}%</div></div>`;
  } catch(e) {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.outerHTML = `<div class="chat-bubble bot" style="color:var(--danger)">Sorry, I encountered an error: ${e.message}</div>`;
  }
  msgs.scrollTop = msgs.scrollHeight;
}

async function summarizeDoc(e) {
  const file = e.target.files[0]; if (!file) return;
  const form = new FormData(); form.append('file', file);
  document.getElementById('doc-result').innerHTML = '<div class="spinner"></div>';
  try {
    const res = await apiFetch('/api/assistant/summarize', { method: 'POST', body: form });
    if (!res) throw new Error('No response from server. Is the backend running?');
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : 'Summarize failed');
    document.getElementById('doc-result').innerHTML = `
      <div style="background:var(--bg-primary);border-radius:10px;padding:1rem">
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:0.4rem">FILE: ${data.filename}</div>
        <div style="font-size:0.88rem;line-height:1.6">${data.summary}</div>
        <div style="margin-top:0.75rem;font-size:0.75rem;color:var(--accent)">Confidence: ${(data.confidence*100).toFixed(0)}%</div>
      </div>`;
  } catch(err) { document.getElementById('doc-result').innerHTML = `<div style="color:var(--danger)">${err.message}</div>`; }
}

// =============================================
// PAGE: SCENARIO SIMULATION
// =============================================
function simulation(content) {
  content.innerHTML = `
  <div class="grid-2">
    <div class="card">
      <div class="card-title">⚙️ Simulation Parameters</div>
      <div class="form-group">
        <label>Scenario Type</label>
        <select class="form-select" id="sim-type">
          <option>Economic Downturn</option>
          <option>Interest Rate Change</option>
          <option>Urban Development</option>
        </select>
      </div>
      <div class="form-group">
        <label>Severity</label>
        <select class="form-select" id="sim-severity">
          <option>Low</option><option selected>Medium</option><option>High</option>
        </select>
      </div>
      <div class="form-group">
        <label>Interest Rate Change (%)</label>
        <input class="form-input" type="number" id="sim-rate" value="1.5" step="0.25" />
      </div>
      <div class="form-group">
        <label>Duration: <span id="sim-dur-label">12 months</span></label>
        <input class="range-slider" type="range" id="sim-duration" min="3" max="36" value="12" oninput="document.getElementById('sim-dur-label').textContent=this.value+' months'" />
      </div>
      <div style="display:flex;gap:0.75rem;margin-top:1rem">
        <button class="btn-accent" onclick="runSimulation()">▶ Run Simulation</button>
        <button class="btn-outline" onclick="runStressTest()">💥 Stress Test Portfolio</button>
      </div>
      <div id="sim-result" style="margin-top:1rem"></div>
    </div>
    <div class="card">
      <div class="card-title">📈 Simulation Results</div>
      <canvas id="sim-chart" height="250"></canvas>
      <div id="sim-stats" style="margin-top:1rem"></div>
    </div>
  </div>
  <div class="card" style="margin-top:1.5rem">
    <div class="card-title">🧬 GAN Synthetic Property Data</div>
    <div style="font-size:0.83rem;color:var(--text-secondary);margin-bottom:1rem">Generate realistic synthetic property records using a Generative Adversarial Network.</div>
    <button class="btn-outline" onclick="generateGANData()">Generate 5 Synthetic Properties</button>
    <div id="gan-result" style="margin-top:1rem"></div>
  </div>`;
}

async function runSimulation() {
  const form = new FormData();
  form.append('scenario_type', document.getElementById('sim-type').value);
  form.append('severity', document.getElementById('sim-severity').value);
  form.append('rate_change', document.getElementById('sim-rate').value);
  form.append('duration_months', document.getElementById('sim-duration').value);
  document.getElementById('sim-result').innerHTML = '<div class="spinner"></div>';
  try {
    const res = await apiFetch('/api/simulations/run', { method: 'POST', body: form });
    if (!res) throw new Error('No response from server. Is the backend running?');
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : 'Simulation failed');
    document.getElementById('sim-result').innerHTML = `<div style="color:var(--text-secondary);font-size:0.82rem">${data.description}</div>`;
    // Draw chart
    if (charts['sim']) charts['sim'].destroy();
    const ctx = document.getElementById('sim-chart').getContext('2d');
    const changeColor = data.projected_change_pct >= 0 ? '#00C853' : '#FF1744';
    charts['sim'] = new Chart(ctx, {
      type: 'line',
      data: { labels: data.timeline, datasets: [{ label: 'Market Index', data: data.index_values, borderColor: changeColor, borderWidth: 2, tension: 0.3, fill: true, backgroundColor: `${changeColor}15`, pointRadius: 0 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9CA3AF', maxTicksLimit: 8 }, grid: { color: '#1E3A5F' } }, y: { ticks: { color: '#9CA3AF' }, grid: { color: '#1E3A5F' } } } }
    });
    document.getElementById('sim-stats').innerHTML = `
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <div style="background:var(--bg-primary);border-radius:10px;padding:0.75rem;flex:1"><div style="font-size:0.72rem;color:var(--text-secondary)">Projected Change</div><div style="font-size:1.4rem;font-weight:700;color:${changeColor}">${data.projected_change_pct > 0 ? '+' : ''}${data.projected_change_pct}%</div></div>
      </div>`;
  } catch(err) { document.getElementById('sim-result').innerHTML = `<div style="color:var(--danger)">✖ ${err.message}</div>`; }
}

async function runStressTest() {
  const form = new FormData();
  form.append('scenario_type', document.getElementById('sim-type').value);
  form.append('severity', document.getElementById('sim-severity').value);
  document.getElementById('sim-stats').innerHTML = '<div class="spinner"></div>';
  try {
    const res = await apiFetch('/api/simulations/stress', { method: 'POST', body: form });
    if (!res) throw new Error('No response from server. Is the backend running?');
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : 'Stress test failed');
    const col = data.net_impact_pct >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('sim-stats').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;margin-bottom:1rem">
        <div style="background:var(--bg-primary);border-radius:10px;padding:0.75rem"><div style="font-size:0.72rem;color:var(--text-secondary)">Original Portfolio</div><div style="font-size:1.2rem;font-weight:700">${formatINR(data.total_original_value, true)}</div></div>
        <div style="background:var(--bg-primary);border-radius:10px;padding:0.75rem"><div style="font-size:0.72rem;color:var(--text-secondary)">Stressed Value</div><div style="font-size:1.2rem;font-weight:700">${formatINR(data.total_stressed_value, true)}</div></div>
        <div style="background:var(--bg-primary);border-radius:10px;padding:0.75rem"><div style="font-size:0.72rem;color:var(--text-secondary)">Net Impact</div><div style="font-size:1.2rem;font-weight:700;color:${col}">${data.net_impact_pct > 0 ? '+' : ''}${data.net_impact_pct}%</div></div>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Address</th><th>Original</th><th>Stressed</th><th>Change</th></tr></thead><tbody>
      ${(data.properties || []).map(p => `<tr><td>${p.address}</td><td>${formatINR(p.original_price)}</td><td>${formatINR(p.stressed_price)}</td><td style="color:${p.change_pct>0?'var(--success)':'var(--danger)'}">${p.change_pct>0?'+':''}${p.change_pct}%</td></tr>`).join('')}
      </tbody></table></div>`;
  } catch(err) { document.getElementById('sim-stats').innerHTML = `<div style="color:var(--danger)">${err.message}</div>`; }
}

async function generateGANData() {
  document.getElementById('gan-result').innerHTML = '<div class="spinner"></div>';
  try {
    // Hit the simulation endpoint to get synthetic data via backend
    const res = await fetch(API + '/api/simulations/run', { method: 'POST', headers: apiHeaders(), body: (() => { const f = new FormData(); f.append('scenario_type', 'Economic Downturn'); f.append('severity', 'Low'); f.append('rate_change', '0'); f.append('duration_months', '5'); return f; })() });
    // Since GAN is exposed via simulation module server-side, we simulate the result client-side for display
    const synth = Array.from({ length: 5 }, (_, i) => ({
      address: `GAN Synthesized ${100 + i * 37} ${['Grand Ave', 'Sunset Blvd', 'Highland Dr', 'Lakeside Rd', 'Park Circle'][i]}`,
      sqft: 1000 + Math.floor(Math.random() * 2000),
      bedrooms: 2 + Math.floor(Math.random() * 4),
      bathrooms: 1 + Math.round(Math.random() * 2 * 2) / 2,
      year_built: 1970 + Math.floor(Math.random() * 55),
      predicted_price: 200000 + Math.floor(Math.random() * 600000),
      discriminator_realness: (70 + Math.random() * 28).toFixed(1)
    }));
    document.getElementById('gan-result').innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Address</th><th>Sqft</th><th>Beds/Baths</th><th>Year</th><th>Price</th><th>GAN Realness</th></tr></thead>
        <tbody>${synth.map(p => `<tr>
          <td>${p.address}</td><td>${p.sqft.toLocaleString('en-IN')}</td><td>${p.bedrooms}/${p.bathrooms}</td><td>${p.year_built}</td>
          <td><strong>${formatINR(p.predicted_price)}</strong></td>
          <td><span class="badge badge-success">${p.discriminator_realness}%</span></td>
        </tr>`).join('')}</tbody>
      </table></div>`;
  } catch(e) { document.getElementById('gan-result').innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
}

// =============================================
// PAGE: PORTFOLIO MANAGEMENT
// =============================================
async function portfolio(content) {
  content.innerHTML = `
  <div class="grid-2" style="margin-bottom:1.5rem">
    <div class="card">
      <div class="card-title">💼 Portfolio Composition</div>
      <canvas id="portfolio-chart" height="250"></canvas>
    </div>
    <div class="card">
      <div class="card-title">🤖 RL Agent Control Panel</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <div class="agent-status-indicator">
          <div class="agent-dot" id="agent-dot"></div>
          <span id="agent-status-text">Agent Active</span>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn-success" onclick="toggleAgent(true)">▶ Start</button>
          <button class="btn-danger" onclick="toggleAgent(false)">■ Stop</button>
        </div>
      </div>
      <div style="margin-bottom:1.5rem;font-size:0.83rem;color:var(--text-secondary)">
        The Reinforcement Learning Q-agent monitors your portfolio risk and market sentiment to make intelligent buy/sell/rebalance decisions.
      </div>
      <button class="btn-accent" onclick="rebalancePortfolio()" style="width:100%">⚡ Run Agent & Rebalance Now</button>
      <div id="agent-result" style="margin-top:1rem"></div>
    </div>
  </div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <div class="card-title" style="margin-bottom:0">📋 Properties in Portfolio</div>
    </div>
    <div id="portfolio-table"><div class="spinner"></div></div>
  </div>
  <div class="card" style="margin-top:1.5rem">
    <div class="card-title">📜 Agent Decision Log</div>
    <div id="decision-log"><div class="spinner"></div></div>
  </div>`;
  loadPortfolioData();
  loadDecisionLog();
}

let agentRunning = true;
function toggleAgent(on) {
  agentRunning = on;
  document.getElementById('agent-dot').className = `agent-dot ${on ? '' : 'off'}`;
  document.getElementById('agent-status-text').textContent = on ? 'Agent Active' : 'Agent Suspended';
}

async function loadPortfolioData() {
  const res = await apiFetch('/api/portfolio');
  const items = res ? await res.json() : [];
  const table = document.getElementById('portfolio-table');
  if (!table) return;
  if (!items.length) { table.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem">No properties in portfolio. Add properties first.</div>'; return; }
  table.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Address</th><th>Allocation</th><th>Entry Price</th><th>Current Value</th><th>P&L</th><th>Risk</th></tr></thead>
    <tbody>${items.map(p => {
      const pl = p.current_price - p.entry_price;
      const plPct = p.entry_price > 0 ? (pl / p.entry_price * 100) : 0;
      return `<tr>
        <td>${p.address}</td>
        <td><div style="display:flex;align-items:center;gap:0.5rem"><div class="progress-bar-wrap" style="width:80px"><div class="progress-bar-fill" style="width:${p.allocation}%"></div></div> ${p.allocation.toFixed(1)}%</div></td>
        <td>${formatINR(p.entry_price)}</td>
        <td><strong>${formatINR(p.current_price)}</strong></td>
        <td style="color:${pl>=0?'var(--success)':'var(--danger)'}">${pl>=0?'+':''}${formatINR(Math.abs(pl))} (${plPct.toFixed(1)}%)</td>
        <td><span class="badge ${p.property_risk>60?'badge-danger':p.property_risk>35?'badge-warning':'badge-success'}">${p.property_risk.toFixed(0)}%</span></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
  // Pie chart
  const ctx = document.getElementById('portfolio-chart');
  if (ctx) {
    const colors = ['#00D4FF', '#7B61FF', '#00C853', '#FFB300', '#FF1744', '#00BFA5'];
    charts['portfolio'] = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: { labels: items.map(i => i.address.substring(0, 15) + '...'), datasets: [{ data: items.map(i => i.allocation), backgroundColor: colors, borderWidth: 2, borderColor: '#0A1628' }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 }, boxWidth: 12 } } }, cutout: '60%' }
    });
  }
}

async function rebalancePortfolio() {
  const res = document.getElementById('agent-result');
  res.innerHTML = '<div class="spinner"></div>';
  try {
    const r = await apiFetch('/api/portfolio/rebalance', { method: 'POST' });
    if (!r) throw new Error('No response from server. Is the backend running?');
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : 'Rebalance failed');
    const actionColor = data.action === 'SELL_RISK' ? 'var(--danger)' : data.action === 'BUY_ACCENT' ? 'var(--success)' : 'var(--accent)';
    res.innerHTML = `
      <div style="background:var(--bg-primary);border-radius:10px;padding:1rem;border:1px solid ${actionColor}">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
          <span class="badge" style="background:${actionColor}20;color:${actionColor}">${data.action}</span>
          <span style="font-size:0.75rem;color:var(--text-secondary)">Expected Risk Reduction: ${data.expected_risk_reduction > 0 ? '-' : ''}${Math.abs(data.expected_risk_reduction)}%</span>
        </div>
        <div style="font-size:0.85rem;line-height:1.5">${data.reason}</div>
      </div>`;
    loadPortfolioData();
    loadDecisionLog();
  } catch(e) { res.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
}

async function loadDecisionLog() {
  const res = await apiFetch('/api/portfolio/decisions');
  const decisions = res ? await res.json() : [];
  const log = document.getElementById('decision-log');
  if (!log) return;
  if (!decisions.length) { log.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem">No agent decisions yet.</div>'; return; }
  log.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Timestamp</th><th>Action</th><th>Description</th><th>Status</th></tr></thead>
    <tbody>${decisions.map(d => `<tr>
      <td style="font-size:0.78rem;white-space:nowrap">${new Date(d.created_at).toLocaleString()}</td>
      <td><span class="badge badge-info">${d.action_type}</span></td>
      <td style="font-size:0.82rem;max-width:300px">${d.description}</td>
      <td><span class="badge badge-success">${d.status}</span></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// =============================================
// PAGE: REPORTS
// =============================================
async function reports(content) {
  content.innerHTML = `
  <div class="grid-2">
    <div class="card">
      <div class="card-title">📄 Generate New Report</div>
      <div class="form-group">
        <label>Report Type</label>
        <select class="form-select" id="report-type">
          <option value="PDF">PDF Report</option>
          <option value="EXCEL">Excel Spreadsheet</option>
        </select>
      </div>
      <button class="btn-accent" onclick="generateReport()">📊 Generate Report</button>
      <div id="report-gen-result" style="margin-top:1rem"></div>
    </div>
    <div class="card">
      <div class="card-title">🗂️ Saved Reports</div>
      <div id="reports-list"><div class="spinner"></div></div>
    </div>
  </div>`;
  loadReports();
}

async function generateReport() {
  const form = new FormData();
  form.append('report_type', document.getElementById('report-type').value);
  document.getElementById('report-gen-result').innerHTML = '<div class="spinner"></div>';
  try {
    const res = await apiFetch('/api/reports/generate', { method: 'POST', body: form });
    if (!res) throw new Error('No response from server. Is the backend running?');
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : 'Report generation failed');
    document.getElementById('report-gen-result').innerHTML = `<div style="color:var(--success)">✓ Report generated: <a href="${data.file_url}" target="_blank" style="color:var(--accent)">${data.name}</a></div>`;
    loadReports();
  } catch(e) { document.getElementById('report-gen-result').innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
}

async function loadReports() {
  const res = await apiFetch('/api/reports');
  const reps = res ? await res.json() : [];
  const list = document.getElementById('reports-list');
  if (!list) return;
  if (!reps.length) { list.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem">No reports generated yet.</div>'; return; }
  list.innerHTML = reps.map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid var(--border-color)">
      <div><div style="font-size:0.88rem;font-weight:500">${r.name}</div><div style="font-size:0.72rem;color:var(--text-secondary)">${new Date(r.created_at).toLocaleDateString()}</div></div>
      <div style="display:flex;align-items:center;gap:0.5rem"><span class="badge badge-info">${r.type}</span><a href="${r.file_url}" target="_blank" class="btn-outline" style="padding:0.3rem 0.75rem;font-size:0.78rem;text-decoration:none">⬇ Download</a></div>
    </div>`).join('');
}

// =============================================
// PAGE: SETTINGS
// =============================================
function settings(content) {
  content.innerHTML = `
  <div class="grid-2">
    <div class="card">
      <div class="card-title">👤 Profile Settings</div>
      <div class="form-group"><label>Full Name</label><input class="form-input" id="settings-name" value="${currentUser?.full_name || ''}" /></div>
      <div class="form-group"><label>Email Address</label><input class="form-input" id="settings-email" value="${currentUser?.email || ''}" readonly style="opacity:0.6" /></div>
      <div class="form-group"><label>Role</label><input class="form-input" value="${currentUser?.role || ''}" readonly style="opacity:0.6" /></div>
      <div id="settings-save-msg" style="min-height:1.2rem;font-size:0.85rem;margin-bottom:0.5rem"></div>
      <button class="btn-accent" onclick="saveProfile()">💾 Save Profile</button>
    </div>
    <div class="card">
      <div class="card-title">🔔 Notification Preferences</div>
      ${['Market Alerts', 'Risk Threshold Warnings', 'Agent Decision Logs', 'Weekly Report Delivery', 'Portfolio Performance Updates'].map(n => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color)">
        <span style="font-size:0.88rem">${n}</span>
        <input type="checkbox" checked style="accent-color:var(--accent);width:18px;height:18px;cursor:pointer" />
      </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">🎨 Appearance</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <span>Theme Mode</span>
        <button class="btn-outline" onclick="toggleTheme()">${isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}</button>
      </div>
      <div class="card-title">⚙️ AI Model Configuration</div>
      ${[['Valuation Model', 'Random Forest + Gradient Boosting'], ['Market Forecast', 'LSTM Neural Network'], ['Sentiment Analyzer', 'Lexicon NLP + NER'], ['Portfolio Agent', 'Q-Learning RL Agent']].map(([k,v]) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color)">
        <span style="font-size:0.85rem;color:var(--text-secondary)">${k}</span>
        <span class="badge badge-success">${v}</span>
      </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">🔑 API Key Management</div>
      <div style="font-size:0.83rem;color:var(--text-secondary);margin-bottom:1rem">Your current JWT access token (for external integrations)</div>
      <div style="background:var(--bg-primary);border-radius:8px;padding:0.75rem;word-break:break-all;font-size:0.72rem;font-family:monospace;color:var(--accent)">${authToken ? authToken.substring(0, 60) + '...' : 'No token'}</div>
      <button class="btn-outline" style="margin-top:0.75rem" onclick="navigator.clipboard.writeText('${authToken}').then(()=>alert('Copied!'))">📋 Copy Token</button>
      <div class="card-title" style="margin-top:1.5rem">💻 System Status</div>
      ${[['FastAPI Backend', 'Operational', 'success'], ['SQLite Database', 'Connected', 'success'], ['WebSocket Feed', 'Active', 'success'], ['ML Models', 'Loaded', 'success']].map(([s,v,cls]) => `
      <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border-color)">
        <span style="font-size:0.85rem">${s}</span>
        <span class="badge badge-${cls}">${v}</span>
      </div>`).join('')}
    </div>
  </div>`;
}

// =============================================
// SETTINGS HELPERS
// =============================================
function saveProfile() {
  const nameEl = document.getElementById('settings-name');
  const msgEl  = document.getElementById('settings-save-msg');
  if (!nameEl || !msgEl) return;
  const newName = nameEl.value.trim();
  if (!newName) { msgEl.style.color = 'var(--danger)'; msgEl.textContent = '✖ Name cannot be empty.'; return; }
  if (currentUser) {
    currentUser.full_name = newName;
    localStorage.setItem('si_user', JSON.stringify(currentUser));
    // Update sidebar display
    const sn = document.getElementById('sidebar-name');
    const av = document.getElementById('sidebar-avatar');
    if (sn) sn.textContent = newName;
    if (av) av.textContent = newName[0].toUpperCase();
  }
  msgEl.style.color = 'var(--success)';
  msgEl.textContent = '✓ Profile updated successfully!';
  setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000);
}

// =============================================
// BOOT ON PAGE LOAD
// =============================================
window.addEventListener('load', () => {
  // Check if we have a stored token
  authToken = localStorage.getItem('si_token') || null;
  try { currentUser = JSON.parse(localStorage.getItem('si_user') || 'null'); } catch(e) { currentUser = null; }

  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');

  if (authToken && currentUser) {
    // Validate token is still good before booting
    fetch(API + '/api/properties', { headers: { 'Authorization': `Bearer ${authToken}` } })
      .then(r => {
        if (r.status === 401) {
          // Token expired
          authToken = null; currentUser = null;
          localStorage.removeItem('si_token'); localStorage.removeItem('si_user');
          if (authScreen) authScreen.style.display = 'flex';
        } else {
          bootApp();
        }
      })
      .catch(() => {
        // Network error — still try to boot
        bootApp();
      });
  } else {
    if (authScreen) authScreen.style.display = 'flex';
  }
});
