<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryRawMat;
use App\Models\InventoryNotification;
use Illuminate\Http\Request;

class InventoryNotificationController extends Controller
{
    protected $notificationService;



    public function index(Request $request)
    {
        $query = InventoryNotification::with('notifiable')
            ->orderBy('created_at', 'desc'); // <-- latest first
    
        // Filter by unread
        if ($request->get('unread')) {
            $query->unread();
        }
    
        // Filter by priority
        if ($request->get('priority')) {
            $query->where('priority', $request->get('priority'));
        }
    
        // Filter by type
        if ($request->get('type')) {
            if ($request->get('type') === 'inventory') {
                $query->where('notifiable_type', 'App\Models\Inventory');
            } elseif ($request->get('type') === 'rawmat') {
                $query->where('notifiable_type', 'App\Models\InventoryRawMat');
            }
        }
    
        $notifications = $query->get(); // get all notifications
    
        // Counts
        $unreadCount = InventoryNotification::unread()->count();
        $criticalCount = InventoryNotification::critical()->count();
    
        return response()->json([
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
            'criticalCount' => $criticalCount,
        ]);
    }
    

    /**
     * Show specific notification with item details
     */
    public function show($id)
    {
        $notification = InventoryNotification::with('notifiable')->findOrFail($id);
        
        // Mark as read when viewing
        if (!$notification->is_read) {
            $notification->markAsRead();
        }

        return view('notifications.show', compact('notification'));
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        $notification = InventoryNotification::findOrFail($id);
        $notification->markAsRead();

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);
        }

        return back()->with('success', 'Notification marked as read');
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        InventoryNotification::unread()->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read'
            ]);
        }

        return back()->with('success', 'All notifications marked as read');
    }

    /**
     * Delete a notification
     */
    public function destroy($id)
    {
        $notification = InventoryNotification::findOrFail($id);
        $notification->delete();

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Notification deleted'
            ]);
        }

        return back()->with('success', 'Notification deleted');
    }

    /**
     * Get unread notifications count (for navbar badge)
     */
    public function getUnreadCount()
    {
        return response()->json([
            'count' => $this->notificationService->getUnreadCount(),
            'critical' => $this->notificationService->getCriticalCount(),
        ]);
    }

    /**
     * Get recent notifications for dropdown/navbar
     */
    public function getRecent()
    {
        $notifications = InventoryNotification::with('notifiable')
            ->unread()
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'item_name' => $notification->item_name,
                    'priority' => $notification->priority,
                    'priority_color' => $notification->priority_color,
                    'current_quantity' => $notification->current_quantity,
                    'low_stock_alert' => $notification->low_stock_alert,
                    'unit' => $notification->unit,
                    'type' => $notification->notifiable_type === 'App\Models\Inventory' ? 'Finished Good' : 'Raw Material',
                    'created_at' => $notification->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'notifications' => $notifications,
            'count' => $this->notificationService->getUnreadCount(),
            'critical' => $this->notificationService->getCriticalCount(),
        ]);
    }

    /**
     * Check stock manually (trigger the check)
     */
    public function checkStock()
    {
        $this->notificationService->checkAllInventory();

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Stock check completed',
                'unread' => $this->notificationService->getUnreadCount(),
                'critical' => $this->notificationService->getCriticalCount(),
            ]);
        }

        return back()->with('success', 'Stock levels checked and notifications updated');
    }

    /**
     * Get notification statistics
     */
    public function getStats()
    {
        $stats = [
            'total' => InventoryNotification::count(),
            'unread' => InventoryNotification::unread()->count(),
            'critical' => InventoryNotification::critical()->count(),
            'warning' => InventoryNotification::warning()->count(),
            'inventory_alerts' => InventoryNotification::where('notifiable_type', 'App\Models\Inventory')->count(),
            'rawmat_alerts' => InventoryNotification::where('notifiable_type', 'App\Models\InventoryRawMat')->count(),
        ];

        return response()->json($stats);
    }
}