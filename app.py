from flask import Flask, jsonify, request
from utils import get_buildings_from_overpass, calculate_energy_potential
from flask_cors import CORS
app = Flask(__name__)

@app.route('/api/potential', methods=['POST'])
def get_potential_data_from_map():
    """
    Kullanıcının haritada seçtiği alana ait potansiyel verisini döndürür.
    JSON'dan coğrafi sınırlar (bbox) veya poligon verisi bekler.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        coords = data.get('coords')  # Örnek: {'lat_min': ..., 'lat_max': ..., ...}

        buildings_geojson = get_buildings_from_overpass(coords)
        if not buildings_geojson:
            return jsonify({"message": "No buildings found in the selected area"}), 200

        potential_data = calculate_energy_potential(buildings_geojson)
        
        return jsonify(potential_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)