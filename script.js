// ===== منوی موبایل =====
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// بستن منو با کلیک روی لینک‌ها
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== پرسش و پاسخ =====
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    // بستن بقیه
    document.querySelectorAll('.faq-item').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

// ===== محاسبه اوقات شرعی (تقریبی) =====
function toRad(deg) { return deg * Math.PI / 180; }
function toDeg(rad) { return rad * 180 / Math.PI; }
function normalize(v) { return ((v % 24) + 24) % 24; }

function julianDay(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
}

function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = toRad(normalize(357.529 + 0.98560028 * D));
  const q = toRad(normalize(280.459 + 0.98564736 * D));
  const L = toRad(normalize(q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = toDeg(Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)));
  const decl = toDeg(Math.asin(Math.sin(e) * Math.sin(L)));
  return { ra: normalize(RA), decl };
}

function calcTimes(date, lat, lng, tz) {
  const jd = julianDay(date);
  const D = jd - 2451545.0;
  const { decl } = sunPosition(jd);

  const T = (D / 36525);
  const omega = 125.04 - 0.052954 * D;
  const L0 = 280.47 + 0.98565 * D;
  const e = 23.439 - 0.00000036 * D;
  const eqTime = -1.915 * Math.sin(toRad(omega)) - 0.020 * Math.sin(toRad(2 * omega)); // تقریبی
  const noon = 12 + tz - lng / 15 - eqTime / 60;

  const latR = toRad(lat);

  function hourAngle(altitude) {
    const cosH = (Math.sin(toRad(altitude)) - Math.sin(latR) * Math.sin(toRad(decl))) /
                 (Math.cos(latR) * Math.cos(toRad(decl)));
    return cosH > 1 || cosH < -1 ? null : toDeg(Math.acos(cosH));
  }

  const fajr = hourAngle(-18);   // زاویه صبح
  const sunrise = hourAngle(-0.833);
  const dhuhr = 0;
  const asr = hourAngle(Math.atan(1 / (1 + Math.tan(toRad(Math.abs(decl - lat))))));
  const sunset = hourAngle(-0.833);
  const maghrib = hourAngle(-4);  // تقریبی
  const isha = hourAngle(-17);

  function fmt(h) {
    h = normalize(h);
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }

  const times = {
    fajr: fajr !== null ? fmt(noon - fajr / 15) : '—',
    sunrise: sunrise !== null ? fmt(noon - sunrise / 15) : '—',
    dhuhr: fmt(noon + dhuhr / 15),
    asr: asr !== null ? fmt(noon + asr / 15) : '—',
    sunset: sunset !== null ? fmt(noon + sunset / 15) : '—',
    maghrib: maghrib !== null ? fmt(noon + maghrib / 15) : '—',
    isha: isha !== null ? fmt(noon + isha / 15) : '—',
    midnight: fmt(noon + (24 - (noon - (fajr !== null ? noon - fajr / 15 : noon))) / 2)
  };
  return times;
}

// شهرهای نمونه
const cities = {
  'تهران': { lat: 35.6892, lng: 51.3890, tz: 3.5 },
  'مشهد': { lat: 36.2605, lng: 59.6168, tz: 3.5 },
  'اصفهان': { lat: 32.6546, lng: 51.6680, tz: 3.5 },
  'شیراز': { lat: 29.5918, lng: 52.5837, tz: 3.5 },
  'تبریز': { lat: 38.0800, lng: 46.2919, tz: 3.5 },
  'قم': { lat: 34.6416, lng: 50.8746, tz: 3.5 },
  'اهواز': { lat: 31.3183, lng: 48.6706, tz: 3.5 },
  'کرمانشاه': { lat: 34.3142, lng: 47.0650, tz: 3.5 }
};

function renderTimes(cityName) {
  const c = cities[cityName];
  if (!c) return;
  const now = new Date();
  const t = calcTimes(now, c.lat, c.lng, c.tz);
  document.getElementById('cityLabel').textContent = cityName;
  const map = {
    't-fajr': t.fajr, 't-sunrise': t.sunrise, 't-dhuhr': t.dhuhr,
    't-asr': t.asr, 't-sunset': t.sunset, 't-maghrib': t.maghrib,
    't-isha': t.isha, 't-midnight': t.midnight
  };
  for (const id in map) {
    const el = document.getElementById(id);
    if (el) el.textContent = map[id];
  }
}

// انتخاب شهر
const citySelect = document.createElement('select');
citySelect.id = 'citySelect';
citySelect.style.cssText = 'padding:10px 18px;border-radius:50px;border:1px solid var(--line);font-family:inherit;font-size:1rem;background:var(--card);color:var(--text);cursor:pointer;';
Object.keys(cities).forEach(c => {
  const opt = document.createElement('option');
  opt.value = c;
  opt.textContent = c;
  citySelect.appendChild(opt);
});
citySelect.addEventListener('change', () => renderTimes(citySelect.value));

const timesSection = document.getElementById('times');
if (timesSection) {
  const head = timesSection.querySelector('.section-head');
  const selectWrap = document.createElement('div');
  selectWrap.style.cssText = 'text-align:center;margin-bottom:24px;';
  selectWrap.appendChild(citySelect);
  head.after(selectWrap);
}

renderTimes('تهران');
