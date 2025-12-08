<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use App\Models\SalesOrder;
use App\Models\InventoryRawMat;
use App\Models\Inventory;



class ReportController extends Controller
{

   


    public function salesReport(Request $request)
    {
        // Fetch ALL inventory records
        $inventoryMap = DB::table('inventories')
            ->get()
            ->keyBy('item');
    
        // Fetch ALL raw materials
        $rawMatsMap = DB::table('inventory_rawmats')
            ->get()
            ->keyBy('id');
    
        // Fetch ALL suppliers
        $suppliersMap = DB::table('suppliers')
            ->get()
            ->keyBy('id');
    
        // Fetch ALL supplier offers
        $supplierOffersMap = DB::table('supplier_offers')
            ->get()
            ->keyBy('id');
    
        $salesOrders = DB::table('sales_orders as so')
            ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
            ->select(
                'so.id',
                'so.location',
                'so.date',
                'so.products',
                'so.delivery_date',
                'so.date_delivered',
                'so.status',
                'so.order_type',
                'so.amount as total_sales',
                'so.quantities',
                'c.id as customer_id',
                'c.name as customer_name'
            )
            ->orderBy('so.date', 'desc')
            ->get()
            ->map(function ($order) use ($inventoryMap, $rawMatsMap, $suppliersMap, $supplierOffersMap) {
    
                // Decode products
                $products = json_decode($order->products, true) ?? [];
                if (is_string($products)) {
                    $products = json_decode($products, true) ?? [];
                }
    
                // Decode quantities
                $quantities = json_decode($order->quantities, true) ?? [];
                
                $cogs = 0;
                $totalQty = 0;
                $productBreakdown = [];
    
                // Loop through products
                foreach ($products as $productName) {
                    $casesSold = $quantities[$productName] ?? 0;
                    $casesSold = (int)$casesSold;
                    $totalQty += $casesSold;
    
                    $inventory = $inventoryMap->get($productName);
    
                    if (!$inventory) {
                        Log::warning("No inventory for: $productName");
                        continue;
                    }
    
                    $selectedMaterials = json_decode($inventory->selected_materials, true) ?? [];
                    $productionCostPerCase = 0;
                    $pcsPerCase = (int)$inventory->pcs_per_unit ?: 1;
                    $materialsUsed = [];
    
                    foreach ($selectedMaterials as $materialName => $supplierOfferId) {
                        $supplierOffer = $supplierOffersMap->get($supplierOfferId);
    
                        if (!$supplierOffer) {
                            Log::warning("Supplier offer #$supplierOfferId not found");
                            continue;
                        }
    
                        $rawMat = $rawMatsMap->get($supplierOffer->rawmat_id);
    
                        if (!$rawMat) {
                            Log::warning("Raw material #{$supplierOffer->rawmat_id} not found");
                            continue;
                        }
    
                        $supplier = $suppliersMap->get($supplierOffer->supplier_id);
    
                        // Get supplier offer price (this is the price we use)
                        $supplierOfferPrice = (float)$supplierOffer->price;
                        
                        // Get conversion factor from raw material
                        $conversion = (float)$rawMat->conversion ?: 1;
                        
                        // Calculate price per piece
                        $pricePerPiece = $supplierOfferPrice / $conversion;
                        
                        // Calculate cost per case (1:1 ratio - 1 piece of raw material per 1 piece of finished good)
                        $costPerCase = $pricePerPiece * $pcsPerCase;
                        
                        // Total pieces of this raw material used for all cases sold
                        $totalPiecesUsed = $pcsPerCase * $casesSold;
                        
                        // Total cost for this raw material
                        $totalMaterialCost = $pricePerPiece * $totalPiecesUsed;
    
                        $productionCostPerCase += $costPerCase;
    
                        // Store material details with calculations
                        $materialsUsed[] = [
                            'supplier_offer' => (array) $supplierOffer,
                            'raw_material' => (array) $rawMat,
                            'supplier' => $supplier ? (array) $supplier : null,
                            'calculations' => [
                                'supplier_offer_price' => $supplierOfferPrice, // Price from supplier_offer (e.g., ₱0.20 per roll)
                                'conversion' => $conversion, // Pieces per unit (e.g., 10000 pcs per roll)
                                'price_per_piece' => round($pricePerPiece, 6), // ₱0.20 / 10000 = ₱0.00002 per piece
                                'pieces_per_case' => $pcsPerCase, // e.g., 24 pcs per case
                                'cost_per_case' => round($costPerCase, 4), // ₱0.00002 × 24 = ₱0.00048 per case
                                'cases_sold' => $casesSold,
                                'total_pieces_used' => $totalPiecesUsed, // 24 × cases_sold
                                'total_material_cost' => round($totalMaterialCost, 2), // ₱0.00002 × total_pieces_used
                            ]
                        ];
                    }
    
                    $cogs += $productionCostPerCase * $casesSold;
    
                    // Store product details
                    $productBreakdown[] = [
                        'inventory' => (array) $inventory,
                        'product_name' => $productName,
                        'cases_sold' => $casesSold,
                        'production_cost_per_case' => round($productionCostPerCase, 2),
                        'total_production_cost' => round($productionCostPerCase * $casesSold, 2),
                        'materials_used' => $materialsUsed,
                    ];
                }
    
                // Add fields to existing order object
                $order->total_qty = $totalQty;
                $order->cogs = round($cogs, 2);
                $order->profit = round($order->total_sales - $cogs, 2);
                $order->product_breakdown = $productBreakdown;
    
                return $order;
            });
    
        return response()->json($salesOrders);
    }
    // public function salesReport(Request $request)
    // {
    //     // Fetch ALL inventory records
    //     $inventoryMap = DB::table('inventories')
    //         ->get()
    //         ->keyBy('item');
    
