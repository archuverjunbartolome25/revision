from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

@app.route('/hello')
def hello():
    return jsonify({"message": "Flask is working!"})

# Dummy forecast route
@app.route('/forecast')
def forecast():
    today = datetime.today()
    # generate 30 days of dummy forecast data
    data = []
    for i in range(30):
        day = today + timedelta(days=i)
        data.append({
            "date": day.strftime("%Y-%m-%d"),
            "qty_350ml": i + 10,   # dummy numbers
            "qty_500ml": i + 5,
            "qty_1L": i + 2,
            "qty_6L": i + 1
        })
    return jsonify({"forecast": data})

if __name__ == '__main__':
    app.run(port=5001)
