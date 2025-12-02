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

            if ($log->type === 'Finished Goods') {
                $inventory = Inventory::where('item', $log->item_name)->first();
                $unit = $inventory ? $inventory->unit : 'pieces';
                $pcsPerUnit = $inventory ? $inventory->pcs_per_unit : 1;
            } else {
                $inventory = InventoryRawMat::where('item', $log->item_name)->first();
                $unit = 'pieces';
                $pcsPerUnit = 1; 
            }


            $log->pcs_per_unit = $pcsPerUnit;
            $log->unit = $unit;

            return $log;
        });

        return response()->json([
            'success' => true,
            'count' => $enhancedLogs->count(),
            'data' => $enhancedLogs,
        ]);
    }
}
