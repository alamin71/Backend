export const welcome = () => {
  const date = new Date(Date.now());
  const hours = date.getHours();
  let greeting = '';

  // Time-based greeting
  if (hours < 12) {
    greeting = 'Good morning. Welcome to the No-Shorts backend.';
  } else if (hours < 18) {
    greeting = 'Good afternoon. Welcome to the No-Shorts backend.';
  } else {
    greeting = 'Good evening. Welcome to the No-Shorts backend.';
  }

  return `
      <div style="text-align:center; font-family: 'Verdana', sans-serif; color:#2F4F4F; padding: 40px 20px; border-radius: 8px; box-shadow: 0 0 12px rgba(0, 0, 0, 0.06); max-width: 900px; margin: 20px auto; animation: fadeIn 1s;">
        <h1 style="font-size: 40px; color: #2E8B57; margin-bottom: 6px;">No-Shorts Backend</h1>
        <p style="font-size: 20px; color: #333; margin-top: 0;">${greeting}</p>
        <p style="font-size: 16px; color: #555;">Current date and time: <strong style="color: #2E8B57;">${date}</strong></p>

        <div style="margin-top: 24px; text-align:left; display:inline-block; max-width:680px; width:100%;">
          <h3 style="font-size:18px; color:#333; margin-bottom:6px;">Status</h3>
          <ul style="font-size:15px; padding-left:18px; color:#444;">
            <li>Server: running</li>
            <li>API prefix: <code>/api/v1</code></li>
            <li>Static folders: <code>/uploads</code>, <code>/public</code></li>
          </ul>
        </div>

        <div style="margin-top:20px; text-align:left; display:inline-block; max-width:680px; width:100%;">
          <h3 style="font-size:18px; color:#333; margin-bottom:6px;">Developer Notes</h3>
          <ol style="font-size:15px; color:#444; padding-left:18px;">
            <li>Use HTTP at port 5000 (no TLS here).</li>
            <li>For production TLS, put an nginx reverse proxy with certificates.</li>
            <li>Check logs with <code>pm2 logs backend-app</code>.</li>
          </ol>
        </div>
      </div>
  
      <style>
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
  
        @keyframes scaleUp {
          from {
            transform: scale(0.8);
          }
          to {
            transform: scale(1);
          }
        }
  
        @keyframes slideIn {
          from {
            transform: translateX(-50px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;
};
