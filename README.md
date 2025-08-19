# 🌞 Güneş Enerjisi Envanteri

Dünyanın güneş enerjisi potansiyelini analiz eden ve görselleştiren web tabanlı bir araç. Bu prototip, bireylerin, işletmelerin ve yerel yönetimlerin binalarının çatılarının güneş enerjisi üretimi için ne kadar uygun olduğunu değerlendirmelerine yardımcı olmayı amaçlamaktadır.

## 🎯 Proje Amacı

Türkiye, yıllık ortalama **7.5 kWh/m²** güneşlenme potansiyeliyle güneş enerjisi açısından zengin bir ülke olmasına rağmen, bu potansiyeli tam olarak kullanamamaktadır. Bu projenin temel hedefleri:

- 🏢 Binaların çatı güneş enerjisi potansiyelini analiz etmek
- 📊 Yatırım geri dönüş sürelerini hesaplamak
- 🌍 Sürdürülebilir kalkınmaya katkı sağlamak
- 📈 Yeşil enerjiye geçişi hızlandırmak

## 🛠️ Teknolojiler

### Frontend

- **Next.js 15** - React framework
- **React 18** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **Leaflet** - Harita görselleştirme

### UI Bileşenleri

- **Radix UI** - Erişilebilir UI bileşenleri
- **Lucide React** - İkonlar
- **Recharts** - Veri görselleştirme
- **Sonner** - Toast bildirimleri

### Veri Kaynakları

- **OpenStreetMap (OSM)** - Bina verileri
- **NASA POWER API** - Güneşlenme verileri

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Adımlar

1. **Repository'yi klonlayın:**

```bash
git clone https://github.com/DenizBitmez/yesil-enerji-envanteri
cd yesil-enerji-envanteri
```

2. **Bağımlılıkları yükleyin:**

```bash
npm install
# veya
yarn install
```

3. **Geliştirme sunucusunu başlatın:**

```bash
npm run dev
# veya
yarn dev
```

4. **Uygulamayı görüntüleyin:**
   Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📁 Proje Yapısı

```
├── app/
│   ├── components/         # React bileşenleri
│   │   ├── Map.jsx        # Harita bileşeni
│   │   └── ...
│   ├── globals.css        # Global stiller
│   ├── layout.js          # Root layout
│   └── page.js           # Ana sayfa
├── public/               # Statik dosyalar
├── package.json         # Proje bağımlılıkları
└── README.md           # Bu dosya
```

## 🗺️ Özellikler

### Mevcut Özellikler

- ✅ İnteraktif harita görüntüleme
- ✅ Türkiye haritası odaklı görünüm
- ✅ Responsive tasarım
- ✅ Modern UI/UX
- ✅ Türkiye şehirlerini analiz etme.

## 🧪 Geliştirme

### Komutlar

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Üretim build'i
npm run start    # Üretim sunucusu
```

## 📊 Veri Kaynakları

- **OpenStreetMap**: Bina geometri verileri
- **PVGIS API**: Bölgelerin Işınım Oranları

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

---

⭐ Bu projeyi beğendiyseniz, lütfen bir yıldız verin!

---

<i>💭 Bu projenin front-end kısmının bazı yerleri v0 agent ile geliştirilmiştir.
