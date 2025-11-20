<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionOutput extends Model
{
    use HasFactory;

    protected $table = 'production_outputs';

protected $fillable = [
    'employee_id',
    'product_name',
    'quantity_pcs',        // total pieces produced
    'quantity',            // total units produced
    'materials_needed',    // JSON { material_name: qty_per_unit * units }
    'selected_suppliers',  // JSON { material_name: supplier_id }
    'batch_number',
    'production_date',
];
    protected $casts = [
        'materials_needed' => 'array',
        'selected_suppliers' => 'array',
        'production_date' => 'datetime',
    ];
}
