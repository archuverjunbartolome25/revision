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


    public function supplierOffers()
    {
        return $this->hasMany(SupplierOffer::class, 'rawmat_id');
    }
}
