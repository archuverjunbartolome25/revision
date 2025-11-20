<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
public function up()
{
    Schema::table('inventories', function (Blueprint $table) {
        $table->integer('pcs_per_unit')->default(1); // default 1 if no conversion
    });
}

public function down()
{
    Schema::table('inventories', function (Blueprint $table) {
        $table->dropColumn('pcs_per_unit');
    });
}

};
