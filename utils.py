import requests
import json
from pandas import DataFrame as pd
import geopandas as gpd
from shapely.geometry import shape

def get_buildings_from_overpass(bounds):
    """
    Belirlenen coğrafi sınırlar (bounds) içindeki binaları Overpass API'den çeker.
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
    
    try:
        response = requests.post(overpass_url, data=overpass_query)
        response.raise_for_status()
        data = response.json()
        
        features = []
        for element in data.get("elements", []):
            if element["type"] in ["way", "relation"]:
                geometry = element.get("geometry", [])
                
                # Koordinatları işlerken hata kontrolü ekle
                coords = []
                is_valid = True
                for point in geometry:
                    try:
                        lon = float(point.get('lon'))
                        lat = float(point.get('lat'))
                        coords.append((lon, lat))
                    except (ValueError, TypeError, KeyError):
                        print(f"Hatalı koordinat verisi atlanıyor: {point}")
                        is_valid = False
                        break  # Hatalı nokta varsa tüm geometriden çık

                if not is_valid or len(coords) < 3:
                    continue # Hatalı geometriyi atla

                geojson_geometry = {
                    "type": "Polygon",
                    "coordinates": [coords]
                }
                
                features.append({
                    "type": "Feature",
                    "geometry": geojson_geometry,
                    "properties": element.get("tags", {})
                })
        
        geojson = {"type": "FeatureCollection", "features": features}
        
        print(f"Başarıyla {len(features)} adet geçerli bina verisi çekildi.")
        return geojson

    except requests.exceptions.RequestException as e:
        print(f"Overpass API'den veri çekerken hata oluştu: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"API yanıtı işlenirken hata oluştu: {e}")
        return None
def calculate_energy_potential(buildings_geojson):
    """
    Gelen GeoJSON verisi üzerinden enerji potansiyelini hesaplar.
    Hatalı geometrileri filtreler ve CRS'i doğru şekilde tanımlar.
    
    Args:
        buildings_geojson (dict): Binaları içeren GeoJSON formatında bir sözlük.
        
    Returns:
        dict: Hesaplanmış enerji potansiyelini içeren GeoJSON.
    """
    # Adım 1: Hatalı veya geçersiz geometriye sahip özellikleri filtrele
    valid_features = []
    for feature in buildings_geojson.get('features', []):
        try:
            geom = shape(feature['geometry'])
            if geom and geom.is_valid:
                valid_features.append(feature)
        except Exception as e:
            # Hatalı geometrileri sessizce atla
            continue

    if not valid_features:
        return {"features": [], "type": "FeatureCollection"}

    # Adım 2: Geçerli özellikleri GeoDataFrame'e dönüştür
    gdf = gpd.GeoDataFrame.from_features(valid_features)

    # Adım 3: Koordinat sistemini tanımla
    # GeoJSON verisi varsayılan olarak WGS 84 (EPSG:4326) sistemindedir.
    gdf.set_crs(epsg=4326, inplace=True)
    
    # Adım 4: Alan hesaplaması için doğru metrik CRS'ye dönüştür
    # İstanbul için uygun bir UTM projeksiyonu (EPSG:32635)
    gdf_projected = gdf.to_crs(epsg=32635)
    gdf['area_sqm'] = gdf_projected.geometry.area
    
    # Adım 5: Basit bir enerji potansiyeli formülü uygula
    # Bu sabit faktör yerine NASA verisini kullanmak daha doğru olacaktır.
    potential_factor = 1.6 * 1200 * 0.15 
    gdf['potential_kwh'] = gdf['area_sqm'] * potential_factor
    
    # Adım 6: Seviye ataması yap ve GeoJSON olarak döndür
    gdf['potential_level'] = gdf['potential_kwh'].apply(
        lambda x: 'high' if x > 20000 else ('medium' if x > 5000 else 'low')
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