<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryRawMat extends Model
{
    protected $table = 'inventory_rawmats';

    protected $fillable = [
        'item',
        'unit',
        'quantity',
        'quantity_pieces',
        'conversion',
        'low_stock_alert',
        'unit_cost',
        'supplier_id',
        'price',
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

    public function supplierOffers()
    {
        return $this->hasMany(SupplierOffer::class, 'rawmat_id');
    }
}