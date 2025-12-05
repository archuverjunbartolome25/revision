<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Disposal;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;


class DisposalController extends Controller
{
    /**
     * 🧾 Get all disposal records (latest first)
     */
    public function index()
    {
        $disposals = Disposal::orderByDesc('disposal_date')->get();

        return response()->json([
            'message' => 'Disposal records fetched successfully.',
            'data'    => $disposals
        ]);
    }

    /**
     * 🔍 Show single disposal record
     */
    public function show($id)
    {
        $disposal = Disposal::find($id);

        if (!$disposal) {
            return response()->json(['message' => 'Disposal not found'], 404);
        }

        return response()->json($disposal);
    }

    /**
     * ➕ Store a new disposal entry (default status = Pending)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'disposal_date' => 'required|date',
            'employee_id' => 'required|integer',
            'item_type'     => 'required|string',
            'item'          => 'required|string',
            'quantity'      => 'required|numeric|min:1',
            'reason'        => 'nullable|string|max:255',
        ]);
    
        DB::beginTransaction();
    
        try {
            // ✅ Auto-generate disposal_number
            $latest = Disposal::latest('id')->first();
            $nextNumber = $latest ? ((int)substr($latest->disposal_number, -4)) + 1 : 1;
            $disposalNumber = 'DIS-' . now()->format('Ymd') . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    
            $creatorId = \App\Models\User::where('id', $validated['employee_id'])->value('id');
    
            if (!$creatorId) {
                DB::rollBack();
                return response()->json(['error' => 'Invalid employee ID'], 422);
            }
    
            $disposal = Disposal::create([
                'disposal_number' => $disposalNumber,
                'disposal_date'   => $validated['disposal_date'],
                'employee_id'     => $validated['employee_id'], // Store as integer
                'item_type'       => $validated['item_type'],
                'item'            => $validated['item'],
                'quantity'        => $validated['quantity'],
                'reason'          => $validated['reason'] ?? null,
                'status'          => 'Pending',
            ]);
    
            // CREATE AUDIT LOG
            \App\Models\AuditLog::create([
                'module' => 'Disposal',
                'record_id' => $disposal->id,
                'action' => 'Created',
                'status' => 'Pending',
                'created_by' => $creatorId,
                'performed_by' => $creatorId,
            ]);
    
            DB::commit();
    
            return response()->json([
                'message' => 'Disposal recorded successfully.',
                'data'    => $disposal
            ], 201);
    
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    function getOriginalCreator($module, $recordId)
    {
        $firstLog = \App\Models\AuditLog::where('module', $module)
                            ->where('record_id', $recordId)
                            ->orderBy('created_at', 'asc')
                            ->first();
        
        return $firstLog ? $firstLog->created_by : null;
    }


    public function markDisposed(Request $request, $id)
    {
        $request->validate([
            'employee_id' => 'required|string',
        ]);
    
        DB::beginTransaction();
    
        try {
            $disposal = Disposal::find($id);
    
            if (!$disposal) {
                return response()->json(['message' => 'Disposal record not found.'], 404);
            }
    
            if ($disposal->status === 'Disposed') {
                return response()->json(['message' => 'Disposal already marked as Disposed.'], 400);
            }
    
            if ($disposal->item_type === 'Finished Goods') {
                $inventory = \App\Models\Inventory::where('item', $disposal->item)->first();
                $quantityField = 'quantity_pcs';
            } else { 
                $inventory = \App\Models\InventoryRawMat::where('item', $disposal->item)->first();
                $quantityField = 'quantity_pieces';
            }
    
            $previousQuantity = $inventory ? $inventory->$quantityField : 0;
    
            if ($inventory && isset($inventory->$quantityField)) {
                $inventory->$quantityField -= $disposal->quantity;
                if ($inventory->$quantityField < 0) {
                    $inventory->$quantityField = 0;
                }
                $inventory->save();
            }
    
            $disposal->update([
                'status'        => 'Disposed',
                'disposed_date' => now()->toDateString(),
                'disposed_time' => now()->toTimeString(),
            ]);
    
            \App\Models\InventoryActivityLog::create([
                'employee_id'       => $disposal->employee_id,
                'module'            => 'Disposal',
                'type'              => $disposal->item_type,
                'item_name'         => $disposal->item,
                'quantity'          => $disposal->quantity,
                'previous_quantity' => $previousQuantity,
                'remaining_quantity'=> $inventory ? $inventory->$quantityField : 0,
                'processed_at'      => now(),
            ]);
    
     
            $performerId = \App\Models\User::where('employeeID', $request->employee_id)->value('id');
    
            if (!$performerId) {
                DB::rollBack();
                return response()->json(['error' => 'Invalid employee ID'], 422);
            }
    
            $originalAuditLog = \App\Models\AuditLog::where('module', 'Disposal')
                                    ->where('record_id', $disposal->id)
                                    ->where('action', 'Created')
                                    ->orderBy('created_at', 'asc')
                                    ->first();
    
            if (!$originalAuditLog) {
                DB::rollBack();
                return response()->json(['error' => 'Disposal audit log not found'], 422);
            }
    
            $originalAuditLog->update([
                'status' => 'Disposed',
            ]);
    
            \App\Models\AuditLog::create([
                'module' => 'Disposal',
                'record_id' => $disposal->id,
                'action' => 'Mark as Disposed',
                'status' => 'Disposed',
                'created_by' => $originalAuditLog->created_by, 
                'performed_by' => $performerId,  
            ]);
    
            DB::commit();
    
            return response()->json([
                'message' => 'Disposal marked as Disposed and pieces deducted successfully.',
                'data'    => $disposal
            ]);
    
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🗑️ Delete multiple disposal records
     */
    public function destroy(Request $request)
    {
        $ids = $request->input('ids');
        $type = $request->input('item_type'); // "Finished Goods" or "Raw Materials"

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No IDs provided.'], 400);
        }

        if (!$type) {
            return response()->json(['message' => 'Item type not specified.'], 400);
        }

        $deleted = Disposal::whereIn('id', $ids)
            ->where('item_type', $type)
            ->delete();

        return response()->json([
            'message' => $deleted
                ? 'Selected disposal records deleted successfully.'
                : 'No matching records found.',
        ]);
    }
        public function generatePDF(Request $request)
    {
        $query = Disposal::query();

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->date) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->search) {
            $query->where('item_name', 'like', '%' . $request->search . '%');
        }

        $disposals = $query->get();

        $pdf = Pdf::loadView('reports.disposals', compact('disposals'))
            ->setPaper('a4', 'landscape');

        return $pdf->download('disposals_report.pdf');
    }
}
