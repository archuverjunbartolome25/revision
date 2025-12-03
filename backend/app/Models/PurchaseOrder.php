<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    public function items(){
        return $this->hasMany(PurchaseOrderItem::class);
    }

    protected $fillable = [
        'po_number',
        'supplier_name',

        'order_date',
        'expected_date',
        'status',
        'amount',
    ];


    public function supplier()
    {
        return $this->belongsTo(\App\Models\Supplier::class, 'supplier_id');
    }

    // public function receipts()
    // {
    //     return $this->hasManyThrough(
    //         PurchaseReceipt::class,
    //         PurchaseOrderItem::class,
    //         'purchase_order_id',       
    //         'purchase_order_item_id',  
    //         'id',                     
    //     );
    // }
}
