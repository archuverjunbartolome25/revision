<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SalesOrder;
use App\Models\Inventory;

class ForecastController extends Controller 
{
    private function safeAlias($product)
    {
        // Replace spaces and special chars with underscore
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

    public function historicalSales(Request $request)
    {
        try {
            $productFilter = $request->input('product'); // e.g., '350ml', '500ml', '1L', '6L', or null for all
            
            // Get all unique product keys from the quantities JSONB column
            $allProducts = $this->getUniqueProductKeys();
            
            $query = SalesOrder::query()->selectRaw('DATE(date) AS date');

            if ($productFilter && in_array($productFilter, $allProducts)) {
                $alias = $this->safeAlias($productFilter);
                $query->selectRaw("SUM((quantities::jsonb->>'{$productFilter}')::int) AS qty_{$alias}");
            } else {
                foreach ($allProducts as $product) {
                    $alias = $this->safeAlias($product);
                    $query->selectRaw("SUM((quantities::jsonb->>'{$product}')::int) AS qty_{$alias}");
                }
            }
            
            $sales = $query
                ->groupByRaw('DATE(date)')
                ->orderBy('date')
                ->get();

            return response()->json([
                'sales' => $sales,
                'products' => $productFilter ? [$productFilter] : $allProducts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch historical sales data.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function forecast(Request $request)
    {
        try {
            $productFilter = $request->input('product'); // e.g., '350ml', '500ml', etc.
            $days = $request->input('days', 30); // Forecast period (default 30 days)
            $movingAvgPeriod = $request->input('avg_period', 7); // Moving average period (default 7 days)
            
            // Get all unique product keys
            $allProducts = $this->getUniqueProductKeys();
            
            // Determine which products to forecast
            $productsToForecast = $productFilter && in_array($productFilter, $allProducts) 
                ? [$productFilter] 
                : $allProducts;
            
            $forecasts = [];
            
            foreach ($productsToForecast as $product) {
                // 1. Get historical data for this specific product
                $sales = SalesOrder::query()
                    ->selectRaw('DATE(date) as date')
                    ->selectRaw("COALESCE(SUM((quantities->>'{$product}')::int), 0) AS total_qty")
                    ->groupByRaw('DATE(date)')
                    ->orderBy('date', 'asc')
                    ->get();

                // Convert for forecast format
                $historicalData = $sales->map(function ($row) {
                    return [
                        'date' => $row->date,
                        'qty'  => (int) $row->total_qty
                    ];
                })->filter(function($row) {
                    return $row['qty'] > 0; // Only include days with actual sales
                });

                // 2. Calculate moving average from last N days
                $lastNDays = collect($historicalData)->take(-$movingAvgPeriod)->pluck('qty');
                $avg = $lastNDays->count() > 0 ? round($lastNDays->avg(), 2) : 0;

                // 3. Generate forecast for next N days
                $productForecast = [];
                $start = now()->addDay();

                for ($i = 0; $i < $days; $i++) {
                    $productForecast[] = [
                        'date' => $start->copy()->addDays($i)->format('Y-m-d'),
                        'predicted_qty' => $avg
                    ];
                }

                $forecasts[$product] = [
                    'product' => $product,
                    'historical_avg' => $avg,
                    'forecast_period_days' => $days,
                    'based_on_last_days' => $movingAvgPeriod,
                    'historical_data_points' => $historicalData->count(),
                    'forecast' => $productForecast
                ];
            }

            return response()->json([
                'forecasts' => $forecasts,
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
     * Get aggregate forecast (all products combined)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function aggregateForecast(Request $request)
    {
        try {
            $days = $request->input('days', 30);
            $movingAvgPeriod = $request->input('avg_period', 7);
            
            $allProducts = $this->getUniqueProductKeys();
            
            // Build dynamic sum query for all products
            $sumParts = [];
            foreach ($allProducts as $product) {
                $sumParts[] = "COALESCE(SUM((quantities->>'{$product}')::int), 0)";
            }
            $sumQuery = implode(' + ', $sumParts);
            
            // Get aggregated historical data
            $sales = SalesOrder::query()
                ->selectRaw('DATE(date) as date')
                ->selectRaw("{$sumQuery} AS total_qty")
                ->groupByRaw('DATE(date)')
                ->orderBy('date', 'asc')
                ->get();

            $historicalData = $sales->map(function ($row) {
                return [
                    'date' => $row->date,
                    'qty'  => (int) $row->total_qty
                ];
            })->filter(function($row) {
                return $row['qty'] > 0;
            });

            // Calculate moving average
            $lastNDays = collect($historicalData)->take(-$movingAvgPeriod)->pluck('qty');
            $avg = $lastNDays->count() > 0 ? round($lastNDays->avg(), 2) : 0;

            // Generate forecast
            $forecast = [];
            $start = now()->addDay();

            for ($i = 0; $i < $days; $i++) {
                $forecast[] = [
                    'date' => $start->copy()->addDays($i)->format('Y-m-d'),
                    'predicted_qty' => $avg
                ];
            }

            return response()->json([
                'aggregate_forecast' => [
                    'products_included' => $allProducts,
                    'historical_avg' => $avg,
                    'forecast_period_days' => $days,
                    'based_on_last_days' => $movingAvgPeriod,
                    'historical_data_points' => $historicalData->count(),
                    'forecast' => $forecast
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
     * Get unique product keys from the quantities JSONB column
     *
     * @return array
     */
    private function getUniqueProductKeys(): array
    {
        try {
            // Query to extract all unique keys from JSONB quantities column
            $result = DB::select("
                SELECT DISTINCT jsonb_object_keys(quantities) as product_key
                FROM sales_orders
                WHERE quantities IS NOT NULL
                ORDER BY product_key
            ");

            return array_map(fn($row) => $row->product_key, $result);

        } catch (\Exception $e) {
            // Fallback to common products if query fails
            return ['350ml', '500ml', '1L', '6L'];
        }
    }
}