// Store Owner Delivery Serviceability, India Post 6-Digit PIN Code Directory & Product Inquiry CRM

const INDIA_POST_2DIGIT_STATES = {
  '11': { state: 'Delhi', district: 'New Delhi' },
  '12': { state: 'Haryana', district: 'Gurugram / Faridabad' },
  '13': { state: 'Haryana', district: 'Ambala / Karnal' },
  '14': { state: 'Punjab', district: 'Ludhiana / Jalandhar' },
  '15': { state: 'Punjab', district: 'Bathinda / Patiala' },
  '16': { state: 'Chandigarh', district: 'Chandigarh UT' },
  '17': { state: 'Himachal Pradesh', district: 'Shimla / Kangra' },
  '18': { state: 'Jammu & Kashmir', district: 'Jammu' },
  '19': { state: 'Jammu & Kashmir', district: 'Srinagar' },
  '20': { state: 'Uttar Pradesh', district: 'Noida / Gautam Buddha Nagar' },
  '21': { state: 'Uttar Pradesh', district: 'Prayagraj / Kanpur' },
  '22': { state: 'Uttar Pradesh', district: 'Lucknow / Ayodhya' },
  '23': { state: 'Uttar Pradesh', district: 'Mirzapur / Varanasi' },
  '24': { state: 'Uttar Pradesh', district: 'Bareilly / Moradabad' },
  '25': { state: 'Uttar Pradesh', district: 'Meerut / Saharanpur' },
  '26': { state: 'Uttarakhand', district: 'Dehradun / Nainital' },
  '27': { state: 'Uttar Pradesh', district: 'Gorakhpur / Basti' },
  '28': { state: 'Uttar Pradesh', district: 'Agra / Jhansi' },
  '30': { state: 'Rajasthan', district: 'Jaipur / Ajmer / Alwar' },
  '31': { state: 'Rajasthan', district: 'Udaipur / Bhilwara / Chittorgarh' },
  '32': { state: 'Rajasthan', district: 'Kota / Bharatpur / Sawai Madhopur' },
  '33': { state: 'Rajasthan', district: 'Bikaner / Sikar / Jhunjhunu' },
  '34': { state: 'Rajasthan', district: 'Jodhpur / Jaisalmer / Barmer' },
  '36': { state: 'Gujarat', district: 'Rajkot / Jamnagar' },
  '37': { state: 'Gujarat', district: 'Kutch / Bhuj' },
  '38': { state: 'Gujarat', district: 'Ahmedabad / Gandhinagar' },
  '39': { state: 'Gujarat', district: 'Surat / Vadodara' },
  '40': { state: 'Maharashtra', district: 'Mumbai / Thane / Goa' },
  '41': { state: 'Maharashtra', district: 'Pune / Satara / Kolhapur' },
  '42': { state: 'Maharashtra', district: 'Nashik / Jalgaon' },
  '43': { state: 'Maharashtra', district: 'Chhatrapati Sambhajinagar / Nanded' },
  '44': { state: 'Maharashtra', district: 'Nagpur / Amravati' },
  '45': { state: 'Madhya Pradesh', district: 'Indore / Ujjain' },
  '46': { state: 'Madhya Pradesh', district: 'Bhopal / Gwalior' },
  '47': { state: 'Madhya Pradesh', district: 'Gwalior / Sagar' },
  '48': { state: 'Madhya Pradesh', district: 'Jabalpur / Rewa' },
  '49': { state: 'Chhattisgarh', district: 'Raipur / Bilaspur' },
  '50': { state: 'Telangana', district: 'Hyderabad / Secunderabad' },
  '51': { state: 'Andhra Pradesh', district: 'Tirupati / Kurnool' },
  '52': { state: 'Andhra Pradesh', district: 'Vijayawada / Guntur' },
  '53': { state: 'Andhra Pradesh', district: 'Visakhapatnam / Rajahmundry' },
  '56': { state: 'Karnataka', district: 'Bengaluru Urban' },
  '57': { state: 'Karnataka', district: 'Mysuru / Mangaluru' },
  '58': { state: 'Karnataka', district: 'Hubballi / Belagavi' },
  '59': { state: 'Karnataka', district: 'Belagavi' },
  '60': { state: 'Tamil Nadu', district: 'Chennai / Puducherry' },
  '61': { state: 'Tamil Nadu', district: 'Thanjavur / Tiruchirappalli' },
  '62': { state: 'Tamil Nadu', district: 'Madurai / Tirunelveli' },
  '63': { state: 'Tamil Nadu', district: 'Salem / Vellore' },
  '64': { state: 'Tamil Nadu', district: 'Coimbatore / Ooty' },
  '67': { state: 'Kerala', district: 'Kozhikode / Kannur' },
  '68': { state: 'Kerala', district: 'Kochi / Ernakulam' },
  '69': { state: 'Kerala', district: 'Thiruvananthapuram / Kollam' },
  '70': { state: 'West Bengal', district: 'Kolkata / Howrah' },
  '71': { state: 'West Bengal', district: 'Burdwan / Durgapur' },
  '72': { state: 'West Bengal', district: 'Midnapore / Kharagpur' },
  '73': { state: 'West Bengal', district: 'Darjeeling / Siliguri' },
  '74': { state: 'West Bengal', district: 'Nadia / Murshidabad' },
  '75': { state: 'Odisha', district: 'Bhubaneswar / Cuttack' },
  '76': { state: 'Odisha', district: 'Rourkela / Sambalpur' },
  '77': { state: 'Odisha', district: 'Jharsuguda' },
  '78': { state: 'Assam', district: 'Guwahati / Dispur' },
  '79': { state: 'North East', district: 'Shillong / Imphal / Agartala' },
  '80': { state: 'Bihar', district: 'Patna / Nalanda' },
  '81': { state: 'Bihar', district: 'Bhagalpur / Munger' },
  '82': { state: 'Bihar', district: 'Gaya / Dhanbad' },
  '83': { state: 'Jharkhand', district: 'Ranchi / Jamshedpur' },
  '84': { state: 'Bihar', district: 'Muzaffarpur / Darbhanga' },
  '85': { state: 'Bihar', district: 'Purnia / Katihar' },
};

