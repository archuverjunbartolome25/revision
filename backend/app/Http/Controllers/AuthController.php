<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        $request->validate([
            'employeeID' => 'required|string|unique:users',
            'password'  => 'required|string|min:6',
        ]);

        $user = User::create([
            'employeeID' => $request->employeeID,
            'password'  => Hash::make($request->password),
            'status'    => 'Active', // default to Active
        ]);

        return response()->json(['user' => $user], 201);
    }

    /**
     * Login user.
     */

    public function login(Request $request)
    {
        $request->validate([
            'employeeID' => 'required|string',
            'password'   => 'required|string',
        ]);
    
        Log::info('Login attempt', ['employeeID' => $request->employeeID]);
    
        $user = User::where('employeeID', $request->employeeID)->first();
    
        if (!$user) {
            Log::warning('Login failed: user not found', ['employeeID' => $request->employeeID]);
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
    
        // Check if user is inactive first
        if ($user->status !== 'Active') {
            Log::warning('Login failed: account inactive', [
                'employeeID' => $request->employeeID,
                'status' => $user->status
            ]);
            return response()->json([
                'message' => 'Account is inactive. Please contact admin.'
            ], 403);
        }
    
        // Then check password
        if (!Hash::check($request->password, $user->password)) {
            Log::warning('Login failed: wrong password', ['employeeID' => $request->employeeID]);
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
    
        $token = $user->createToken('auth_token')->plainTextToken;
    
        Log::info('Login successful', [
            'employeeID' => $request->employeeID,
            'role' => $user->role
        ]);
    
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'employeeID'   => $user->employeeID,
            'role'         => $user->role,
            'status'       => $user->status,
        ]);
    }
    

    /**
     * Logout user.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    /**
     * Get current authenticated user.
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Fetch all users.
     */
    public function allUsers()
    {
        return response()->json(
            User::select('id', 'employeeID', 'role', 'status', 'created_at')->get()
        );
    }

    /**
     * Fetch a user by employeeID.
     */
    public function showByEmployeeID($employeeID)
    {
        $user = User::where('employeeID', $employeeID)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'id'         => $user->id,
            'employeeID' => $user->employeeID,
            'name'       => $user->name ?? '',
            'email'      => $user->email ?? '',
            'role'       => $user->role,
            'status'     => $user->status,
        ]);
    }

    /**
     * Change password for logged-in user.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6|confirmed', // requires new_password_confirmation
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 403);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully']);
    }
}
