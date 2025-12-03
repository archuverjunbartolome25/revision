<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Customer;
use App\Models\Employee;

class SalesOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'customer_id',
        'location',
        'products',
        'quantities',
        'amount',
        'date',
        'delivery_date',
        'order_type',
       
        'status',
        'date_delivered',
    ];

    protected $casts = [
        'products'   => 'array',
        'quantities' => 'array',
        'date'       => 'date',
        'delivery_date' => 'date',
        'date_delivered' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}