    //     // Fetch ALL raw materials
    //     $rawMatsMap = DB::table('inventory_rawmats')
    //         ->get()
    //         ->keyBy('id');
    
    //     // Fetch ALL suppliers
    //     $suppliersMap = DB::table('suppliers')
    //         ->get()
    //         ->keyBy('id');
    
    //     // Fetch ALL supplier offers
    //     $supplierOffersMap = DB::table('supplier_offers')
    //         ->get()
    //         ->keyBy('id');
    
    //     $salesOrders = DB::table('sales_orders as so')
    //         ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
    //         ->select('so.*', 'c.*', 'so.id as order_id')
    //         ->orderBy('so.date', 'desc')
    //         ->get()
    //         ->map(function ($order) use ($inventoryMap, $rawMatsMap, $suppliersMap, $supplierOffersMap) {
    
    //             // Decode products
    //             $products = json_decode($order->products, true) ?? [];
    //             if (is_string($products)) {
    //                 $products = json_decode($products, true) ?? [];
    //             }
    
    //             // Decode quantities
    //             $quantities = json_decode($order->quantities, true) ?? [];
                
    //             $cogs = 0;
    //             $totalQty = 0;
    //             $productBreakdown = [];
    
    //             // Loop through products
    //             foreach ($products as $productName) {
    //                 $orderQty = $quantities[$productName] ?? 0;
    //                 $orderQty = (int)$orderQty;
    //                 $totalQty += $orderQty;
    
    //                 // Get inventory for this product
    //                 $inventory = $inventoryMap->get($productName);
    
    //                 if (!$inventory) {
    //                     Log::warning("No inventory for: $productName");
    //                     continue;
    //                 }
                    
    //                 // Decode selected_materials
    //                 $selectedMaterials = json_decode($inventory->selected_materials, true) ?? [];
    //                 $productionCostPerCase = 0;
    //                 $pcsPerCase = (int)$inventory->pcs_per_unit ?: 1;
    //                 $materialsUsed = [];
    
    //                 // Loop through selected materials
    //                 foreach ($selectedMaterials as $materialName => $supplierOfferId) {
    //                     // Get supplier offer
    //                     $supplierOffer = $supplierOffersMap->get($supplierOfferId);
    
    //                     if (!$supplierOffer) {
    //                         Log::warning("Supplier offer #$supplierOfferId not found");
    //                         continue;
    //                     }
    
    //                     // Get raw material
    //                     $rawMat = $rawMatsMap->get($supplierOffer->rawmat_id);
    
    //                     if (!$rawMat) {
    //                         Log::warning("Raw material #{$supplierOffer->rawmat_id} not found");
    //                         continue;
    //                     }
    
    //                     // Get supplier
    //                     $supplier = $suppliersMap->get($supplierOffer->supplier_id);
    
