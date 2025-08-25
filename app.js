// GCCV Other Than 3 Wheeler - Premium Calculator
// Updated: Fixed Consumable, Inbuilt CNG, Nil-Dep (incl renewal) and U/W discount calculations

// ---------------------------- Utilities ----------------------------
const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));
const ruppee = v => {
  const n = Number(v || 0);
  if (isNaN(n)) return "Rs 0";
  const parts = Math.round(n).toString().split('');
  let out = '';
  let len = parts.length;
  if (len <= 3) return 'Rs ' + parts.join('');
  const last3 = parts.splice(len-3, 3).join('');
  let rest = parts.join('');
  let rem = rest.length % 2;
  let groups = [];
  if (rem) { groups.push(rest.slice(0, rem)); rest = rest.slice(rem); }
  for (let i=0;i<rest.length;i+=2) groups.push(rest.slice(i,i+2));
  out = groups.filter(Boolean).join(',') + (groups.length ? ',' : '') + last3;
  return 'Rs ' + out;
};

// ---------------------------- Initial DOM wiring ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSumInsured();
  initConditionalFields();
  initAddOnToggles();
  initNCBLogic();
  bindCalculate();
  bindPrintShare();
  setDefaultDates();
});

function setDefaultDates(){
  const renewal = qs('#renewal');
  const today = new Date();
  const yyyy = today.getFullYear();
  renewal.min = `${yyyy-5}-01-01`;
  renewal.max = `${yyyy+1}-12-31`;
}

// ---------------------------- Tabs ----------------------------
function initTabs(){
  const tabs = qsa('.tab-btn');
  tabs.forEach(b => b.addEventListener('click', () => {
    activateTab(b.dataset.tab);
  }));

  qsa('.next').forEach(btn => {
    btn.addEventListener('click', e => {
      const next = btn.dataset.next;
      if (next) activateTab(next);
    });
  });

  qsa('.back').forEach(btn => {
    btn.addEventListener('click', e => {
      const prev = btn.dataset.prev;
      if (prev) activateTab(prev);
    });
  });
}

