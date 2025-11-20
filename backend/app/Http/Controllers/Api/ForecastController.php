<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ForecastController extends Controller
{
    /**
     * Return historical sales data aggregated by date (JSONB version)
     */
    public function historicalSales()
    {
        try {
            $sales = DB::table('sales_orders')
                ->select(
                    DB::raw('DATE(date) AS date'),
                    DB::raw('SUM((quantities->>\'350ml\')::int) AS qty_350ml'),
                    DB::raw('SUM((quantities->>\'500ml\')::int) AS qty_500ml'),
                    DB::raw('SUM((quantities->>\'1L\')::int) AS qty_1L'),
                    DB::raw('SUM((quantities->>\'6L\')::int) AS qty_6L')
                )
                ->groupBy(DB::raw('DATE(date)'))
                ->orderBy('date')
                ->get();

            return response()->json($sales);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch historical sales data.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Forecast sales using simple moving average (last 7 days)
     */
    public function forecast()
    {
        try {
            // 1. Aggregate total quantity per day from JSONB
            $sales = DB::table('sales_orders')
                ->select(
                    DB::raw('DATE(date) as date'),
                    DB::raw('
                        SUM( (quantities->>\'350ml\')::int ) +
                        SUM( (quantities->>\'500ml\')::int ) +
                        SUM( (quantities->>\'1L\')::int ) +
                        SUM( (quantities->>\'6L\')::int )
                    AS total_qty')
                )
                ->groupBy(DB::raw('DATE(date)'))
                ->orderBy('date', 'asc')
                ->get();

            // Convert for forecast format
            $historicalData = $sales->map(function ($row) {
                return [
                    'date' => $row->date,
                    'qty'  => (int) $row->total_qty
                ];
            });

            // 2. Get last 7 days for moving average
            $last7 = collect($historicalData)->take(-7)->pluck('qty');
            $avg = $last7->count() > 0 ? round($last7->avg()) : 0;

            // 3. Predict next 30 days
            $forecast = [];
            $start = now()->addDay(); // start tomorrow

            for ($i = 0; $i < 30; $i++) {
                $forecast[] = [
                    'date' => $start->copy()->addDays($i)->format('Y-m-d'),
                    'predicted_qty' => $avg
                ];
            }

            return response()->json([
                'forecast' => $forecast
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate forecast',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
