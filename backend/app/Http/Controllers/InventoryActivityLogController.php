<?php

namespace App\Http\Controllers;

use App\Models\InventoryActivityLog;
use App\Models\Inventory;
use App\Models\InventoryRawMat;
use Illuminate\Http\Request;

class InventoryActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryActivityLog::query();

        // Apply optional filters
        if ($request->has('module')) {
            $query->where('module', $request->module);
        }
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Fetch logs sorted newest first
        $logs = $query->orderBy('processed_at', 'desc')->get();

        $enhancedLogs = $logs->map(function ($log) {

            // Get current remaining quantity in pieces
            if ($log->type === 'Finished Goods') {
                $inventory = Inventory::where('item', $log->item_name)->first();
                $currentQty = $inventory ? $inventory->quantity_pcs : 0;
            } else {
                $inventory = InventoryRawMat::where('item', $log->item_name)->first();
                $currentQty = $inventory ? $inventory->quantity_pieces : 0;
            }

            // Log quantity in pieces
            $logQty = $log->quantity_pcs ?? $log->quantity;

            // Previous quantity = what inventory had before this process
            $previous = $currentQty - $logQty;

            // Remaining quantity = current inventory
            $remaining = $currentQty;

            $log->previous_quantity = $previous;
            $log->quantity = $logQty;
            $log->remaining_quantity = $remaining;

            return $log;
        });

        return response()->json([
            'success' => true,
            'count' => $enhancedLogs->count(),
            'data' => $enhancedLogs,
        ]);
    }
}
