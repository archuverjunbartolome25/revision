<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with(['creator', 'performer']);

        // Optional filters
        if ($request->has('module')) {
            $query->where('module', $request->module);
        }

        if ($request->has('record_id')) {
            $query->where('record_id', $request->record_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $logs
        ]);
    }

  
    public function getByRecord(Request $request)
    {
        $request->validate([
            'module' => 'required|string',
            'record_id' => 'required|integer',
        ]);

        $logs = AuditLog::with(['creator', 'performer'])
            ->where('module', $request->module)
            ->where('record_id', $request->record_id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'data' => $logs
        ]);
    }

   
    public function getByModule($module)
    {
        $logs = AuditLog::with(['creator', 'performer'])
            ->where('module', $module)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $logs
        ]);
    }

   
    public function show($id)
    {
        $log = AuditLog::with(['creator', 'performer'])->findOrFail($id);

        return response()->json([
            'data' => $log
        ]);
    }

   
    public function getByCreator($userId)
    {
        $logs = AuditLog::with(['creator', 'performer'])
            ->where('created_by', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $logs
        ]);
    }

    public function getByPerformer($userId)
    {
        $logs = AuditLog::with(['creator', 'performer'])
            ->where('performed_by', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $logs
        ]);
    }
}