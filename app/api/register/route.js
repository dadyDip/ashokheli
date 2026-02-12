import { register } from '@/server/auth/auth.controller';

export async function POST(request) {
  try {
    const body = await request.json();
    return register({ body }, {
      json: (data) => new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }),
      status: (code) => ({
        json: (data) => new Response(JSON.stringify(data), {
          status: code,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}