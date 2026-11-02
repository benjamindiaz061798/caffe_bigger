// Initialization is complete. Administrative bootstrap code is no longer deployed.
Deno.serve(() => new Response("Initialization completed", { status: 410 }));
