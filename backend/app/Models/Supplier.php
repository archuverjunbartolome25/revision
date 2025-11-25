<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = ['name', 'contact_person', 'email', 'phone', 'address', 'tin'];
    public function offers()
{
    return $this->hasMany(SupplierOffer::class);
}
}
