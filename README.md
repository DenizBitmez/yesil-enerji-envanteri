# Yeşil Enerji Envanteri ve Potansiyel Haritası

Bu proje, Birleşmiş Milletler'in **"Sürdürülebilir Enerji"** ve **"İklim Eylemi"** hedeflerine katkıda bulunmak amacıyla geliştirilmiş bir hackathon projesidir. Kullanıcılar, harita üzerinde bir alana yaklaştıklarında, o alandaki binaların potansiyel enerji üretim seviyesini (düşük, orta, yüksek) görebilirler.

## Teknolojiler

  * **Arka Uç (Backend):** Python (Flask, GeoPandas, requests)
  * **Ön Uç (Frontend):** React
  * **Veri Kaynakları:** OpenStreetMap (Overpass API) ve NASA POWER API

## Kurulum ve Başlatma

Bu projeyi çalıştırmak için Python ve Node.js kurulu olmalıdır. Veri işleme kütüphanelerinin (Geopandas, Shapely vb.) karmaşık kurulum süreçleri nedeniyle **Conda paket yöneticisi kullanılması önerilir.**

### 1\. Backend (Flask) Kurulumu

Projenin ana dizininde (örneğin, `yesil-enerji-projesi`) aşağıdaki adımları izleyin.

#### a. Conda Ortamı Oluşturma ve Aktifleştirme

Conda terminalini açın ve projeye özel bir ortam oluşturun.

```bash
conda create --name yesil-enerji-proje python=3.10
conda activate yesil-enerji-proje
```

#### b. Gerekli Kütüphaneleri Kurma

Conda, `geopandas` paketini kurduğunuzda bağımlılıkları olan `shapely`, `fiona` gibi kütüphaneleri de otomatik olarak doğru şekilde kuracaktır.

```bash
conda install geopandas
conda install flask flask-cors requests
```

#### c. Flask Sunucusunu Başlatma

```bash
python app.py
```

### 2\. Frontend (React) Kurulumu

Ayrı bir terminal penceresi açın ve `frontend` klasörüne gidin.

```bash
cd frontend
```

#### a. Node.js Bağımlılıklarını Kurma

```bash
npm install
```

#### b. React Uygulamasını Başlatma

```bash
npm start
```

## Kullanım

1.  Her iki sunucuyu da (Flask ve React) yukarıdaki adımları izleyerek çalıştırın.
2.  Tarayıcınızda `http://localhost:3000` adresini açın.
3.  Haritada bir bölgeye yakınlaşın. Yakınlaştığınızda, uygulamanın arka planda Flask API'sine istek gönderdiğini ve binaların enerji potansiyelini harita üzerinde görselleştirdiğini göreceksiniz.
4.  Binaların üzerine tıklayarak tahmini yıllık enerji üretimi gibi detayları inceleyebilirsiniz.
