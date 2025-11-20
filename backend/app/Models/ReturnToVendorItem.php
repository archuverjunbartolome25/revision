<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnToVendorItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'return_id',
        'product_id',
        'quantity',
    ];

    // Relationship to Inventory product
    public function product()
    {
        return $this->belongsTo(Inventory::class, 'product_id');
    }

    // Relationship back to ReturnToVendor
public function return() {
    return $this->belongsTo(ReturnToVendor::class, 'return_id');
}

}