function activateTab(id){
  qsa('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab===id));
  qsa('.tab').forEach(t => {
    if (t.id === id) {
      t.classList.add('active');
      t.style.display = '';
    } else {
      t.classList.remove('active');
      t.style.display = 'none';
    }
  });
  if (id === 'tab-result') qs('#tab-result').style.display = '';
}

// ---------------------------- Sum Insured Dynamic Rows (unchanged) ----------------------------
const SI_OPTIONS = [
  {value:'idv_vehicle', label:'IDV of Vehicles'},
  {value:'non_elec', label:'Non-Electric Accessories'},
  {value:'allied', label:'Allied Component'},
  {value:'articulated', label:'Articulated Trailer/Body'},
  {value:'elec_access', label:'Electric Accessories'}
];

function getSiOptionsArray(){
  const trailerYes = getTrailer() === 'yes';
  const opts = SI_OPTIONS.slice();
  if (trailerYes) opts.push({value:'idv_trailer', label:'IDV of Trailer'});
  return opts;
}

function buildOptionsHTML(selected){
  return getSiOptionsArray().map(o => {
    return `<option value="${o.value}" ${o.value===selected ? 'selected' : ''}>${o.label}</option>`;
  }).join('');
}

function getFirstAvailableSiValue(){
  const chosen = qsa('.si-select').map(s => s.value);
  const opts = getSiOptionsArray();
  for (const o of opts) {
    if (!chosen.includes(o.value)) return o.value;
  }
  return null;
}

function initSumInsured(){
  const container = qs('#sum-insured-container');
  container.innerHTML = ''; // ensure clean start
  addSiRow({selected:'idv_vehicle', amount:0});
  qs('#si-add-first').addEventListener('click', () => {
    const availableCount = getSiOptionsArray().length;
    const currentCount = qsa('.si-row').length;
    if (currentCount < availableCount) addSiRow();
    updateSiAddButtonState();
  });
  updateSiAddButtonState();
}

function updateSiAddButtonState(){
  const availableCount = getSiOptionsArray().length;
  const currentCount = qsa('.si-row').length;
  const btn = qs('#si-add-first');
  if (!btn) return;
  if (currentCount >= availableCount) {
    btn.disabled = true;
    btn.classList.add('disabled');
  } else {
    btn.disabled = false;
    btn.classList.remove('disabled');
  }
}

function addSiRow({selected=null, amount=0} = {}){
  const container = qs('#sum-insured-container');
  const isFirst = container.children.length === 0;
  const selValue = selected || getFirstAvailableSiValue();
  if (!selValue) {
    updateSiAddButtonState();
    return;
  }

  const row = document.createElement('div');
  row.className = 'si-row';
  row.innerHTML = `
    <select class="si-select">${buildOptionsHTML(selValue)}</select>
    <input type="number" min="0" value="${amount}" class="si-amount" />
    <button type="button" class="btn si-add">${isFirst ? '+' : '✕'}</button>
  `;
  container.appendChild(row);
  refreshSiSelects();
  updateSiAddButtonState();

  const btn = row.querySelector('.si-add');
  const sel = row.querySelector('.si-select');
  const amt = row.querySelector('.si-amount');

  if (isFirst){
    btn.addEventListener('click', () => {
      const availableCount = getSiOptionsArray().length;
      const currentCount = qsa('.si-row').length;
      if (currentCount < availableCount) addSiRow();
      updateSiAddButtonState();
    });
  } else {
    btn.addEventListener('click', () => {
      row.remove();
      refreshSiSelects();
      updateSiAddButtonState();
    });
  }

  sel.addEventListener('change', () => {
    refreshSiSelects();
    updateSiAddButtonState();
  });
  amt.addEventListener('focus', e => {
    if (amt.value === '0') amt.value='';
  });
  amt.addEventListener('blur', e => {
    if (amt.value === '') amt.value = 0;
  });
}

function refreshSiSelects(){
  const selects = qsa('.si-select');
  const chosen = selects.map(s => s.value);
  selects.forEach(s => {
    const cur = s.value;
    const optsHtml = buildOptionsHTML(cur);
    s.innerHTML = optsHtml;
    qsa('option', s).forEach(opt => {
      if (opt.value !== cur && chosen.includes(opt.value)) opt.disabled = true;
      else opt.disabled = false;
    });
  });

  const rows = qsa('.si-row');
  rows.forEach((r, idx) => {
    const btn = r.querySelector('.si-add');
    if (idx === 0) btn.textContent = '+';
    else btn.textContent = '✕';
  });

  updateSiAddButtonState();
}

function rebuildSiOptionsOnTrailer(){
  const opts = getSiOptionsArray().map(o => o.value);
  const container = qs('#sum-insured-container');
  const rows = qsa('.si-row');
  while (rows.length > opts.length) {
    const last = rows[rows.length-1];
    last.remove();
    rows.splice(rows.length-1,1);
  }

  const selects = qsa('.si-select');
  const chosen = selects.map(s => s.value).filter(v => opts.includes(v));
  selects.forEach((s, idx) => {
    const cur = s.value;
    if (!opts.includes(cur)) {
      const replacement = getSiOptionsArray().find(o => !chosen.includes(o.value));
      s.innerHTML = buildOptionsHTML(replacement ? replacement.value : getSiOptionsArray()[0].value);
      s.value = replacement ? replacement.value : getSiOptionsArray()[0].value;
      chosen.push(s.value);
    } else {
      s.innerHTML = buildOptionsHTML(cur);
      s.value = cur;
    }
  });

  refreshSiSelects();
  updateSiAddButtonState();
}

// ---------------------------- Conditional fields (unchanged) ----------------------------
function initConditionalFields(){
  qsa('input[name="trailer"]').forEach(r => r.addEventListener('change', e => {
    const val = getTrailer();
    qs('#agri-wrap').style.display = val === 'yes' ? '' : 'none';
    rebuildSiOptionsOnTrailer();
  }));

  qs('#cng-checkbox').addEventListener('change', e => {
    qs('#cng-options').style.display = e.target.checked ? '' : 'none';
    if (!e.target.checked) qs('#cng-value').value = 0;
  });

  qsa('input[name="cng-type"]').forEach(r => r.addEventListener('change', e => {
    qs('#cng-value-wrap').style.display = e.target.value === 'extra' ? '' : 'none';
  }));

  qs('#towing').addEventListener('change', e => {
    qs('#towing-sum').style.display = e.target.checked ? '' : 'none';
  });

  qs('#emi').addEventListener('change', e => {
    qs('#emi-options').style.display = e.target.value === 'yes' ? '' : 'none';
  });
}

// ---------------------------- Add On toggles (unchanged) ----------------------------
function initAddOnToggles(){
  qs('#ll-employee').addEventListener('change', e => {
    qs('#ll-emp-count').style.display = e.target.checked ? '' : 'none';
  });

  qs('#ll-paid').addEventListener('change', e => {
    qs('#ll-paid-counts').style.display = e.target.checked ? '' : 'none';
  });

  qs('#ll-nfpp-other').addEventListener('change', e => {
    qs('#ll-nfpp-other-count').style.display = e.target.checked ? '' : 'none';
  });

  qs('#ll-nfpp-incl').addEventListener('change', e => {
    qs('#ll-nfpp-incl-count').style.display = e.target.checked ? '' : 'none';
  });
}

// ---------------------------- NCB Logic (unchanged) ----------------------------
function initNCBLogic(){
  qsa('input[name="claimPrev"]').forEach(r => r.addEventListener('change', e => {
    applyNcbRules();
  }));

  qs('#ncb').addEventListener('change', applyNcbRules);
}

function applyNcbRules(){
  const claim = getClaimPrev();
  const ncb = qs('#ncb').value;
  const ncbDisc = qs('#ncb-discount');

  if (claim === 'yes') {
    qs('#ncb').value = '';
    qs('#ncb').disabled = true;
    ncbDisc.value = '0';
    ncbDisc.disabled = true;
  } else {
    qs('#ncb').disabled = false;
    if (ncb === 'name_transferred') {
      ncbDisc.value = '0';
      ncbDisc.disabled = true;
    } else {
      const map = {'0':'20','20':'25','25':'35','35':'45','45':'50','50':'50','':'0'};
      const mapped = map[ncb] || '0';
      ncbDisc.value = mapped;
      ncbDisc.disabled = false;
    }
  }
}

// ---------------------------- Read helpers ----------------------------
function getTrailer(){ return document.querySelector('input[name="trailer"]:checked').value; }
function getClaimPrev(){ return document.querySelector('input[name="claimPrev"]:checked').value; }

// ---------------------------- Calculation & Rendering ----------------------------
function bindCalculate(){
  qs('#calculate').addEventListener('click', () => {
    const data = gatherInputs();
    const result = computePremium(data);
    renderResult(result);
    activateTab('tab-result');
  });
}

function gatherInputs(){
  const dorVal = qs('#dor').value ? new Date(qs('#dor').value) : null;
  const renewalVal = qs('#renewal').value ? new Date(qs('#renewal').value) : null;
  const today = new Date();
  const renewalDate = renewalVal || new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const dorDate = dorVal || new Date(renewalDate.getFullYear()-1, renewalDate.getMonth(), renewalDate.getDate());
  const vehicleAgeYears = ( (renewalDate - dorDate) / (1000*60*60*24) ) / 365;

  const siRows = qsa('.si-row').map(row => {
    return {category: row.querySelector('.si-select').value, amount: Number(row.querySelector('.si-amount').value || 0)};
  });
  const si = {};
  siRows.forEach(r => {
    si[r.category] = (si[r.category] || 0) + r.amount;
  });

  const trailerYes = getTrailer() === 'yes';
  const agricultureSelected = (document.querySelector('input[name="agri"]') ? document.querySelector('input[name="agri"]:checked').value === 'yes' : false);

  return {
    dor: dorDate,
    renewal: renewalDate,
    age: vehicleAgeYears,
    zone: qs('#zone').value,
    gvw: Number(qs('#gvw').value || 0),
    seating: Number(qs('#seating').value || 0),
    trailer: trailerYes,
    agriculture: trailerYes ? agricultureSelected : false,
    sumInsured: si,
    cngChecked: qs('#cng-checkbox').checked,
    cngType: qsa('input[name="cng-type"]').length ? document.querySelector('input[name="cng-type"]:checked').value : null,
    cngValue: Number(qs('#cng-value').value||0),
    fleetOwner: qs('#fleet-owner').checked,
    claimPrev: getClaimPrev(),
    ncb: qs('#ncb').value,
    imt23: qs('#imt23').checked,
    nilDep: qs('#nil-dep').checked,
    towing: qs('#towing').checked,
    towingValue: Number(qs('#towing-value').value||0),
    rti: qs('#rti').value === 'yes',
    geo: qs('#geo').value === 'yes',
    consumable: qs('#consumable').value === 'yes',
    emi: qs('#emi').value === 'yes',
    emiValue: Number(qs('#emi-value').value||0),
    emiMonths: Number(qs('#emi-months').value||0),
    paOwner: qs('#pa-owner').checked,
    llEmployee: qs('#ll-employee').checked,
    llEmployeeCount: Number(qs('#ll-emp-number').value||0),
    llPaid: qs('#ll-paid').checked,
    paidDriverCount: Number(qs('#paid-driver-count').value||0),
    cleanerCount: Number(qs('#cleaner-count').value||0),
    conductorCount: Number(qs('#conductor-count').value||0),
    paPaid: qs('#pa-paid').checked,
    llNfppOther: qs('#ll-nfpp-other').checked,
    llNfppOtherCount: Number(qs('#ll-nfpp-other-count-input').value||0),
    llNfppIncl: qs('#ll-nfpp-incl').checked,
    llNfppInclCount: Number(qs('#ll-nfpp-incl-count-input').value||0),
    nilDepDisc: Number(qs('#nil-dep-disc').value||0), // percent user feeds
    antiTheft: qs('#anti-theft').value === 'yes',
    ncbDiscount: Number(qs('#ncb-discount').value||0),
    nilRenewal: qs('#nil-renewal').value === 'yes',
    uwDiscount: Number(qs('#uw-discount').value||0) // percent user feeds for U/W
  };
}

function computePremium(d){
  // Base SI components
  const idvVehicle = d.sumInsured['idv_vehicle'] || 0;
  const nonElectric = d.sumInsured['non_elec'] || 0;
  const allied = d.sumInsured['allied'] || 0;
  const articulated = d.sumInsured['articulated'] || 0;
  const electricAccess = d.sumInsured['elec_access'] || 0;
  const idvTrailer = d.trailer ? (d.sumInsured['idv_trailer'] || 0) : 0;

  const baseSumInsured = idvVehicle + nonElectric + allied + articulated;

  // OD Rate by zone/age
  const age = d.age;
  function getOdRate(zone){
    if (zone === 'A'){
      if (age < 5) return 1.751;
      if (age < 7) return 1.795;
      return 1.839;
    } else if (zone === 'B'){
      if (age < 5) return 1.743;
      if (age < 7) return 1.787;
      return 1.83;
    } else {
      if (age < 5) return 1.726;
      if (age < 7) return 1.77;
      return 1.812;
    }
  }
  const odRate = getOdRate(d.zone);

  // Basic OD
  const basicOD = (baseSumInsured * odRate) / 100;

  // GVW Loading
  let gvwLoading = 0;
  if (d.gvw > 12000) gvwLoading = (d.gvw - 12000) * 0.27;

  // Electric Accessories Premium
  const electricPremium = electricAccess * 0.04;

  // CNG Extra Premium
  let cngExtraPremium = 0;
  if (d.cngChecked && d.cngType === 'extra') cngExtraPremium = d.cngValue * 0.04;

  // Towing Premium
  let towingPremium = 0;
  if (d.towing && d.towingValue > 0){
    const v = d.towingValue;
    if (v <= 10000) towingPremium = v * 0.05;
    else if (v <= 20000) towingPremium = v * 0.075;
    else towingPremium = v * 0.10;
  }

  // Geographic OD
  const geoPremium = d.geo ? 400 : 0;

  // RTI
  let rtiPremium = 0;
  if (d.rti){
    if (age >= 3) {
      rtiPremium = 0;
    } else {
      let rate = 0.45;
      if (age < 1) rate = 0.45;
      else if (age < 2) rate = 0.55;
      else rate = 0.70;
      rtiPremium = (rate/100) * (idvVehicle + allied);
    }
  }

  // Consumable Premium - ensure divide by 100 (RATE is percent)
  let consumablePremium = 0;
  if (d.consumable){
    let rate = 0;
    if (age < 1) rate = .15;
    else if (age < 2) rate = .18;
    else if (age < 3) rate = .22;
    else if (age < 4) rate = .25;
    else if (age < 5) rate = .27;
    else rate = 0;
    // CORRECT: rate is a percent so divide by 100
    consumablePremium = (rate/100) * (baseSumInsured + electricAccess + idvTrailer);
  }

  // IMT-23
  let imt23Premium = 0;
  if (d.imt23){
    const baseIMTBasis = basicOD + electricPremium + gvwLoading + towingPremium + geoPremium + cngExtraPremium;
    imt23Premium = 0.15 * baseIMTBasis;
  }

  // Nil Depreciation Premium (age based)
  let nilDepPremium = 0;
  if (d.nilDep){
    let rate = 0;
    if (age < (7/12)) rate = 10;
    else if (age < 2) rate = 20;
    else if (age < 5) rate = 30;
    else rate = 0;
    const basis = basicOD + electricPremium + gvwLoading + cngExtraPremium + geoPremium + imt23Premium;
    nilDepPremium = (rate/100) * basis;
  }

  // EMI Premium
  let emiPremium = 0;
  if (d.emi){
    if (age < 4.5){
      const rate = d.emiMonths === 1 ? 0.05 : 0.09;
      emiPremium = d.emiValue * rate;
    }
  }

  // Trailer OD Premium
  let trailerODPremium = 0;
  if (d.trailer && idvTrailer > 0){
    trailerODPremium = d.agriculture ? idvTrailer * 0.0087 : idvTrailer * 0.0105;
  }

  // U/W Discount amount based on user rate and specified basis
  // U/W Discount = (Basic OD + Electric + GVW Loading + CNG Extra + IMT-23) * (user_rate%)
  const uwBasis = basicOD + electricPremium + gvwLoading + cngExtraPremium + imt23Premium;
  const uwDiscountAmount = (d.uwDiscount/100) * uwBasis;

  // Inbuilt CNG OD Premium per your formula:
  // In built CNG Od Premium= (Basic OD + Electric + GVW + IMT23 + Geo + Consumable - u/w Discount)*0.05
  let inbuiltCngOdPremium = 0;
  if (d.cngChecked && d.cngType === 'inbuilt'){
    const subtotal = basicOD + electricPremium + gvwLoading + imt23Premium + geoPremium + consumablePremium - uwDiscountAmount;
    // protect negative subtotal
    inbuiltCngOdPremium = subtotal > 0 ? (subtotal * 0.05) : 0;
  }

  // Build OD components object for clarity
  const odComponents = {
    basicOD,
    gvwLoading,
    electricPremium,
    cngExtraPremium,
    imt23Premium,
    towingPremium,
    geoPremium,
    rtiPremium,
    consumablePremium,
    nilDepPremium,
    emiPremium,
    trailerODPremium,
    inbuiltCngOdPremium
  };

  // Nil Dep discounts:
  // - Nil Dep Discount = Nil Depreciation Premium * (user rate)
  const nilDepDiscPercent = d.nilDepDisc || 0;
  const nilDepDiscountAmount = (nilDepDiscPercent/100) * nilDepPremium;

  // - Nil Dep Renewal Discount = Nil Depreciation Premium * 0.05 (if user selected renewal)
  const nilDepRenewalDiscount = d.nilRenewal ? (0.05 * nilDepPremium) : 0;

  // Total OD before applying discounts
  let totalOD = Object.values(odComponents).reduce((s,v)=>s+v,0);

  // Apply discounts: subtract NIL DEP DISCOUNT, NIL DEP RENEWAL, and U/W DISCOUNT (as specified)
  totalOD = totalOD - nilDepDiscountAmount - nilDepRenewalDiscount - uwDiscountAmount;

  // ---------------- Liability (TP) Side ----------------
  let tpBase = 0;
  if (d.gvw <= 7500) tpBase = 16049;
  else if (d.gvw <= 12000) tpBase = 27186;
  else if (d.gvw <= 20000) tpBase = 35313;
  else if (d.gvw <= 40000) tpBase = 43950;
  else tpBase = 44242;

  let paOwner = d.paOwner ? 320 : 0;
  let llEmployee = d.llEmployee ? (50 * d.llEmployeeCount) : 0;
  let llPaidSum = d.llPaid ? (50 * (d.paidDriverCount + d.cleanerCount + d.conductorCount)) : 0;
  let paPaid = d.paPaid ? 60 : 0;
  let llNfppOther = d.llNfppOther ? (75 * d.llNfppOtherCount) : 0;
  let llNfppIncl = d.llNfppIncl ? (75 * d.llNfppInclCount) : 0;
  let llGeo = d.geo ? 100 : 0;
  let cngTp = d.cngChecked ? 60 : 0;
  let trailerTp = 0;
  if (d.trailer){
    trailerTp = d.agriculture ? 910 : 2485;
  }

  const liabilityAddons = {
    paOwner, llEmployee, llPaidSum, paPaid, llNfppOther, llNfppIncl, llGeo, cngTp, trailerTp
  };
  const totalLiabilityAddons = Object.values(liabilityAddons).reduce((a,b)=>a+b,0);
  const totalLiability = tpBase + totalLiabilityAddons;

  // GST and totals
  const odGst = 0.18 * totalOD;
  const tpGstBasic = 0.12 * tpBase;
  const tpGstAddons = 0.18 * totalLiabilityAddons;
  const tpGst = tpGstBasic + tpGstAddons;
  const grandTotal = totalOD + totalLiability + odGst + tpGst;

  // return structured result including discount lines for rendering
  const out = {
    inputs: d,
    breakdown: {
      od: odComponents,
      nilDepDiscountAmount,
      nilDepRenewalDiscount,
      uwDiscountAmount,
      totalOD,
      liability: {
        tpBase,
        liabilityAddons,
        totalLiabilityAddons,
        totalLiability
      },
      taxes: {
        odGst,
        tpGstBasic,
        tpGstAddons,
        tpGst
      },
      grandTotal
    }
  };
  return out;
}

function renderResult(res){
  const bre = qs('#breakdown');
  bre.innerHTML = '';

  const odComp = res.breakdown.od;
  const odDiv = document.createElement('div');
  odDiv.className = 'breakline';
  odDiv.innerHTML = `<h4>Own Damage (OD) Premium</h4>`;

  const odList = [
    ['Basic OD', odComp.basicOD],
    ['GVW Loading', odComp.gvwLoading],
    ['Electric Accessories', odComp.electricPremium],
    ['CNG Extra', odComp.cngExtraPremium],
    ['IMT-23', odComp.imt23Premium],
    ['Towing Charge', odComp.towingPremium],
    ['Geographic Area', odComp.geoPremium],
    ['Return to Invoice', odComp.rtiPremium],
    ['Consumable', odComp.consumablePremium],
    ['Nil Depreciation (Raw)', odComp.nilDepPremium],
    ['EMI Protection', odComp.emiPremium],
    ['Trailer OD', odComp.trailerODPremium],
    ['Inbuilt CNG OD', odComp.inbuiltCngOdPremium]
  ];

  odList.forEach(item => {
    const el = document.createElement('div');
    el.className = 'line-item';
    el.innerHTML = `<div>${item[0]}</div><div>${ruppee(item[1])}</div>`;
    odDiv.appendChild(el);
  });

  // Discounts lines
  odDiv.appendChild(buildLine('Nil Dep Discount', -res.breakdown.nilDepDiscountAmount));
  odDiv.appendChild(buildLine('Nil Dep Renewal Discount', -res.breakdown.nilDepRenewalDiscount));
  odDiv.appendChild(buildLine('U/W Discount', -res.breakdown.uwDiscountAmount));

  const odTotalDiv = document.createElement('div');
  odTotalDiv.className = 'line-item';
  odTotalDiv.style.fontWeight = '700';
  odTotalDiv.innerHTML = `<div>Total OD</div><div>${ruppee(res.breakdown.totalOD)}</div>`;
  odDiv.appendChild(odTotalDiv);

  // Liability / TP column
  const liDiv = document.createElement('div');
  liDiv.className = 'breakline';
  liDiv.innerHTML = `<h4>Liability / TP Premium</h4>`;

  liDiv.appendChild(buildLine('Basic TP', res.breakdown.liability.tpBase));
  for (const [k,v] of Object.entries(res.breakdown.liability.liabilityAddons)){
    const n = k.replace(/([A-Z])/g,' $1').replace(/^./, s=>s.toUpperCase());
    liDiv.appendChild(buildLine(n, v));
  }
  liDiv.appendChild(buildLine('Total Liability', res.breakdown.liability.totalLiability));

  // Taxes
  const taxDiv = document.createElement('div');
  taxDiv.className = 'breakline';
  taxDiv.innerHTML = `<h4>Taxes</h4>`;
  taxDiv.appendChild(buildLine('OD GST (18%)', res.breakdown.taxes.odGst));
  taxDiv.appendChild(buildLine('TP GST Basic (12%)', res.breakdown.taxes.tpGstBasic));
  taxDiv.appendChild(buildLine('TP GST Addons (18%)', res.breakdown.taxes.tpGstAddons));
  const taxTotal = res.breakdown.taxes.odGst + res.breakdown.taxes.tpGst;
  taxDiv.appendChild(buildLine('Total Tax', taxTotal));

  // Summary
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'breakline';
  summaryDiv.innerHTML = `<h4>Summary</h4>`;
  summaryDiv.appendChild(buildLine('Total OD', res.breakdown.totalOD));
  summaryDiv.appendChild(buildLine('Total Liability', res.breakdown.liability.totalLiability));
  const totalPremium = res.breakdown.totalOD + res.breakdown.liability.totalLiability;
  summaryDiv.appendChild(buildLine('Total Premium (OD + Liability)', totalPremium));
  summaryDiv.appendChild(buildLine('Total Tax', taxTotal));
  summaryDiv.appendChild(buildLine('Grand Total', res.breakdown.grandTotal));

  bre.appendChild(odDiv);
  bre.appendChild(liDiv);
  bre.appendChild(taxDiv);
  bre.appendChild(summaryDiv);

  const tsum = qs('#totals-summary');
  tsum.innerHTML = `<div class="line-item"><div style="font-weight:700">Grand Total</div><div style="font-weight:700">${ruppee(res.breakdown.grandTotal)}</div></div>`;
}

function buildLine(label, amount){
  const el = document.createElement('div');
  el.className = 'line-item';
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  el.innerHTML = `<div>${label}</div><div>${sign} ${ruppee(abs)}</div>`;
  return el;
}

// ---------------------------- Print & Share (unchanged) ----------------------------
function bindPrintShare(){
  qs('#btn-print').addEventListener('click', () => openPopup());
  qs('#btn-share').addEventListener('click', () => openPopup());
  qs('#popup-skip').addEventListener('click', () => closePopup());
  qs('#popup-submit').addEventListener('click', () => {
    closePopup();
    window.print();
  });
}
function openPopup(){ qs('#popup').style.display = ''; }
function closePopup(){ qs('#popup').style.display = 'none'; }