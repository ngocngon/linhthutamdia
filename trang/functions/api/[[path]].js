// Mọi yêu cầu /api/* (kể cả WebSocket /api/play) trên tamdia.pages.dev → Worker linhthu-server qua service binding.
// Chuyển nguyên request: phương thức, tiêu đề (Origin, cf-connecting-ip, Authorization), thân, nâng cấp WebSocket.
export const onRequest = ({ request, env }) => env.SERVER.fetch(request);
