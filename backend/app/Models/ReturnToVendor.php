<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnToVendor extends Model
{
    use HasFactory;

    protected $table = 'return_to_vendor';

    protected $fillable = [
        'rtv_number',
        'customer_id',
        'supplier_id',
        'location',
        'date_ordered',
        'date_returned',
        'status',
        'qty_350ml',
        'qty_500ml',
        'qty_1l',
        'qty_6l',
    ];

    // Relationship to Customer
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function supplier()
        {
            return $this->belongsTo(Supplier::class);
        }

    // Relationship to items (dynamic)
    public function items()
    {
        return $this->hasMany(ReturnToVendorItem::class, 'return_id'); // match your DB column
    }


    public function getReturnTypeAttribute()
{
    if ($this->customer_id) {
        return 'from_customer';
    } elseif ($this->supplier_id) {
        return 'to_supplier';
    } else {
        return 'unknown';
    }
}
}
