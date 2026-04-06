// ─────────────────────────────────────────────
//  api/submit.js — Logyx Lead Capture
//  Roda na Vercel gratuitamente, 24/7, sem dormir
//  Recebe o formulário e salva direto no Notion
// ─────────────────────────────────────────────

export default async function handler(req, res) {

  // ── 1. Só aceita POST ──────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // ── 2. Pega os dados do formulário ─────────
  const {
    nome,
    empresa,
    whatsapp,
    tipo_negocio,
    dor_principal,
    urgencia,
  } = req.body;

  // ── 3. Valida os campos obrigatórios ───────
  if (!nome || !whatsapp) {
    return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios' });
  }

  // ── 4. Pega o token e o database ID ────────
  //    (ficam nas variáveis de ambiente da Vercel,
  //     nunca diretamente no código)
  const NOTION_TOKEN       = process.env.NOTION_TOKEN;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
  }

  // ── 5. Monta e envia para a API do Notion ──
  try {
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization':   `Bearer ${NOTION_TOKEN}`,
        'Notion-Version':  '2022-06-28',
        'Content-Type':    'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {

          // ── Campos do Notion ───────────────
          //    Os nomes aqui DEVEM ser idênticos
          //    aos do seu database (maiúsculas incluídas)

          'Nome': {
            title: [{ text: { content: nome || '' } }]
          },
          'Empresa': {
            rich_text: [{ text: { content: empresa || '' } }]
          },
          'WhatsApp': {
            phone_number: whatsapp || ''
          },
          'Tipo Negócio': {
            select: { name: tipo_negocio || 'Outro' }
          },
          'Dor Principal': {
            rich_text: [{ text: { content: dor_principal || '' } }]
          },
          'Urgência': {
            select: { name: urgencia || 'Ainda avaliando' }
          },
          'Status Lead': {
            // Certifique-se de que "Status Lead" no Notion
            // é do tipo "Status" (não Select)
            status: { name: 'Novo Lead' }
          },
          'Data Entrada': {
            date: {
              start: new Date().toISOString().split('T')[0]
            }
          },
          'Origem': {
            select: { name: 'Landing Page' }
          },

        },
      }),
    });

    // ── 6. Verifica se o Notion aceitou ───────
    if (!notionRes.ok) {
      const errorData = await notionRes.json();
      console.error('Erro do Notion:', errorData);
      return res.status(500).json({
        error: 'Falha ao salvar no Notion',
        detail: errorData.message,
      });
    }

    // ── 7. Sucesso! ───────────────────────────
    return res.status(200).json({ ok: true, message: 'Lead salvo com sucesso' });

  } catch (err) {
    console.error('Erro inesperado:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
