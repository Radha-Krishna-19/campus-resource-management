#!/usr/bin/env python3
"""
Prophet-based demand forecasting for Campus Resource Manager.
Reads JSON booking history from stdin, returns 7-day forecast as JSON to stdout.
Usage: echo '<json>' | python predict_demand.py
"""

import sys
import json
import warnings
warnings.filterwarnings('ignore')

try:
    import pandas as pd
    from prophet import Prophet
except ImportError as e:
    # Output a fallback if Prophet not installed
    error_output = {
        "error": f"Prophet not installed: {str(e)}",
        "forecast": []
    }
    print(json.dumps(error_output))
    sys.exit(0)

def run_prophet(bookings_json):
    try:
        bookings = json.loads(bookings_json)
        
        if not bookings or len(bookings) < 7:
            return {"error": "Not enough data for Prophet (min 7 data points)", "forecast": []}

        # Build DataFrame of daily booking counts
        df = pd.DataFrame(bookings)
        df['ds'] = pd.to_datetime(df['date'])
        df['y'] = df['count'].astype(float)
        df = df[['ds', 'y']].dropna()
        df = df.sort_values('ds')

        if len(df) < 5:
            return {"error": "Insufficient data after processing", "forecast": []}

        # Fit Prophet model
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
            changepoint_prior_scale=0.05,
            interval_width=0.80
        )
        model.fit(df)

        # Forecast next 7 days
        future = model.make_future_dataframe(periods=7, freq='D')
        forecast = model.predict(future)

        # Get only the future dates
        last_date = df['ds'].max()
        future_forecast = forecast[forecast['ds'] > last_date].head(7)

        days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        result = []
        for _, row in future_forecast.iterrows():
            date_str = row['ds'].strftime('%Y-%m-%d')
            expected = max(0, round(float(row['yhat'])))
            lower = max(0, round(float(row['yhat_lower'])))
            upper = max(0, round(float(row['yhat_upper'])))
            day_name = days[row['ds'].weekday() + 1 if row['ds'].weekday() < 6 else 0]
            
            confidence = "High"
            if expected < 3:
                confidence = "Low"
            elif expected < 7:
                confidence = "Medium"

            result.append({
                "date": date_str,
                "day": day_name,
                "expectedBookings": expected,
                "yhat_lower": lower,
                "yhat_upper": upper,
                "confidence": confidence
            })

        return {"forecast": result, "source": "prophet"}

    except Exception as e:
        return {"error": str(e), "forecast": []}


if __name__ == "__main__":
    input_data = sys.stdin.read().strip()
    if not input_data:
        print(json.dumps({"error": "No input data", "forecast": []}))
        sys.exit(0)
    
    output = run_prophet(input_data)
    print(json.dumps(output))
