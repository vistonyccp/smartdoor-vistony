export async function onRequestPost(context) {
  // 1. CABECERAS CORS GLOBALES
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  };

  try {
    const request = context.request;
    const env = context.env;

    // Leer los datos del formulario binario que envía el HTML
    const formData = await request.formData();
    const fotoArchivo = formData.get('foto');

    if (!fotoArchivo) {
      return new Response(JSON.stringify({ error: "Falta el archivo de imagen" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // En Cloudflare Pages, las variables de entorno se sacan de context.env
    const token = env.TELEGRAM_TOKEN; 
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return new Response(JSON.stringify({ error: "Faltan secretos de Telegram en Cloudflare" }), { 
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const urlTelegram = `https://api.telegram.org/bot${token}/sendPhoto`;

    // Empaquetar formulario binario para Telegram
    const telegramForm = new FormData();
    telegramForm.append('chat_id', chatId);
    telegramForm.append('photo', fotoArchivo);
    telegramForm.append('caption', `🔔 *¡ALERTA DE TIMBRE SMARTDOOR!*\n👤 Un cliente se encuentra en la puerta principal.\n⏰ Hora: ${new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}`);
    telegramForm.append('parse_mode', 'Markdown');

    const respuestaTelegram = await fetch(urlTelegram, {
      method: "POST",
      body: telegramForm
    });

    const datosTelegram = await respuestaTelegram.json();

    if (datosTelegram.ok) {
      return new Response(JSON.stringify({ status: "success" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ error: datosTelegram.description }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
}

// Interceptor para solicitudes OPTIONS (CORS Preflight)
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    }
  });
}