    //                     // Calculate costs
    //                     $pricePerUnit = (float)$supplierOffer->price;
    //                     $conversion = (float)$rawMat->conversion ?: 1;
    //                     $pricePerPiece = $pricePerUnit / $conversion;
    //                     $costPerCase = $pricePerPiece * $pcsPerCase;
    //                     $totalMaterialCost = $costPerCase * $orderQty;
    
    //                     $productionCostPerCase += $costPerCase;
    
    //                     // Store complete objects
    //                     $materialsUsed[] = [
    //                         'supplier_offer' => (array) $supplierOffer,
    //                         'raw_material' => (array) $rawMat,
    //                         'supplier' => $supplier ? (array) $supplier : null,
    //                         'calculations' => [
    //                             'price_per_unit' => $pricePerUnit,
    //                             'conversion' => $conversion,
    //                             'price_per_piece' => round($pricePerPiece, 4),
    //                             'pieces_per_case' => $pcsPerCase,
    //                             'cost_per_case' => round($costPerCase, 2),
    //                             'cases_sold' => $orderQty,
    //                             'total_pieces_used' => $pcsPerCase * $orderQty,
    //                             'total_material_cost' => round($totalMaterialCost, 2),
    //                         ]
    //                     ];
    //                 }
    
    //                 $productCOGS = $productionCostPerCase * $orderQty;
    //                 $cogs += $productCOGS;
    
    //                 // Store product with all materials
    //                 $productBreakdown[] = [
    //                     'inventory' => (array) $inventory,
    //                     'product_name' => $productName,
    //                     'cases_sold' => $orderQty,
    //                     'pieces_per_case' => $pcsPerCase,
    //                     'total_pieces_sold' => $pcsPerCase * $orderQty,
    //                     'production_cost_per_case' => round($productionCostPerCase, 2),
    //                     'total_cogs' => round($productCOGS, 2),
    //                     'materials_used' => $materialsUsed,
    //                 ];
    //             }
    
    //             $profit = $order->amount - $cogs;
    
    //             return [
    //                 'order' => (array) $order,
    //                 'products' => $productBreakdown,
    //                 'totals' => [
    //                     'total_qty' => $totalQty,
    //                     'total_sales' => round($order->amount, 2),
    //                     'total_cogs' => round($cogs, 2),
    //                     'gross_profit' => round($profit, 2),
    //                     'profit_margin_percent' => $order->amount > 0 
    //                         ? round(($profit / $order->amount) * 100, 2) 
    //                         : 0,
    //                 ]
    //             ];
    //         });
    
    //     return response()->json([
    //         'success' => true,
    //         'data' => $salesOrders->values()
    //     ]);
    // }

    // Stat analytics
    public function topCustomers()
    {
        $top = SalesOrder::selectRaw('customer_id, COUNT(*) as total_orders, SUM(amount) as total_amount')
            ->with('customer:id,name')
            ->groupBy('customer_id')
            ->orderByDesc('total_amount')
            ->take(10)
            ->get();
    
        foreach ($top as $customerData) {
            $customerId = $customerData->customer_id;
    
            $orders = SalesOrder::where('customer_id', $customerId)->get();
    
            $summary = [];
    
            foreach ($orders as $order) {
                // Decode products safely
                $products = is_array($order->products) ? $order->products : json_decode($order->products, true) ?? [];
                $quantities = is_array($order->quantities) ? $order->quantities : json_decode($order->quantities, true) ?? [];
            
                foreach ($products as $productName) {
                    $qty = $quantities[$productName] ?? 0;
            
                    $totalQtyInOrder = array_sum($quantities);
                    $productCost = $totalQtyInOrder > 0 ? ($order->amount / $totalQtyInOrder) * $qty : 0;
            
                    if (!isset($summary[$productName])) {
                        $summary[$productName] = [
                            'product' => $productName,
                            'total_quantity' => 0,
                            'total_cost' => 0,
                        ];
                    }
            
                    $summary[$productName]['total_quantity'] += $qty;
                    $summary[$productName]['total_cost'] += $productCost;
                }
            }
    
            $customerData->product_summary = array_values($summary);
        }
    
        return response()->json($top);
    }


