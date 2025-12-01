<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inventory extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inventories';

    protected $fillable = [
        'item', 
        'unit', 
        'unit_cost', 
        'pcs_per_unit', 
        'quantity', 
        'quantity_pcs', 
        'low_stock_alert', 
        'materials_needed',
        'selected_materials'
    ];
    
    protected $casts = [
        'materials_needed' => 'array',
        'selected_materials' => 'array',
    ];
    
    public $timestamps = true; 

    public function notifications()
    {
        return $this->morphMany(InventoryNotification::class, 'notifiable');
    }

    public function activeNotification()
    {
        return $this->morphOne(InventoryNotification::class, 'notifiable')
                    ->where('is_read', false)
                    ->latest();
    }

    public function hasLowStock(): bool
    {
        if (!$this->low_stock_alert || $this->low_stock_alert <= 0) {
            return false;
        }
        
        return $this->quantity <= $this->low_stock_alert;
    }
  
    public function hasWarningStock(): bool
    {
        if (!$this->low_stock_alert || $this->low_stock_alert <= 0) {
            return false;
        }
        
        $warningThreshold = $this->low_stock_alert * 1.5;
        return $this->quantity > $this->low_stock_alert && $this->quantity <= $warningThreshold;
    }

    public function getStockStatus(): string
    {
        if ($this->hasLowStock()) {
            return 'critical';
        }
        
        if ($this->hasWarningStock()) {
            return 'warning';
        }
        
        return 'normal';
    }
  
    public function getStockStatusColor(): string
    {
        return match($this->getStockStatus()) {
            'critical' => 'red',
            'warning' => 'yellow',
            default => 'green'
        };
    }

    public function returnToVendorItems()
    {
        return $this->hasMany(ReturnToVendorItem::class, 'product_id');
    }
}