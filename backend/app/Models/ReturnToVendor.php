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
        'location',
        'date_ordered',
        'date_returned',
        'status',
    ];

    // Relationship to Customer
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // Relationship to items (dynamic)
public function items()
{
    return $this->hasMany(ReturnToVendorItem::class, 'return_id'); // match your DB column
}

}
