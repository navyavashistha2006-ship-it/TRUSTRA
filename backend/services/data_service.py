import os
import pandas as pd

class DataService:
    def __init__(self):
        # Dynamically resolve backend/data directory relative to this service file
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_dir = os.path.join(self.base_dir, 'data')

    def load_price_references(self) -> pd.DataFrame:
        path = os.path.join(self.data_dir, 'price_references.csv')
        if os.path.exists(path):
            # Read and parse CSV safely, handling potential empty columns
            df = pd.read_csv(path)
            df['collected_at'] = pd.to_datetime(df['collected_at'], errors='coerce')
            return df
        return pd.DataFrame()

    def load_complaints(self) -> pd.DataFrame:
        path = os.path.join(self.data_dir, 'complaints.csv')
        if os.path.exists(path):
            return pd.read_csv(path)
        return pd.DataFrame()

    def load_incidents(self) -> pd.DataFrame:
        path = os.path.join(self.data_dir, 'incidents.csv')
        if os.path.exists(path):
            return pd.read_csv(path)
        return pd.DataFrame()

    def load_data_sources(self) -> pd.DataFrame:
        path = os.path.join(self.data_dir, 'data_sources.csv')
        if os.path.exists(path):
            return pd.read_csv(path)
        return pd.DataFrame()
