export function GET() {
  return Response.json({ ready: false, environment: 'disabled' });
}
