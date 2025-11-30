<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryNotification extends Model
{
    use HasFactory;

    protected $table = 'inventory_notifications';

    protected $fillable = [
        'notifiable_type',
        'notifiable_id',
        'item_name',
        'priority',
        'current_quantity',
        'low_stock_alert',
        'unit',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'current_quantity' => 'decimal:2',
        'low_stock_alert' => 'decimal:2',
    ];

    public $timestamps = true;

    /**
     * Get the notifiable model (Inventory or InventoryRawMat)
     */
    public function notifiable()
    {
        return $this->morphTo();
    }

    /**
     * Scope to get unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope to get critical notifications
     */
    public function scopeCritical($query)
    {
        return $query->where('priority', 'critical');
    }

    /**
     * Scope to get warning notifications
     */
    public function scopeWarning($query)
    {
        return $query->where('priority', 'warning');
    }

    /**
     * Mark notification as read
     */
    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    /**
     * Get priority color for UI
     */
    public function getPriorityColorAttribute()
    {
        return $this->priority === 'critical' ? 'red' : 'yellow';
    }

    /**
     * Get priority badge class for Bootstrap/Tailwind
     */
    public function getPriorityBadgeClassAttribute()
    {
        return $this->priority === 'critical' ? 'badge-danger' : 'badge-warning';
    }

    /**
     * Get human-readable priority text
     */
    public function getPriorityTextAttribute()
    {
        return $this->priority === 'critical' ? 'Critical Stock' : 'Low Stock Warning';
    }
}