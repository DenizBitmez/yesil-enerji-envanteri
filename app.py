from flask import Flask, jsonify, request
from utils import get_buildings_from_overpass, calculate_energy_potential
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/potential', methods=['POST'])
def get_potential_data_from_map():
    try:
        data = request.get_json()
        if not data or 'coords' not in data:
            return jsonify({"error": "No data or 'coords' key provided"}), 400

        # Gelen verideki doğru anahtarları kullanarak 'coords' sözlüğünü oluşturun
        try:
            coords = {
                'south': float(data['coords']['south']),
                'west': float(data['coords']['west']),
                'north': float(data['coords']['north']),
                'east': float(data['coords']['east'])
            }
        except (KeyError, ValueError):
            return jsonify({"error": "Invalid coordinate data format. Expected numerical values for 'south', 'west', 'north', 'east'."}), 400

        buildings_geojson = get_buildings_from_overpass(coords)
        
        if not buildings_geojson or not buildings_geojson.get('features'):
            return jsonify({"message": "No buildings found in the selected area"}), 200

        potential_data = calculate_energy_potential(buildings_geojson)
        
        return jsonify(potential_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)