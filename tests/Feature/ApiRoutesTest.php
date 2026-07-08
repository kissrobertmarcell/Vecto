<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_route_is_available(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk();
        $response->assertExactJson(['status' => 'ok']);
    }

    public function test_auth_routes_allow_registration_and_login(): void
    {
        $registerResponse = $this->postJson('/api/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $registerResponse->assertCreated();
        $registerResponse->assertJsonPath('data.email', 'jane@example.com');

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'jane@example.com',
            'password' => 'password',
        ]);

        $loginResponse->assertOk();
        $loginResponse->assertJsonPath('data.email', 'jane@example.com');
    }

    public function test_protected_routes_require_authentication(): void
    {
        $response = $this->getJson('/api/dashboard');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_access_protected_routes(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/dashboard');

        $response->assertOk();
    }
}