const SPECIFIC_3DIGIT_DISTRICTS = {
  '301': 'Alwar',
  '302': 'Jaipur',
  '303': 'Jaipur Rural / Dausa',
  '304': 'Tonk / Sawai Madhopur',
  '305': 'Ajmer',
  '306': 'Pali',
  '307': 'Sirohi / Mount Abu',
  '311': 'Bhilwara',
  '312': 'Chittorgarh',
  '313': 'Udaipur',
  '321': 'Bharatpur',
  '324': 'Kota',
  '332': 'Sikar',
  '334': 'Bikaner',
  '342': 'Jodhpur',
  '110': 'New Delhi',
  '122': 'Gurugram',
  '201': 'Noida / Ghaziabad',
  '380': 'Ahmedabad',
  '395': 'Surat',
  '400': 'Mumbai',
  '411': 'Pune',
  '500': 'Hyderabad',
  '560': 'Bengaluru',
  '600': 'Chennai',
  '700': 'Kolkata',
};

const BOGUS_PINCODES = new Set([
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '654321',
]);

let deliveryConfig = {
  mode: 'ALL_INDIA', // 'ALL_INDIA' | 'SELECTED_STATES' | 'CUSTOM_PINCODES'
  serviceableStates: [
    'Rajasthan',
    'Delhi',
    'Haryana',
    'Uttar Pradesh',
    'Maharashtra',
    'Gujarat',
    'Madhya Pradesh',
    'Punjab',
    'Karnataka',
    'Tamil Nadu',
    'Telangana',
    'West Bengal',
  ],
  customPincodes: [
    '302001',
    '302002',
    '302003',
    '302004',
    '302015',
    '302017',
    '302019',
    '302020',
    '302021',
    '305001',
    '313001',
    '342001',
    '110001',
    '400001',
    '560001',
  ],
  blockedPincodes: [],
  expressEtaDays: 2,
  standardEtaDays: 5,
  ownerEmail: 'prakashgothwal370@gmail.com',
  ownerWhatsApp: '919876543210',
};

const productInquiries = [];
const ownerOrderDispatches = [];

function getDeliveryConfig() {
  return { ...deliveryConfig };
}

function updateDeliveryConfig(patch = {}) {
  if (
    patch.mode === 'ALL_INDIA' ||
    patch.mode === 'SELECTED_STATES' ||
    patch.mode === 'CUSTOM_PINCODES'
  ) {
    deliveryConfig.mode = patch.mode;
  }
  if (Array.isArray(patch.serviceableStates)) {
    deliveryConfig.serviceableStates = patch.serviceableStates
      .map((s) => String(s || '').trim())
      .filter(Boolean);
  }
  if (Array.isArray(patch.customPincodes)) {
    deliveryConfig.customPincodes = patch.customPincodes
      .map((p) => String(p || '').replace(/\D/g, ''))
      .filter((p) => p.length >= 3 && p.length <= 6);
  }
  if (Array.isArray(patch.blockedPincodes)) {
    deliveryConfig.blockedPincodes = patch.blockedPincodes
      .map((p) => String(p || '').replace(/\D/g, ''))
      .filter((p) => p.length === 6);
  }
  if (typeof patch.expressEtaDays === 'number') {
    deliveryConfig.expressEtaDays = Math.max(1, Math.min(15, Math.round(patch.expressEtaDays)));
  }
  if (typeof patch.standardEtaDays === 'number') {
    deliveryConfig.standardEtaDays = Math.max(2, Math.min(20, Math.round(patch.standardEtaDays)));
  }
  if (patch.ownerEmail) {
    deliveryConfig.ownerEmail = String(patch.ownerEmail).trim().toLowerCase();
  }
  if (patch.ownerWhatsApp) {
    deliveryConfig.ownerWhatsApp = String(patch.ownerWhatsApp).replace(/\D/g, '');
  }
  return getDeliveryConfig();
}

