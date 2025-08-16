import requests
import json
from pandas import DataFrame as pd
from geopandas import GeoDataFrame
from shapely.geometry import shape

def get_buildings_from_overpass(bounds):
    """
    Verilen coğrafi sınırlar (bounds) içindeki binaları Overpass API'den çeker.
    
    Args:
        bounds (dict): Coğrafi sınırlar {'south': float, 'west': float, 'north': float, 'east': float}
        
    Returns:
        dict: Binaları içeren GeoJSON formatında bir sözlük.
    """
    overpass_query = f"""
    [out:json][timeout:60];
    (
      way["building"]({bounds['south']},{bounds['west']},{bounds['north']},{bounds['east']});
      relation["building"]({bounds['south']},{bounds['west']},{bounds['north']},{bounds['east']});
    );
    out geom;
    """

    overpass_url = "http://overpass-api.de/api/interpreter"
    
    print("Overpass API'den bina verisi çekiliyor...")
    
    try:
        response = requests.post(overpass_url, data=overpass_query)
        response.raise_for_status()

        data = response.json()
        
        features = []
        for element in data.get("elements", []):
            if element["type"] in ["way", "relation"]:
                geometry = {
                    "type": "Polygon",
                    "coordinates": [[(lon, lat) for lon, lat in element.get("geometry", [])]]
                }
                
                features.append({
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": element.get("tags", {})
                })
        
        geojson = {"type": "FeatureCollection", "features": features}
        
        print(f"Başarıyla {len(features)} adet bina verisi çekildi.")
        
        return geojson

    except requests.exceptions.RequestException as e:
        print(f"Overpass API'den veri çekerken hata oluştu: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"API yanıtı işlenirken hata oluştu: {e}")
        return None

if __name__ == '__main__':
    test_bounds = {
        'south': 40.99,
        'west': 29.00,
        'north': 41.01,
        'east': 29.02
    }
    
    buildings_data = get_buildings_from_overpass(test_bounds)
    
    if buildings_data:
        with open('test_buildings.geojson', 'w', encoding='utf-8') as f:
            json.dump(buildings_data, f, ensure_ascii=False, indent=4)
        print("\nVeri, 'test_buildings.geojson' dosyasına kaydedildi.")

def calculate_energy_potential(buildings_geojson):
    """
    Gelen GeoJSON verisi üzerinden enerji potansiyelini hesaplar.
    """
    gdf = GeoDataFrame.from_features(buildings_geojson['features'])
    
    # Bina alanını hesapla
    # Bu, WGS84 koordinat sisteminde hatalı olabilir, sunum için yeterli
    # Gerçek uygulamada daha doğru yöntemler kullanılır
    gdf['area_sqm'] = gdf.geometry.area * 111320**2 
    
    # Basit bir enerji potansiyeli formülü (kWh/yıl)
    # Varsayım: İstanbul için ortalama güneşlenme saatleri ve verim oranı
    # 1.6: kWp başına düşen ortalama güneş enerjisi
    # 1200: Yıllık güneşlenme saatleri
    # 0.15: Panel verimi
    potential_factor = 1.6 * 1200 * 0.15 
    gdf['potential_kwh'] = gdf['area_sqm'] * potential_factor
    
    gdf['potential_level'] = gdf['potential_kwh'].apply(
        lambda x: 'high' if x > 2000 else ('medium' if x > 500 else 'low')
    )
    
    return json.loads(gdf.to_json())


def get_nasa_power_data(lat, lon, start_date, end_date):
    """
    Belirli bir konum ve tarih aralığı için NASA POWER API'sinden
    güneşlenme verilerini çeker.
    
    Args:
        lat (float): Enlem (örn. 41.0)
        lon (float): Boylam (örn. 29.1)
        start_date (str): Başlangıç tarihi (YYYYMMDD formatında)
        end_date (str): Bitiş tarihi (YYYYMMDD formatında)
        
    Returns:
        pandas.DataFrame: Çekilen veriyi içeren DataFrame veya hata durumunda None.
    """
    # API'nin temel URL'si
    url = "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&format=JSON"
    
    # Sorgu için gerekli parametreler
    params = {
        'latitude': lat,
        'longitude': lon,
        'start': start_date,
        'end': end_date
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()

        data = response.json()
        
        power_data = data['properties']['parameter']['ALLSKY_SFC_SW_DWN']
        
        df = pd.DataFrame.from_dict(power_data, orient='index', columns=['Gunes_Isinimi_kWh_m2'])
        df.index = pd.to_datetime(df.index, format='%Y%m%d')
        df.index.name = 'Tarih'
        
        return df
        
    except requests.exceptions.RequestException as e:
        print(f"API isteği başarısız oldu: {e}")
        return None
    except KeyError as e:
        print(f"API yanıtında beklenen veri bulunamadı: {e}")
        return None

if __name__ == '__main__':
    lat = 41.0082  
    lon = 28.9784 
    start_date = "20230101"
    end_date = "20231231"
    
    print("NASA POWER API'den veri çekiliyor...")
    
    solar_data = get_nasa_power_data(lat, lon, start_date, end_date)
    
    if solar_data is not None:
        print("Veri başarıyla çekildi. İlk 5 satır:")
        print(solar_data.head())
        
        output_file = 'nasa_power_data_istanbul_2023.csv'
        solar_data.to_csv(output_file)
        print(f"\nVeri, '{output_file}' dosyasına kaydedildi.")