<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class AuditLog extends Model
{
    protected $fillable = [
        'module',
        'record_id',
        'action',
        'status',
        'created_by',
        'performed_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}