    public function getRawMaterialsAnalysis(Request $request)
    {
        try {
            $days = $request->input('days', 30);
            $forecastDays = $request->input('forecast_days', 30);
            $leadTime = $request->input('lead_time', 7);
            
            $historicalOrders = SalesOrder::where('date', '>=', Carbon::now()->subDays($days))
                ->where('status', '!=', 'cancelled')
                ->get();
    
            \Log::info('Historical Orders Count: ' . $historicalOrders->count());
            \Log::info('Sample Order: ', $historicalOrders->first() ? $historicalOrders->first()->toArray() : []);
    
            $rawMatDemand = $this->calculateRawMaterialDemand($historicalOrders);
            
            \Log::info('Raw Material Demand: ', $rawMatDemand);
            
            $currentStock = InventoryRawmat::select(
                'id',
                'item',
                'unit',
                'quantity',
                'quantity_pieces',
                'unit_cost',
                'low_stock_alert',
                'conversion'
            )
            ->orderBy('id')      
            ->get()
            ->keyBy('id');
    
            \Log::info('Current Stock Count: ' . $currentStock->count());
    
            $analysis = [];
            
            foreach ($rawMatDemand as $rawMatId => $demand) {
                $stock = $currentStock->get($rawMatId);
                
                if (!$stock) {
                    \Log::warning("Stock not found for raw material ID: $rawMatId");
                    continue;
                }
                
                $avgDailyDemand = $demand['total_pieces'] / $days;
                $forecastDemand = $avgDailyDemand * $forecastDays;
                $leadTimeDemand = $avgDailyDemand * $leadTime;
                
                $currentStockPcs = $stock->quantity_pieces;
                $stockoutRisk = $currentStockPcs - $forecastDemand;
                $reorderPoint = $leadTimeDemand + ($stock->low_stock_alert * $stock->conversion);
                $reorderNeeded = $currentStockPcs <= $reorderPoint;
                
                // Get supplier offer price for this raw material
                $supplierOffer = $demand['supplier_offer'] ?? null;
                $supplierPrice = $supplierOffer ? $supplierOffer->price : $stock->unit_cost;
                
                // Calculate total cost of materials used in historical period
                $totalUsedCost = $demand['total_pieces'] * ($supplierPrice / $stock->conversion);
                
                $analysis[] = [
                    'raw_material_id' => $rawMatId,
                    'item' => $stock->item,
                    'unit' => $stock->unit,
                    'unit_cost' => $stock->unit_cost,
                    'supplier_unit_price' => $supplierPrice,
                    'current_stock_units' => $stock->quantity,
                    'current_stock_pieces' => $currentStockPcs,
                    'total_used_pieces' => $demand['total_pieces'],
                    'total_used_cost' => round($totalUsedCost, 2),
                    'avg_daily_demand' => round($avgDailyDemand, 2),
                    'forecast_demand_pieces' => round($forecastDemand, 2),
                    'forecast_demand_units' => round($forecastDemand / $stock->conversion, 2),
                    'stockout_risk_pieces' => round($stockoutRisk, 2),
                    'lead_time_demand_pieces' => round($leadTimeDemand, 2),
                    'lead_time_demand_units' => round($leadTimeDemand / $stock->conversion, 2),
                    'reorder_point_pieces' => round($reorderPoint, 2),
                    'reorder_needed' => $reorderNeeded,
                    'suggested_order_pieces' => $reorderNeeded ? round(max(0, $forecastDemand - $currentStockPcs + $leadTimeDemand), 2) : 0,
                    'suggested_order_units' => $reorderNeeded ? round(max(0, ($forecastDemand - $currentStockPcs + $leadTimeDemand) / $stock->conversion), 2) : 0,
                    'suggested_order_cost' => $reorderNeeded ? round(max(0, ($forecastDemand - $currentStockPcs + $leadTimeDemand) / $stock->conversion) * $supplierPrice, 2) : 0,
                ];
            }
            
            \Log::info('Analysis Count: ' . count($analysis));
            
            $filtered = collect($analysis);
            
            if ($request->has('min_price')) {
                $filtered = $filtered->where('unit_cost', '>=', $request->min_price);
            }
            if ($request->has('max_price')) {
                $filtered = $filtered->where('unit_cost', '<=', $request->max_price);
            }
            if ($request->has('unit')) {
                $filtered = $filtered->where('unit', $request->unit);
            }
            if ($request->has('min_quantity')) {
                $filtered = $filtered->where('current_stock_pieces', '>=', $request->min_quantity);
            }
            if ($request->has('max_quantity')) {
                $filtered = $filtered->where('current_stock_pieces', '<=', $request->max_quantity);
            }
            
            // Calculate totals
            $totalUsedCost = $filtered->sum('total_used_cost');
            $totalSuggestedOrderCost = $filtered->sum('suggested_order_cost');
            
            return response()->json([
                'success' => true,
                'data' => $filtered->values()->all(),
                'totals' => [
                    'total_raw_materials_cost_used' => round($totalUsedCost, 2),
                    'total_suggested_order_cost' => round($totalSuggestedOrderCost, 2),
                    'materials_needing_reorder' => $filtered->where('reorder_needed', true)->count(),
                ],
                'parameters' => [
                    'historical_days' => $days,
                    'forecast_days' => $forecastDays,
                    'lead_time_days' => $leadTime,
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in getRawMaterialsAnalysis: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
    
    private function calculateRawMaterialDemand($orders)
    {
        $demand = [];
        
        foreach ($orders as $order) {
            \Log::info("Processing Order ID: {$order->id}");
            
            $products = is_array($order->products) ? $order->products : json_decode($order->products, true) ?? [];
            $quantities = is_array($order->quantities) ? $order->quantities : json_decode($order->quantities, true) ?? [];
            
            \Log::info('Products: ', $products);
            \Log::info('Quantities: ', $quantities);
            
            foreach ($products as $productName) {
                $orderQty = $quantities[$productName] ?? 0;
                
                \Log::info("Product: $productName, Quantity: $orderQty");
                
                if ($orderQty == 0) continue;
                
                $inventory = Inventory::where('item', $productName)->first();
                
                if (!$inventory) {
                    \Log::warning("Inventory not found for: $productName");
                    continue;
                }
                
                if (!$inventory->selected_materials) {
                    \Log::warning("No selected materials for: $productName");
                    continue;
                }
                
                $selectedMaterials = is_array($inventory->selected_materials) 
                    ? $inventory->selected_materials 
                    : json_decode($inventory->selected_materials, true) ?? [];
                
                \Log::info("Selected Materials for $productName: ", $selectedMaterials);
                
                foreach ($selectedMaterials as $materialName => $supplierOfferId) {
                    $supplierOffer = DB::table('supplier_offers')
                        ->where('id', $supplierOfferId)
                        ->first();
                    
                    if (!$supplierOffer) {
                        \Log::warning("Supplier offer not found for ID: $supplierOfferId");
                        continue;
                    }
                    
                    $rawMatId = $supplierOffer->rawmat_id;
                    
                    \Log::info("Raw Material ID: $rawMatId, Adding Demand: $orderQty");
                    
                    if (!isset($demand[$rawMatId])) {
                        $demand[$rawMatId] = [
                            'total_pieces' => 0,
                            'supplier_offer' => $supplierOffer
                        ];
                    }
                    
                    $demand[$rawMatId]['total_pieces'] += $orderQty;
                    // Keep the supplier offer for price calculation
                    $demand[$rawMatId]['supplier_offer'] = $supplierOffer;
                }
            }
        }
        
        \Log::info('Final Demand Calculation: ', $demand);
        
        return $demand;
    }





    // *OLD
// public function salesReport(Request $request)
// {
//     // BOM / unit cost per bottle
//     $UNIT_COGS = [
//         '350ml' => 2.89,
//         '500ml' => 3.29,
//         '1L'    => 3.79,
//         '6L'    => 5.00,
//     ];

//     // Pieces per case
//     $PCS_PER_CASE = [
//         '350ml' => 24,
//         '500ml' => 24,
//         '1L'    => 12,
//         '6L'    => 1,
//     ];

//     $salesOrders = DB::table('sales_orders as so')
//         ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
//         ->select(
//             'so.id',
//             'so.location',
//             'so.date',
//             'so.products',
//             'so.delivery_date',
//             'so.date_delivered',
//             'so.status',
//             'so.order_type',
//             'so.amount as total_sales',
//             'so.quantities',
//             'c.name as customer_name'
//         )
//         ->orderBy('so.date', 'desc')
//         ->get()
//         ->map(function ($order) use ($UNIT_COGS, $PCS_PER_CASE) {
//             $qty = json_decode($order->quantities, true) ?? [];
//             $totalQty = array_sum(array_map(fn($v) => (int)$v, $qty));

//             $cogs = 0;
//             foreach ($qty as $product => $cases) {
//                 $unitCost = $UNIT_COGS[$product] ?? 0;
//                 $piecesPerCase = $PCS_PER_CASE[$product] ?? 1;

//                 // COGS = unit cost * number of pieces in a case * number of cases sold
//                 $cogs += $unitCost * $piecesPerCase * (int)$cases;
//             }

//             $totalSales = (float)$order->total_sales;
//             $profit = $totalSales - $cogs;

//             $order->total_qty = $totalQty;
//             $order->cogs = round($cogs, 2);
//             $order->profit = round($profit, 2);

//             return $order;
//         });

//     return response()->json($salesOrders);
// }

public function salesReportPDF(Request $request)
{
    $UNIT_COGS = [
        '350ml' => 2.89,
        '500ml' => 3.29,
        '1L'    => 3.79,
        '6L'    => 5.00,
    ];

    $PCS_PER_CASE = [
        '350ml' => 24,
        '500ml' => 24,
        '1L'    => 12,
        '6L'    => 1,
    ];

    // Filters from request
    $reportType = $request->query('reportType', 'All'); // Daily / Weekly / Monthly / Yearly
    $filterValue = $request->query('filterValue'); // e.g., 2025-11-05, 2025-45 (week), 2025-11 (month)
    $statusFilter = $request->query('status', 'All'); // Pending / Delivered / All

    $query = DB::table('sales_orders as so')
        ->leftJoin('customers as c', 'so.customer_id', '=', 'c.id')
        ->select(
            'so.id',
            'so.location',
            'so.date',
            'so.products',
            'so.delivery_date',
            'so.date_delivered',
            'so.order_type',
            'so.status',
            'so.amount as total_sales',
            'so.quantities',
            'c.name as customer_name'
        );

    // ✅ Apply date filter
    if ($filterValue) {
        switch ($reportType) {
            case 'Daily':
                $query->whereDate('so.date', $filterValue);
                break;

            case 'Weekly':
                [$year, $week] = explode('-W', $filterValue);
                $weekStart = new DateTime();
                $weekStart->setISODate($year, $week);
                $weekEnd = clone $weekStart;
                $weekEnd->modify('+6 days');
                $query->whereBetween('so.date', [
                    $weekStart->format('Y-m-d'),
                    $weekEnd->format('Y-m-d')
                ]);
                break;

            case 'Monthly':
                [$year, $month] = explode('-', $filterValue);
                $query->whereYear('so.date', $year)
                      ->whereMonth('so.date', $month);
                break;

            case 'Yearly':
                $query->whereYear('so.date', $filterValue);
                break;
        }
    }

    // ✅ Apply status filter
    if ($statusFilter !== 'All') {
        if ($statusFilter === 'Pending') {
            $query->whereNull('so.date_delivered');
        } elseif ($statusFilter === 'Delivered') {
            $query->whereNotNull('so.date_delivered');
        }
    }

    $salesOrders = $query->orderBy('so.date', 'desc')->get()
        ->map(function ($order) use ($UNIT_COGS, $PCS_PER_CASE) {
            $qty = json_decode($order->quantities, true) ?? [];
            $totalQty = array_sum(array_map(fn($v) => (int)$v, $qty));

            $cogs = 0;
            foreach ($qty as $product => $cases) {
                $unitCost = $UNIT_COGS[$product] ?? 0;
                $piecesPerCase = $PCS_PER_CASE[$product] ?? 1;
                $cogs += $unitCost * $piecesPerCase * (int)$cases;
            }

            $profit = (float)$order->total_sales - $cogs;

            $order->total_qty = $totalQty;
            $order->cogs = round($cogs, 2);
            $order->profit = round($profit, 2);

            return $order;
        });

    // ✅ Generate filename
    $fileName = $filterValue
        ? "Sales_Report_{$reportType}_" . str_replace('-', '', $filterValue) . ".pdf"
        : "Sales_Report_All.pdf";

    $pdf = Pdf::loadView('pdfs.sales_report_pdf', [
        'salesOrders' => $salesOrders,
        'selectedDate' => $filterValue,
        'reportType' => $reportType,
        'generatedAt' => Carbon::now()->format('F j, Y, g:i A'),
    ])->setPaper('a4', 'landscape');

    return $pdf->download($fileName);
}

public function inventoryReportPDF(Request $request)
{
    $type = $request->query('type', 'All');
    $dateNow = Carbon::now()->format('mdY');

    // ✅ Fetch inventory data depending on type
    if ($type === 'Raw Material') {
        $data = DB::table('inventory_rawmats')->orderBy('item')->get();
    } elseif ($type === 'Finished Goods') {
        $data = DB::table('inventories')->orderBy('item')->get();
    } else {
        $data = DB::table('inventories')
            ->select('item', 'unit', 'unit_cost', 'quantity', 'quantity_pcs', 'low_stock_alert', 'updated_at')
            ->union(
                DB::table('inventory_rawmats')
                    ->select('item', 'unit', 'unit_cost', 'quantity', 'quantity_pcs', 'low_stock_alert', 'updated_at')
            )
            ->get();
    }

    // ✅ Set filename dynamically
    if ($type !== 'All') {
        $fileName = "Inventory_Report_" . str_replace(' ', '_', $type) . "_{$dateNow}.pdf";
    } else {
        $fileName = "Inventory_Report.pdf";
    }

    $pdf = Pdf::loadView('pdfs.inventory_report_pdf', [
        'inventoryData' => $data,
        'selectedType' => $type,
        'generatedAt' => Carbon::now()->format('F j, Y, g:i A'),
    ])->setPaper('a4', 'landscape');

    return $pdf->download($fileName);
}
// 🗑️ DISPOSAL REPORT PDF
public function disposalReportPDF(Request $request)
{
    $query = DB::table('disposals');

    // Filter by status
    if ($request->status) {
        $query->where('status', $request->status);
    }

    // Filter by report type & filter value
    $reportType = $request->reportType ?? 'All';
    $filterValue = $request->filterValue;

    if ($reportType === 'Daily' && $filterValue) {
        $query->whereDate('disposal_date', $filterValue);
    }

    if ($reportType === 'Weekly' && $filterValue) {
        [$year, $week] = explode('-W', $filterValue);
        $weekStart = new DateTime();
        $weekStart->setISODate($year, $week);
        $weekEnd = clone $weekStart;
        $weekEnd->modify('+6 days');
        $query->whereBetween('disposal_date', [$weekStart->format('Y-m-d'), $weekEnd->format('Y-m-d')]);
    }

    if ($reportType === 'Monthly' && $filterValue) {
        [$year, $month] = explode('-', $filterValue);
        $query->whereYear('disposal_date', $year)->whereMonth('disposal_date', $month);
    }

    if ($reportType === 'Yearly' && $filterValue) {
        $query->whereYear('disposal_date', $filterValue);
    }

    // Optional search filter
    if ($request->search) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('item', 'ILIKE', "%$search%")
              ->orWhere('reason', 'ILIKE', "%$search%");
        });
    }

    // Fetch filtered results
    $disposals = $query->orderBy('id', 'desc')->get();

    // Generate PDF
    $pdf = Pdf::loadView('pdfs.disposal_report_pdf', [
        'disposals' => $disposals,
        'generatedAt' => Carbon::now()->format('F j, Y, g:i A'),
    ])->setPaper('a4', 'landscape');

    $fileName = 'Disposal_Report_' . now()->format('Ymd') . '.pdf';

    return $pdf->download($fileName);
}
public function returnToVendorReportPDF(Request $request)
{
    $query = DB::table('return_to_vendor as r')
        ->leftJoin('customers as c', 'r.customer_id', '=', 'c.id')
        ->select('r.*', 'c.name as customer_name');

    $reportType = $request->reportType ?? 'All';
    $filterValue = $request->filterValue;

    // Apply filtering by report type
    if ($filterValue) {
        switch ($reportType) {
            case 'Daily':
                $query->whereDate('r.date_returned', $filterValue);
                break;

            case 'Weekly':
                [$year, $week] = explode('-W', $filterValue);
                $weekStart = new DateTime();
                $weekStart->setISODate($year, $week);
                $weekEnd = clone $weekStart;
                $weekEnd->modify('+6 days');
                $query->whereBetween('r.date_returned', [
                    $weekStart->format('Y-m-d'),
                    $weekEnd->format('Y-m-d')
                ]);
                break;

            case 'Monthly':
                [$year, $month] = explode('-', $filterValue);
                $query->whereYear('r.date_returned', $year)
                      ->whereMonth('r.date_returned', $month);
                break;

            case 'Yearly':
                $query->whereYear('r.date_returned', $filterValue);
                break;
        }
    }

    // Optional status filter
    if ($request->status) {
        $query->where('r.status', $request->status);
    }

    // Optional search filter
    if ($request->search) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('r.rtv_number', 'ILIKE', "%$search%")
              ->orWhere('r.status', 'ILIKE', "%$search%");
        });
    }

