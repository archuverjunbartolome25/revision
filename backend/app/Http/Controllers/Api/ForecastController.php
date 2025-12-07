<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SalesOrder;
use App\Models\Inventory;
use Carbon\Carbon;

class ForecastController extends Controller 
{
    private function safeAlias($product)
    {
        return preg_replace('/[^a-zA-Z0-9_]/', '_', $product);
    }

    public function getAvailableProducts()
    {
        try {
            $products = Inventory::select('id', 'item', 'unit')
                ->orderBy('item')
                ->get();

            return response()->json([
                'products' => $products
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch products.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get raw historical sales data (simplified - for external processing)
     */
    public function historicalSales(Request $request)
    {
        try {
            // Fetch raw sales data
            $sales = SalesOrder::select('date', 'quantities')
                ->orderBy('date')
                ->get();

            // Transform to flat structure
            $transformedSales = [];
            
            foreach ($sales as $sale) {
                // Check if quantities is already an array or needs decoding
                $quantities = is_array($sale->quantities) 
                    ? $sale->quantities 
                    : json_decode($sale->quantities, true);
                
                if ($quantities && is_array($quantities)) {
                    foreach ($quantities as $product => $qty) {
                        $transformedSales[] = [
                            'date' => $sale->date,
                            'item' => $product,
                            'quantity' => (int) $qty
                        ];
                    }
                }
            }

            return response()->json($transformedSales);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch historical sales data.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ARIMA Forecast using PHP
     * Using exponential smoothing as a simplified alternative to ARIMA
     */
    public function forecast(Request $request)
    {
        try {
            $productFilter = $request->input('product');
            $forecastMonths = $request->input('months', 12);
            
            // Get all unique products
            $allProducts = $this->getUniqueProductKeys();
            
            // Filter products
            $productsToForecast = $productFilter && in_array($productFilter, $allProducts) 
                ? [$productFilter] 
                : $allProducts;
            
            $forecasts = [];
            
            foreach ($productsToForecast as $product) {
                // Get monthly aggregated data
                $monthlySales = $this->getMonthlyProductSales($product);
                
                if (count($monthlySales) < 2) {
                    // Insufficient data
                    $lastValue = count($monthlySales) > 0 ? end($monthlySales)['qty'] : 0;
                    $forecasts[$product] = [
                        'historical' => $monthlySales,
                        'future' => [],
                        'summary' => [
                            'total_historical_records' => count($monthlySales),
                            'model' => 'insufficient_data',
                            'last_known_qty' => $lastValue
                        ]
                    ];
                    continue;
                }
                
                // Apply forecasting (Holt-Winters / Exponential Smoothing)
                $forecastResult = $this->exponentialSmoothing($monthlySales, $forecastMonths);
                
                $forecasts[$product] = [
                    'historical' => $forecastResult['historical'],
                    'future' => $forecastResult['future'],
                    'summary' => [
                        'total_historical_records' => count($monthlySales),
                        'average_monthly_sales' => $forecastResult['avg'],
                        'last_month_sales' => end($monthlySales)['qty'],
                        'model' => 'Exponential Smoothing',
                        'mae' => $forecastResult['mae'],
                        'forecast_period' => $forecastMonths . ' months'
                    ]
                ];
            }

            return response()->json([
                'success' => true,
                'forecast' => $forecasts,
                'metadata' => [
                    'total_products' => count($productsToForecast),
                    'products_forecasted' => $productsToForecast
                ],
                'generated_at' => now()->toDateTimeString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate forecast',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get monthly sales for a specific product
     */
    private function getMonthlyProductSales($product)
    {
        $sales = SalesOrder::query()
            ->selectRaw("DATE_TRUNC('month', date) as month_date")
            ->selectRaw("COALESCE(SUM((quantities->>'{$product}')::int), 0) AS total_qty")
            ->groupByRaw("DATE_TRUNC('month', date)")
            ->orderBy('month_date', 'asc')
            ->get();

        return $sales->map(function ($row) {
            return [
                'date' => Carbon::parse($row->month_date)->endOfMonth()->format('Y-m-d'),
                'qty' => (int) $row->total_qty
            ];
        })->toArray();
    }

    /**
     * Exponential Smoothing Forecast
     * This is a simpler alternative to ARIMA that works well for sales forecasting
     */
    private function exponentialSmoothing($historicalData, $forecastSteps = 12)
    {
        $values = array_column($historicalData, 'qty');
        $dates = array_column($historicalData, 'date');
        $n = count($values);
        
        // Parameters for Triple Exponential Smoothing (Holt-Winters)
        $alpha = 0.3;  // Level smoothing
        $beta = 0.1;   // Trend smoothing
        $gamma = 0.2;  // Seasonality smoothing
        $season = 12;  // Monthly seasonality
        
        // Initialize level, trend, and seasonal components
        $level = $values[0];
        $trend = ($values[$n - 1] - $values[0]) / $n; // Average trend
        $seasonal = array_fill(0, $season, 1);
        
        // Calculate fitted values and update components
        $fitted = [];
        
        for ($i = 0; $i < $n; $i++) {
            $seasonIndex = $i % $season;
            $prediction = ($level + $trend) * $seasonal[$seasonIndex];
            $fitted[] = max(0, round($prediction));
            
            // Update components
            $oldLevel = $level;
            $level = $alpha * ($values[$i] / $seasonal[$seasonIndex]) + (1 - $alpha) * ($level + $trend);
            $trend = $beta * ($level - $oldLevel) + (1 - $beta) * $trend;
            $seasonal[$seasonIndex] = $gamma * ($values[$i] / $oldLevel) + (1 - $gamma) * $seasonal[$seasonIndex];
        }
        
        // Calculate MAE (Mean Absolute Error)
        $errors = [];
        for ($i = 0; $i < $n; $i++) {
            $errors[] = abs($values[$i] - $fitted[$i]);
        }
        $mae = array_sum($errors) / $n;
        
        // Build historical data with predictions
        $historical = [];
        for ($i = 0; $i < $n; $i++) {
            $historical[] = [
                'date' => $dates[$i],
                'predicted_qty' => $fitted[$i],
                'actual_qty' => $values[$i]
            ];
        }
        
        // Generate future forecasts
        $future = [];
        $lastDate = Carbon::parse($dates[$n - 1]);
        
        for ($i = 1; $i <= $forecastSteps; $i++) {
            $seasonIndex = ($n + $i - 1) % $season;
            $prediction = ($level + ($trend * $i)) * $seasonal[$seasonIndex];
            
            $futureDate = $lastDate->copy()->addMonths($i)->endOfMonth();
            
            $future[] = [
                'date' => $futureDate->format('Y-m-d'),
                'predicted_qty' => max(0, round($prediction)),
                'actual_qty' => null
            ];
        }
        
        return [
            'historical' => $historical,
            'future' => $future,
            'avg' => round(array_sum($values) / $n, 2),
            'mae' => round($mae, 2)
        ];
    }

    /**
     * Simple Moving Average Forecast (Fallback)
     */
    private function movingAverageForecast($historicalData, $forecastSteps = 12, $windowSize = 3)
    {
        $values = array_column($historicalData, 'qty');
        $dates = array_column($historicalData, 'date');
        $n = count($values);
        
        // Calculate moving average
        $avg = array_sum(array_slice($values, -$windowSize)) / $windowSize;
        
        // Historical fitted values
        $historical = [];
        for ($i = 0; $i < $n; $i++) {
            $start = max(0, $i - $windowSize + 1);
            $window = array_slice($values, $start, $i - $start + 1);
            $predicted = count($window) > 0 ? array_sum($window) / count($window) : $values[$i];
            
            $historical[] = [
                'date' => $dates[$i],
                'predicted_qty' => round($predicted),
                'actual_qty' => $values[$i]
            ];
        }
        
        // Future forecast
        $future = [];
        $lastDate = Carbon::parse($dates[$n - 1]);
        
        for ($i = 1; $i <= $forecastSteps; $i++) {
            $futureDate = $lastDate->copy()->addMonths($i)->endOfMonth();
            
            $future[] = [
                'date' => $futureDate->format('Y-m-d'),
                'predicted_qty' => round($avg),
                'actual_qty' => null
            ];
        }
        
        return [
            'historical' => $historical,
            'future' => $future,
            'avg' => round($avg, 2),
            'mae' => 0
        ];
    }

    /**
     * Aggregate forecast for all products
     */
    public function aggregateForecast(Request $request)
    {
        try {
            $forecastMonths = $request->input('months', 12);
            $allProducts = $this->getUniqueProductKeys();
            
            // Get aggregated monthly data for all products combined
            $monthlySales = $this->getAggregatedMonthlySales($allProducts);
            
            if (count($monthlySales) < 2) {
                return response()->json([
                    'error' => 'Insufficient historical data for aggregate forecast'
                ], 400);
            }
            
            $forecastResult = $this->exponentialSmoothing($monthlySales, $forecastMonths);
            
            return response()->json([
                'success' => true,
                'aggregate_forecast' => [
                    'products_included' => $allProducts,
                    'historical' => $forecastResult['historical'],
                    'future' => $forecastResult['future'],
                    'summary' => [
                        'total_historical_records' => count($monthlySales),
                        'average_monthly_sales' => $forecastResult['avg'],
                        'model' => 'Exponential Smoothing',
                        'mae' => $forecastResult['mae']
                    ]
                ],
                'generated_at' => now()->toDateTimeString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate aggregate forecast',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get aggregated monthly sales for all products
     */
    private function getAggregatedMonthlySales($products)
    {
        $sumParts = [];
        foreach ($products as $product) {
            $sumParts[] = "COALESCE((quantities->>'{$product}')::int, 0)";
        }
        $sumQuery = implode(' + ', $sumParts);
        
        $sales = SalesOrder::query()
            ->selectRaw("DATE_TRUNC('month', date) as month_date")
            ->selectRaw("SUM({$sumQuery}) AS total_qty")
            ->groupByRaw("DATE_TRUNC('month', date)")
            ->orderBy('month_date', 'asc')
            ->get();

        return $sales->map(function ($row) {
            return [
                'date' => Carbon::parse($row->month_date)->endOfMonth()->format('Y-m-d'),
                'qty' => (int) $row->total_qty
            ];
        })->toArray();
    }

    /**
     * Get unique product keys from quantities JSONB column
     */
    private function getUniqueProductKeys(): array
    {
        try {
            $result = DB::select("
                SELECT DISTINCT jsonb_object_keys(quantities) as product_key
                FROM sales_orders
                WHERE quantities IS NOT NULL
                ORDER BY product_key
            ");

            return array_map(fn($row) => $row->product_key, $result);

        } catch (\Exception $e) {
            return ['350ml', '500ml', '1L', '6L'];
        }
    }
}