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
        'product_type', 
        'quantity',
    ];


    public function productable()
    {
        return $this->morphTo();
    }


    public function return()
    {
        return $this->belongsTo(ReturnToVendor::class, 'return_id');
    }
}