    // Fetch filtered results
    $returns = $query->orderBy('r.id', 'desc')->get();

    // Generate PDF
    $pdf = Pdf::loadView('pdfs.return_to_vendor_report', [
        'returns' => $returns,
        'selectedDate' => $filterValue,
        'reportType' => $reportType,
        'generatedAt' => Carbon::now()->format('F j, Y, g:i A'),
    ])->setPaper('a4', 'landscape');

    $fileName = 'ReturnToVendor_Report_' . now()->format('Ymd') . '.pdf';

    return $pdf->download($fileName);
}
public function purchaseOrderReportPDF(Request $request)
{
    $status = $request->query('status', 'All'); // Filter by status if provided
    $date = $request->query('date'); // Filter by date if provided
    $dateNow = Carbon::now()->format('mdY');

    // Fetch purchase orders
    $query = DB::table('purchase_orders')
        ->select(
            'id',
            'po_number',
            'order_date',
            'expected_date',
            'status',
            'amount',
            'supplier_name'
        );

    // Apply status filter
    if ($status !== 'All') {
        $query->where('status', $status);
    }

    // Apply date filter
    if ($date) {
        $query->whereDate('order_date', $date);
    }

    $purchaseOrders = $query->orderBy('order_date', 'desc')->get();

    // Fetch items for each PO
    $purchaseOrders = $purchaseOrders->map(function ($po) {
        $items = DB::table('purchase_order_items')
            ->where('purchase_order_id', $po->id)
            ->select('item_name', 'quantity', 'received_quantity')
            ->get()
            ->map(function ($item) {
                $item->quantity = number_format($item->quantity);
                $item->received_quantity = number_format($item->received_quantity);
                return $item;
            });
    
        $po->items = $items;
        return $po;
    });

    // Generate filename
    $fileName = "Purchase_Order_Report_" 
        . ($status !== 'All' ? str_replace(' ', '_', $status) : 'All') 
        . "_{$dateNow}.pdf";

    // Generate PDF using Blade view
    $pdf = Pdf::loadView('pdfs.purchase_order_report', [
        'purchaseOrders' => $purchaseOrders,
        'status' => $status,
        'selectedDate' => $date,
        'generatedAt' => Carbon::now()->format('F j, Y, g:i A'),
    ])->setPaper('a4', 'landscape');

    return $pdf->download($fileName);
}



