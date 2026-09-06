import axios from 'axios';

/**
 * Função utilitária para seguir redirecionamento se for link curto e extrair o itemId de URLs da Shopee.
 */
export async function resolveShopeeUrlAndExtractItemId(url: string): Promise<string> {
  let finalUrl = url;

  // Se for link encurtado, segue o redirecionamento
  if (url.includes('s.shopee.com.br') || url.includes('shope.ee')) {
    try {
      // Faz uma requisição GET com responseType 'stream' para pegar apenas os headers e a URL final sem baixar o body
      const response = await axios.get(url, {
        maxRedirects: 10,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });
      
      if (response.request?.res?.responseUrl) {
        finalUrl = response.request.res.responseUrl;
      }
    } catch (error: any) {
      console.error('[URL_HELPER] Erro ao resolver redirecionamento do link curto:', error.message);
    }
  }

  // Extrai o itemId usando expressões regulares robustas
  // 1. Padrão clássico de produto Shopee: -i.shopId.itemId (ex: -i.1234567.987654321)
  const pattern1 = /-i\.(\d+)\.(\d+)/;
  const match1 = finalUrl.match(pattern1);
  if (match1 && match1[2]) {
    return match1[2];
  }

  // 2. Padrão alternativo: /product/shopId/itemId
  const pattern2 = /\/product\/(\d+)\/(\d+)/;
  const match2 = finalUrl.match(pattern2);
  if (match2 && match2[2]) {
    return match2[2];
  }

  // 3. Query string param: itemId=987654321
  try {
    const parsedUrl = new URL(finalUrl);
    const itemIdParam = parsedUrl.searchParams.get('itemId');
    if (itemIdParam && /^\d+$/.test(itemIdParam)) {
      return itemIdParam;
    }
  } catch {
    // Ignora URL inválida no parse de URL
  }

  // 4. Padrão mobile / short link resolvido: /shopName/shopId/itemId (ex: /opaanlp/960891164/22098878065)
  const pattern4 = /\/[a-zA-Z0-9_\-\.]+\/(\d+)\/(\d+)/;
  const match4 = finalUrl.match(pattern4);
  if (match4 && match4[2]) {
    return match4[2];
  }

  // 5. Padrão direto de dois grupos numéricos: /shopId/itemId (ex: /960891164/22098878065)
  const pattern5 = /\/(\d+)\/(\d+)/;
  const match5 = finalUrl.match(pattern5);
  if (match5 && match5[2]) {
    return match5[2];
  }

  throw new Error(`Não foi possível extrair o itemId da URL informada: ${finalUrl}`);
}
