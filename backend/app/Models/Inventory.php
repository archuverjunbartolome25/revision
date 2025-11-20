<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inventory extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inventories';

    // ✅ Add 'low_stock_alert' here
    protected $fillable = ['item', 'unit', 'pcs_per_unit', 'quantity', 'quantity_pcs', 'low_stock_alert'];
    
    protected $casts = [
    'materials_needed' => 'array',
];
public function returnToVendorItems()
{
    return $this->hasMany(ReturnToVendorItem::class, 'product_id');
}
    public $timestamps = true; 
}