public function receivedItemsReportPDF(Request $request)
{
    try {
        $supplier = $request->query('supplier', 'All');
        $month = $request->query('month'); // format: YYYY-MM
        $dateNow = Carbon::now()->format('mdY');

        // Base query: join purchase_receipts with purchase_orders
        $query = DB::table('purchase_receipts as pr')
            ->join('purchase_orders as po', 'po.id', '=', 'pr.purchase_order_id')
            ->select(
                'pr.item_name',
                'po.po_number',
                'po.supplier_name',
                'pr.received_date',
                'pr.quantity_received'
            );

        // Month filter
        if ($month) {
            $query->where('pr.received_date', 'like', "$month%");
        }

        // Supplier filter
        if ($supplier !== 'All') {
            $query->where('po.supplier_name', $supplier);
        }

        // Fetch data
        $receivedItems = $query->orderBy('pr.received_date', 'desc')->get();

        // Format quantity_received
        $receivedItems = $receivedItems->map(function ($item) {
            $item->quantity_received = number_format($item->quantity_received ?? 0);
            return $item;
        });

        // File name
        $cleanSupplier = $supplier !== 'All' ? str_replace(' ', '_', $supplier) : 'All';
        $dateStr = $month ? str_replace('-', '', $month) : $dateNow;
        $fileName = "Received_Items_Report_{$cleanSupplier}_{$dateStr}.pdf";

        // Generate PDF
        return Pdf::loadView('pdfs.received_items_report', [
            'receivedItems' => $receivedItems,
            'supplier' => $supplier,
            'month' => $month,
            'generatedAt' => Carbon::now()->format('F j, Y, g:i A'),
        ])
        ->setPaper('a4', 'landscape')
        ->download($fileName);

    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile()
        ], 500);
    }
}
}