function checkPincodeServiceability(rawPincode, rawAddress) {
  const pincode = String(rawPincode || '').replace(/\D/g, '').trim();
  if (!/^[1-9][0-9]{5}$/.test(pincode) || BOGUS_PINCODES.has(pincode)) {
    return {
      valid: false,
      serviceable: false,
      pincode,
      message_en:
        'Invalid Indian PIN code. Please enter a genuine 6-digit India Post PIN code (e.g. 302001).',
      message_hi:
        'अमान्य पिनकोड। कृपया सही 6-अंकों का भारतीय डाक पिनकोड दर्ज करें (जैसे 302001)।',
    };
  }

  const prefix2 = pincode.slice(0, 2);
  const prefix3 = pincode.slice(0, 3);
  const region = INDIA_POST_2DIGIT_STATES[prefix2];
  if (!region) {
    return {
      valid: false,
      serviceable: false,
      pincode,
      message_en: `PIN code ${pincode} does not belong to any active India Post postal circle.`,
      message_hi: `पिनकोड ${pincode} किसी भी मान्य भारतीय डाक सर्कल से मेल नहीं खाता।`,
    };
  }

  const district = SPECIFIC_3DIGIT_DISTRICTS[prefix3] || region.district;
  const state = region.state;

  if (deliveryConfig.blockedPincodes.includes(pincode)) {
    return {
      valid: true,
      serviceable: false,
      pincode,
      district,
      state,
      message_en: `Delivery to PIN ${pincode} (${district}, ${state}) is currently paused by the Store Owner.`,
      message_hi: `स्टोर ओनर द्वारा पिनकोड ${pincode} (${district}, ${state}) पर डिलीवरी फिलहाल बंद रखी गई है।`,
    };
  }

  if (deliveryConfig.mode === 'SELECTED_STATES') {
    const allowed = deliveryConfig.serviceableStates.some(
      (s) => s.toLowerCase() === state.toLowerCase()
    );
    if (!allowed) {
      return {
        valid: true,
        serviceable: false,
        pincode,
        district,
        state,
        message_en: `Currently we do not deliver to ${state} (PIN ${pincode}). Store Owner delivers only to: ${deliveryConfig.serviceableStates.join(', ')}.`,
        message_hi: `फिलहाल ${state} (पिन ${pincode}) में डिलीवरी उपलब्ध नहीं है।`,
      };
    }
  } else if (deliveryConfig.mode === 'CUSTOM_PINCODES') {
    const matched = deliveryConfig.customPincodes.some(
      (rule) => pincode === rule || pincode.startsWith(rule)
    );
    if (!matched) {
      return {
        valid: true,
        serviceable: false,
        pincode,
        district,
        state,
        message_en: `PIN ${pincode} (${district}, ${state}) is outside the Store Owner's serviceable PIN code list.`,
        message_hi: `पिनकोड ${pincode} (${district}, ${state}) स्टोर ओनर के डिलीवरी क्षेत्र से बाहर है।`,
      };
    }
  }

  if (rawAddress !== undefined) {
    const cleanAddr = String(rawAddress || '').trim();
    if (cleanAddr.length < 12 || !/[a-zA-Z]{3,}/.test(cleanAddr)) {
      return {
        valid: true,
        serviceable: false,
        pincode,
        district,
        state,
        message_en:
          'Please enter a complete, deliverable street address (House/Plot No., Street/Colony, Landmark, minimum 12 characters).',
        message_hi:
          'कृपया पूरा डिलीवरी पता लिखें (मकान/प्लॉट नंबर, गली/कॉलोनी, लैंडमार्क सहित कम से कम 12 अक्षर)।',
      };
    }
  }

  const isHomeState = state === 'Rajasthan';
  const etaDays = isHomeState ? deliveryConfig.expressEtaDays : deliveryConfig.standardEtaDays;
  const courier = isHomeState
    ? 'Delhivery Express Rajasthan Priority'
    : 'BlueDart Royal Insured Air';

  return {
    valid: true,
    serviceable: true,
    pincode,
    district,
    state,
    etaDays,
    courier,
    message_en: `Serviceable at PIN ${pincode} (${district}, ${state}) — Insured delivery in ${etaDays} days via ${courier}.`,
    message_hi: `पिन ${pincode} (${district}, ${state}) पर डिलीवरी उपलब्ध है — ${etaDays} दिनों में सुरक्षित डिलीवरी।`,
  };
}

