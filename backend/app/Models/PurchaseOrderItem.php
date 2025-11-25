<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'item_name',
        'item_type',
        'quantity',
        'received_quantity',
        'unit_cost',
        'total_amount',
    ];

    public function order()
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    // // Relationship to purchase receipts
    // public function receipts()
    // {
    //     return $this->hasMany(PurchaseReceipt::class, 'purchase_order_item_id');
    // }
}
