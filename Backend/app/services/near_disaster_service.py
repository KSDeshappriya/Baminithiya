import pygeohash as pgh
import time
from typing import List
from app.services.appwrite_service import AppwriteService

EXCLUDED_KEYS = {
    "gdac_disasters",
    "cnn_analysis", 
    "weather_data",
    "citizen_survival_guide",
    "government_report"
}

appwrite_service = AppwriteService()

def get_nearby_disasters(latitude: float, longitude: float) -> List[dict]:
    geohash_prefix = pgh.encode(latitude, longitude, precision=4)
    one_week_ago = int(time.time()) - 7 * 24 * 60 * 60
    print(f"Querying disasters near geohash: {geohash_prefix} from {one_week_ago} seconds ago")

    try:
        documents = appwrite_service.query_disasters_by_geohash_and_time(
            geohash_prefix=geohash_prefix,
            min_timestamp=one_week_ago,
            limit=100
        )

        results = []

        for document in documents:
            # Clean the document by removing excluded keys
            cleaned = {k: v for k, v in document.items() if k not in EXCLUDED_KEYS}

            submitted_time = cleaned.get('submitted_time')
            if not isinstance(submitted_time, (int, float)) or submitted_time < one_week_ago:
                continue

            results.append(cleaned)

        return results

    except Exception as e:
        print(f"Error querying disasters: {e}")
        return []
