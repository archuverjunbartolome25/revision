<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ReturnToVendor;
use App\Models\ReturnToVendorItem;
use Illuminate\Support\Facades\DB;

class ReturnToVendorController extends Controller
{
    /**
     * Get all Return to Vendor records with items
     */
    // public function index()
    // {
    //     $returns = ReturnToVendor::with([
    //         'customer:id,name',
    //         'items.product:id,item,unit'
    //     ])->orderByDesc('date_returned')->get();

    //     return response()->json($returns);
    // }

    function index()
    {
        // 1️⃣ Customer Returns
        $returnToVendor = ReturnToVendor::with([
            'customer:id,name',             
            'items.productable:id,item,unit'  
        ])
        ->whereNotNull('customer_id')
        ->orderByDesc('date_returned')
        ->get();
    
        // 2️⃣ Supplier Returns
        $returnToSupplier = ReturnToVendor::with([
            'supplier:id,name,address',
            'items.productable:id,item,unit'
        ])
        ->whereNotNull('supplier_id')
        ->orderByDesc('date_returned')
        ->get();
    
        return response()->json([
            'returnToVendor'   => $returnToVendor,
            'returnToSupplier' => $returnToSupplier,
        ]);
    }

    /**
     * Get total count for dashboard
     */
    public function count()
    {
        $count = ReturnToVendor::count();
        return response()->json(['count' => $count]);
    }

    /**
     * Store new Return to Vendor record (dynamic)
     */
// public function store(Request $request)
// {
//     $validated = $request->validate([
//         'rtv_number'    => 'nullable|string|max:255',
//         'customer_id'   => 'required|integer|exists:customers,id',
//         'location'      => 'nullable|string',
//         'date_ordered'  => 'required|date',
//         'date_returned' => 'required|date',
//         'products'      => 'required|array',
//         'products.*.product_id' => 'required|integer|exists:inventories,id',
//         'products.*.quantity'   => 'required|integer|min:1',
//         'status'        => 'nullable|string|in:Pending,Approved',
//     ]);

//     DB::beginTransaction();
//     try {
//         // Create Return Record
//         $return = ReturnToVendor::create([
//             'rtv_number'    => $validated['rtv_number'] ?? null,
//             'customer_id'   => $validated['customer_id'],
//             'location'      => $validated['location'] ?? '',
//             'date_ordered'  => $validated['date_ordered'],
//             'date_returned' => $validated['date_returned'],
//             'status'        => $validated['status'] ?? 'Pending',
//         ]);

//         // Attach products dynamically
//         foreach ($validated['products'] as $product) {
//             // Insert into return_to_vendor_items
//             $item = ReturnToVendorItem::create([
//                 'return_id'  => $return->id, // ✅ correct column
//                 'product_id' => $product['product_id'],
//                 'quantity'   => $product['quantity'],
//             ]);

//             // Deduct from inventory
//             DB::table('inventories')
//                 ->where('id', $product['product_id'])
//                 ->decrement('quantity', $product['quantity']);
//         }

//         DB::commit();

//         return response()->json([
//             'message' => 'Return to Vendor record saved successfully.',
//             'data'    => $return->load('items.product')
//         ], 201);

//     } catch (\Exception $e) {
//         DB::rollBack();
//         return response()->json([
//             'error'   => 'Failed to save record.',
//             'message' => $e->getMessage()
//         ], 500);
//     }
// }

    public function store(Request $request)
    {
        $validated = $request->validate([
        'customer_id'   => 'required|integer|exists:customers,id', // must have a customer
        'location'      => 'nullable|string',
        'date_ordered'  => 'required|date',
        'date_returned' => 'required|date',
        'products'      => 'required|array|min:1',
        'products.*.product_id' => 'required|integer',
        'products.*.quantity'   => 'required|integer|min:1',
        'status'        => 'nullable|string|in:Pending,Approved',
        ]);

        DB::beginTransaction();

        try {
            // 2️⃣ Generate RTV number
            $datePart = now()->format('Ymd');
            $randomPart = rand(1000, 9999);
            $rtvNumber = "RTV-{$datePart}-{$randomPart}";

            // 3️⃣ Create ReturnToVendor record
            $return = ReturnToVendor::create([
                'rtv_number'    => $rtvNumber,
                'customer_id'   => $validated['customer_id'],
                'supplier_id'   => null, // always customer RTV
                'location'      => $validated['location'] ?? '',
                'date_ordered'  => $validated['date_ordered'],
                'date_returned' => $validated['date_returned'],
                'status'        => $validated['status'] ?? 'Pending',
            ]);

            // 4️⃣ Create ReturnToVendorItem records
            foreach ($validated['products'] as $product) {
                ReturnToVendorItem::create([
                    'return_id'    => $return->id,
                    'product_id'   => $product['product_id'],
                    'product_type' => 'finished', // always finished for customer returns
                    'quantity'     => $product['quantity'],
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Return to Vendor (finished goods) recorded successfully.',
                'data'    => $return->load('items'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Failed to record Return to Vendor.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }



    /**
     * Delete selected Return to Vendor records
     */
    public function destroy(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['error' => 'No records selected.'], 400);
        }

        $deleted = ReturnToVendor::whereIn('id', $ids)->delete();

        if ($deleted) {
            return response()->json(['message' => 'Record(s) deleted successfully.']);
        }

        return response()->json(['error' => 'No records were deleted.'], 404);
    }

    /**
     * Update Return to Vendor status
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Approved',
        ]);

        $return = ReturnToVendor::find($id);
        if (!$return) {
            return response()->json(['error' => 'Record not found.'], 404);
        }

        $return->status = $validated['status'];
        $return->save();

        return response()->json(['message' => 'Status updated successfully.']);
    }
}