function notifyStoreOwnerOfOrder(order, customerNote) {
  const ownerEmail = deliveryConfig.ownerEmail || 'prakashgothwal370@gmail.com';
  const ownerPhone = deliveryConfig.ownerWhatsApp || '919876543210';
  const itemsList = Array.isArray(order.items)
    ? order.items.map((i) => `${i.name} (${i.size || 'Free Size'} x${i.qty})`).join(', ')
    : '';
  const totalInr = (Number(order.amount_paise || 0) / 100).toFixed(2);
  const subject = `[STORE OWNER ORDER DISPATCH] ${order.order_id} — ₹${totalInr} from ${order.customer_name}`;
  const waText = [
    `*NEW WEBSITE ORDER FOR STORE OWNER*`,
    `Order ID: ${order.order_id}`,
    `Invoice: ${order.invoice_number || 'GENERATED'}`,
    `Tracking ID: ${order.tracking_id || 'ASSIGNED'}`,
    `Customer: ${order.customer_name} (${order.phone})`,
    `Address: ${order.address}`,
    `Items: ${itemsList}`,
    `Total Paid: ₹${totalInr}`,
    customerNote ? `Customer Note: ${customerNote}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const whatsappUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(waText)}`;
  const record = {
    orderId: order.order_id,
    ownerEmail,
    whatsappUrl,
    subject,
    dispatchedAt: new Date().toISOString(),
  };
  ownerOrderDispatches.unshift(record);
  return {
    success: true,
    ...record,
  };
}

function createProductInquiry(input) {
  const customerName = String(input.customerName || '').trim();
  const customerPhone = String(input.customerPhone || '').replace(/\D/g, '').slice(-10);
  const message = String(input.message || '').trim();
  if (customerName.length < 2) {
    return { success: false, error: 'Please enter your name (at least 2 characters).' };
  }
  if (!/^[6-9]\d{9}$/.test(customerPhone)) {
    return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }
  if (message.length < 5) {
    return { success: false, error: 'Please enter your question about this item (at least 5 characters).' };
  }

  const inquiry = {
    id: `INQ-${Date.now().toString().slice(-6)}`,
    productId: Number(input.productId) || 1,
    productName: String(input.productName || `Product #${input.productId}`),
    sku: String(input.sku || `ZJ-${input.productId}`),
    selectedSize: String(input.selectedSize || 'Free Size'),
    customerName,
    customerPhone,
    customerEmail: String(input.customerEmail || '').trim(),
    pincode: String(input.pincode || '').replace(/\D/g, '').slice(0, 6),
    message,
    createdAt: new Date().toISOString(),
    status: 'NEW',
  };
  productInquiries.unshift(inquiry);

  const ownerEmail = deliveryConfig.ownerEmail || 'prakashgothwal370@gmail.com';
  const ownerPhone = deliveryConfig.ownerWhatsApp || '919876543210';
  const waText = `*PRODUCT INQUIRY (${inquiry.id})*\nItem: ${inquiry.productName} (${inquiry.sku})\nSize: ${inquiry.selectedSize}\nCustomer: ${customerName} (${customerPhone})\nQuestion: ${message}`;

  return {
    success: true,
    inquiry,
    ownerEmail,
    ownerWhatsAppUrl: `https://wa.me/${ownerPhone}?text=${encodeURIComponent(waText)}`,
    ownerMailtoUrl: `mailto:${ownerEmail}?subject=${encodeURIComponent(`[Product Inquiry ${inquiry.id}] ${inquiry.productName}`)}&body=${encodeURIComponent(waText)}`,
  };
}

function listProductInquiries() {
  return [...productInquiries];
}

function updateProductInquiryStatus(id, status, adminNote) {
  const found = productInquiries.find((i) => i.id === id);
  if (!found) return null;
  found.status = status;
  if (adminNote !== undefined) found.adminNote = String(adminNote);
  return found;
}

module.exports = {
  getDeliveryConfig,
  updateDeliveryConfig,
  checkPincodeServiceability,
  notifyStoreOwnerOfOrder,
  createProductInquiry,
  listProductInquiries,
  updateProductInquiryStatus,
};
